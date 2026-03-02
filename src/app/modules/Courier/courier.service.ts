import { PrismaClient } from '@prisma/client';
import steadfastClient from '../../lib/steadfast.client';
import {
  ICreateShipmentPayload,
  IWebhookPayload,
  IAssignDeliveryMan,
  IWithdrawalRequest,
} from './courier.interface';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

const prisma = new PrismaClient();

const createShipment = async (payload: ICreateShipmentPayload) => {
  // Check if order exists
  const order = await prisma.order.findUnique({
    where: { id: payload.orderId },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (!order.orderNumber) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Order must have an order number');
  }

  // Check if shipment already exists for this order
  const existingShipment = await prisma.shipment.findUnique({
    where: { orderId: payload.orderId },
  });

  if (existingShipment) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Shipment already exists for this order'
    );
  }

  // Use orderNumber as invoice
  const invoice = order.orderNumber;

  // Check if invoice is unique in shipments
  const invoiceExists = await prisma.shipment.findUnique({
    where: { invoice },
  });

  if (invoiceExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invoice already exists');
  }

  try {
    // Create order in Steadfast
    const steadfastResponse = await steadfastClient.createOrder({
      invoice,
      recipient_name: payload.recipientName,
      recipient_phone: payload.recipientPhone,
      alternative_phone: payload.alternativePhone,
      recipient_email: payload.recipientEmail,
      recipient_address: payload.recipientAddress,
      cod_amount: payload.codAmount,
      note: payload.note,
      item_description: payload.itemDescription,
      total_lot: payload.totalLot,
      delivery_type: payload.deliveryType,
    });

    // Store shipment in database
    const shipment = await prisma.shipment.create({
      data: {
        orderId: payload.orderId,
        invoice,
        consignmentId: steadfastResponse.consignment.consignment_id.toString(),
        trackingCode: steadfastResponse.consignment.tracking_code,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        alternativePhone: payload.alternativePhone,
        recipientEmail: payload.recipientEmail,
        recipientAddress: payload.recipientAddress,
        codAmount: payload.codAmount,
        deliveryStatus: steadfastResponse.consignment.status,
        note: payload.note,
        itemDescription: payload.itemDescription,
        totalLot: payload.totalLot,
        deliveryType: payload.deliveryType || 0,
        providerPayload: steadfastResponse as any,
        lastUpdatedAt: new Date(steadfastResponse.consignment.updated_at),
      },
      include: {
        order: true,
      },
    });

    // Update order status to SHIPPED with note
    await prisma.order.update({
      where: { id: payload.orderId },
      data: { 
        status: 'SHIPPED',
        statusNote: 'Your order has been shipped and is on the way to you.'
      },
    });

    return shipment;
  } catch (error: any) {
    // Store failed shipment attempt
    await prisma.shipment.create({
      data: {
        orderId: payload.orderId,
        invoice,
        recipientName: payload.recipientName,
        recipientPhone: payload.recipientPhone,
        alternativePhone: payload.alternativePhone,
        recipientEmail: payload.recipientEmail,
        recipientAddress: payload.recipientAddress,
        codAmount: payload.codAmount,
        deliveryStatus: 'failed',
        note: payload.note,
        itemDescription: payload.itemDescription,
        totalLot: payload.totalLot,
        deliveryType: payload.deliveryType || 0,
        providerPayload: {
          error: error.message,
          responseData: error.data || null,
        } as any,
      },
    });

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || 'Failed to create shipment in Steadfast'
    );
  }
};

const getShipmentByOrderId = async (orderId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { orderId },
    include: {
      order: true,
      courierEvents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!shipment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipment not found');
  }

  return shipment;
};

const getAllShipments = async (filters: any) => {
  const { deliveryStatus, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (deliveryStatus) {
    where.deliveryStatus = deliveryStatus;
  }

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shipment.count({ where }),
  ]);

  return {
    data: shipments,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const handleWebhook = async (payload: IWebhookPayload) => {
  const { notification_type, consignment_id, invoice } = payload;

  // Find shipment by consignment ID
  const shipment = await prisma.shipment.findUnique({
    where: { consignmentId: consignment_id.toString() },
  });

  if (!shipment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipment not found');
  }

  // Check for duplicate webhook (prevent duplicate events)
  const duplicateCheck = await prisma.courierEvent.findFirst({
    where: {
      shipmentId: shipment.id,
      notificationType: notification_type,
      updatedAt: new Date(payload.updated_at),
      trackingMessage:
        'tracking_message' in payload ? payload.tracking_message : undefined,
    },
  });

  if (duplicateCheck) {
    return { message: 'Duplicate webhook ignored', shipment };
  }

  if (notification_type === 'delivery_status') {
    const deliveryPayload = payload as any;

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        deliveryStatus: deliveryPayload.status,
        deliveryCharge: deliveryPayload.delivery_charge,
        trackingMessage: deliveryPayload.tracking_message,
        lastUpdatedAt: new Date(deliveryPayload.updated_at),
      },
    });

    // Create courier event
    await prisma.courierEvent.create({
      data: {
        shipmentId: shipment.id,
        notificationType: notification_type,
        status: deliveryPayload.status,
        trackingMessage: deliveryPayload.tracking_message,
        codAmount: deliveryPayload.cod_amount,
        deliveryCharge: deliveryPayload.delivery_charge,
        updatedAt: new Date(deliveryPayload.updated_at),
        rawPayload: payload as any,
      },
    });

    // Update order status and note based on delivery status
    const statusMap: Record<string, { status: string; note: string }> = {
      delivered: {
        status: 'DELIVERED',
        note: 'Your order has been delivered successfully. Thank you for shopping with us!'
      },
      partial_delivered: {
        status: 'DELIVERED',
        note: 'Your order has been partially delivered. Please contact support if you have any questions.'
      },
      cancelled: {
        status: 'CANCELLED',
        note: 'Your order has been cancelled. If you have any questions, please contact our support team.'
      },
      hold: {
        status: 'PROCESSING',
        note: 'Your order is currently on hold. Our team will contact you shortly.'
      },
      pending: {
        status: 'PROCESSING',
        note: 'Your order is being processed and will be shipped soon.'
      },
      in_review: {
        status: 'PROCESSING',
        note: 'Your order is under review and will be processed shortly.'
      },
    };

    if (statusMap[deliveryPayload.status]) {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { 
          status: statusMap[deliveryPayload.status].status as any,
          statusNote: statusMap[deliveryPayload.status].note
        },
      });
    }

    return updatedShipment;
  } else if (notification_type === 'tracking_update') {
    const trackingPayload = payload as any;

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        trackingMessage: trackingPayload.tracking_message,
        lastUpdatedAt: new Date(trackingPayload.updated_at),
      },
    });

    // Create courier event
    await prisma.courierEvent.create({
      data: {
        shipmentId: shipment.id,
        notificationType: notification_type,
        trackingMessage: trackingPayload.tracking_message,
        updatedAt: new Date(trackingPayload.updated_at),
        rawPayload: payload as any,
      },
    });

    // Update order status note with tracking message
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: { 
        statusNote: trackingPayload.tracking_message
      },
    });

    return updatedShipment;
  }

  throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid notification type');
};

const syncShipmentStatus = async (shipmentId: string) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
  });

  if (!shipment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipment not found');
  }

  if (!shipment.consignmentId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No consignment ID available');
  }

  try {
    const statusResponse = await steadfastClient.getStatusByConsignmentId(
      parseInt(shipment.consignmentId)
    );

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        deliveryStatus: statusResponse.delivery_status,
        lastUpdatedAt: new Date(),
      },
    });

    return updatedShipment;
  } catch (error: any) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || 'Failed to sync shipment status'
    );
  }
};

const assignDeliveryMan = async (payload: IAssignDeliveryMan) => {
  const shipment = await prisma.shipment.findUnique({
    where: { id: payload.shipmentId },
  });

  if (!shipment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipment not found');
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id: payload.shipmentId },
    data: {
      assignedToName: payload.assignedToName,
      assignedToPhone: payload.assignedToPhone,
      assignedToHub: payload.assignedToHub,
      internalNote: payload.internalNote,
    },
  });

  return updatedShipment;
};

const getBalance = async () => {
  try {
    const balanceResponse = await steadfastClient.getBalance();

    // Store balance snapshot
    await prisma.courierBalanceSnapshot.create({
      data: {
        currentBalance: balanceResponse.current_balance,
        rawPayload: balanceResponse as any,
      },
    });

    return balanceResponse;
  } catch (error: any) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || 'Failed to fetch balance'
    );
  }
};

const createWithdrawalRequest = async (payload: IWithdrawalRequest) => {
  const withdrawalRequest = await prisma.withdrawalRequest.create({
    data: {
      amount: payload.amount,
      note: payload.note,
      status: 'REQUESTED',
    },
  });

  return withdrawalRequest;
};

const getWithdrawalRequests = async () => {
  const requests = await prisma.withdrawalRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return requests;
};

const updateWithdrawalStatus = async (
  id: string,
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED'
) => {
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id },
  });

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Withdrawal request not found');
  }

  const updatedRequest = await prisma.withdrawalRequest.update({
    where: { id },
    data: { status },
  });

  return updatedRequest;
};

const getCustomerOrderTracking = async (orderNumber: string, phoneNumber: string) => {
  // Find order by orderNumber and phoneNumber for security
  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      phoneNumber,
    },
    include: {
      shipment: {
        include: {
          courierEvents: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    statusNote: order.statusNote,
    total: order.total,
    productName: order.productName,
    quantity: order.quantity,
    createdAt: order.createdAt,
    shipment: order.shipment ? {
      trackingCode: order.shipment.trackingCode,
      deliveryStatus: order.shipment.deliveryStatus,
      trackingMessage: order.shipment.trackingMessage,
      deliveryCharge: order.shipment.deliveryCharge,
      lastUpdatedAt: order.shipment.lastUpdatedAt,
      courierEvents: order.shipment.courierEvents,
    } : null,
  };
};

export const CourierService = {
  createShipment,
  getShipmentByOrderId,
  getAllShipments,
  handleWebhook,
  syncShipmentStatus,
  assignDeliveryMan,
  getBalance,
  createWithdrawalRequest,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  getCustomerOrderTracking,
};
