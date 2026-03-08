import prisma from '../../lib/prisma';
import steadfastClient from '../../lib/steadfast.client';
import { ICreateShipmentPayload, IWebhookPayload, IAssignDeliveryMan, IWithdrawalRequest } from './courier.interface';
import ApiError from '../../errors/ApiError';
import httpStatus from 'http-status';

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
    throw new ApiError(httpStatus.BAD_REQUEST, 'Shipment already exists for this order');
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
      recipient_name: payload.recipient_name,
      recipient_phone: payload.recipient_phone,
      alternative_phone: payload.alternative_phone,
      recipient_email: payload.recipient_email,
      recipient_address: payload.recipient_address,
      cod_amount: payload.cod_amount,
      note: payload.note || order.orderNote || undefined, // Use shipment note or order note
      item_description: payload.item_description,
      total_lot: payload.total_lot,
      delivery_type: payload.delivery_type,
    });

    // Store shipment in database
    const shipment = await prisma.shipment.create({
      data: {
        orderId: payload.orderId,
        invoice,
        consignmentId: steadfastResponse.consignment.consignment_id.toString(),
        trackingCode: steadfastResponse.consignment.tracking_code,
        recipientName: payload.recipient_name,
        recipientPhone: payload.recipient_phone,
        alternativePhone: payload.alternative_phone,
        recipientEmail: payload.recipient_email,
        recipientAddress: payload.recipient_address,
        codAmount: payload.cod_amount,
        deliveryStatus: steadfastResponse.consignment.status,
        note: payload.note,
        itemDescription: payload.item_description,
        totalLot: payload.total_lot,
        deliveryType: payload.delivery_type || 0,
        providerPayload: steadfastResponse as any,
        lastUpdatedAt: new Date(steadfastResponse.consignment.updated_at),
      },
      include: {
        order: true,
      },
    });

    // Update order status to SHIPPED with tracking event
    await prisma.order.update({
      where: { id: payload.orderId },
      data: {
        status: 'SHIPPED',
        statusNote: 'Your order has been shipped and is on the way to you.',
        trackingEvents: {
          create: {
            status: 'Delivering',
            note: `Your order is on the way for delivery. Tracking Code: ${steadfastResponse.consignment.tracking_code}`,
          },
        },
      },
    });

    return shipment;
  } catch (error: any) {
    // Store failed shipment attempt
    await prisma.shipment.create({
      data: {
        orderId: payload.orderId,
        invoice,
        recipientName: payload.recipient_name,
        recipientPhone: payload.recipient_phone,
        alternativePhone: payload.alternative_phone,
        recipientEmail: payload.recipient_email,
        recipientAddress: payload.recipient_address,
        codAmount: payload.cod_amount,
        deliveryStatus: 'failed',
        note: payload.note,
        itemDescription: payload.item_description,
        totalLot: payload.total_lot,
        deliveryType: payload.delivery_type || 0,
        providerPayload: {
          error: error.message,
          responseData: error.data || null,
        } as any,
      },
    });

    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to create shipment in Steadfast');
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
      trackingMessage: 'tracking_message' in payload ? payload.tracking_message : undefined,
    },
  });

  if (duplicateCheck) {
    return { message: 'Duplicate webhook ignored', shipment };
  }

  if (notification_type === 'delivery_status') {
    const deliveryPayload = payload as any;
    const eventTimestamp = new Date(deliveryPayload.updated_at);

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        deliveryStatus: deliveryPayload.status,
        deliveryCharge: deliveryPayload.delivery_charge,
        trackingMessage: deliveryPayload.tracking_message,
        lastUpdatedAt: eventTimestamp,
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
        updatedAt: eventTimestamp,
        rawPayload: payload as any,
      },
    });

    // Update order status and note based on delivery status
    const statusMap: Record<string, { status: string; note: string; displayStatus: string }> = {
      delivered: {
        status: 'DELIVERED',
        displayStatus: 'Delivered',
        note: 'Your order has been delivered successfully. Thank you for shopping with us!',
      },
      partial_delivered: {
        status: 'DELIVERED',
        displayStatus: 'Delivered',
        note: 'Your order has been partially delivered. Please contact support if you have any questions.',
      },
      cancelled: {
        status: 'CANCELLED',
        displayStatus: 'Cancelled',
        note: 'Your order has been cancelled. If you have any questions, please contact our support team.',
      },
      hold: {
        status: 'PROCESSING',
        displayStatus: 'On Hold',
        note: 'Your order is currently on hold. Our team will contact you shortly.',
      },
      pending: {
        status: 'PROCESSING',
        displayStatus: 'Pending',
        note: 'Your order is being processed and will be shipped soon.',
      },
      in_review: {
        status: 'PROCESSING',
        displayStatus: 'In Review',
        note: 'Your order is under review and will be processed shortly.',
      },
    };

    if (statusMap[deliveryPayload.status]) {
      const statusInfo = statusMap[deliveryPayload.status];
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: statusInfo.status as any,
          statusNote: statusInfo.note,
          trackingEvents: {
            create: {
              status: statusInfo.displayStatus,
              note: statusInfo.note,
            },
          },
        },
      });
    }

    return updatedShipment;
  } else if (notification_type === 'tracking_update') {
    const trackingPayload = payload as any;
    const eventTimestamp = new Date(trackingPayload.updated_at);

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        trackingMessage: trackingPayload.tracking_message,
        lastUpdatedAt: eventTimestamp,
      },
    });

    // Create courier event
    await prisma.courierEvent.create({
      data: {
        shipmentId: shipment.id,
        notificationType: notification_type,
        trackingMessage: trackingPayload.tracking_message,
        updatedAt: eventTimestamp,
        rawPayload: payload as any,
      },
    });

    // Update order status note with tracking message
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        statusNote: trackingPayload.tracking_message,
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
    const statusResponse = await steadfastClient.getStatusByConsignmentId(parseInt(shipment.consignmentId));

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        deliveryStatus: statusResponse.delivery_status,
        lastUpdatedAt: new Date(),
      },
    });

    return updatedShipment;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to sync shipment status');
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
    // Fetch balance directly from STEADFAST API
    // No need to store in database - it's real-time data
    const balanceResponse = await steadfastClient.getBalance();
    return balanceResponse;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to fetch balance');
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

const updateWithdrawalStatus = async (id: string, status: 'PROCESSING' | 'COMPLETED' | 'REJECTED') => {
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
    shipment: order.shipment
      ? {
          trackingCode: order.shipment.trackingCode,
          deliveryStatus: order.shipment.deliveryStatus,
          trackingMessage: order.shipment.trackingMessage,
          deliveryCharge: order.shipment.deliveryCharge,
          lastUpdatedAt: order.shipment.lastUpdatedAt,
          courierEvents: order.shipment.courierEvents,
        }
      : null,
  };
};

const getPayments = async () => {
  try {
    const paymentsResponse = await steadfastClient.getPayments();
    return paymentsResponse;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to fetch payments');
  }
};

const getPaymentById = async (paymentId: number) => {
  try {
    const paymentResponse = await steadfastClient.getPaymentById(paymentId);
    return paymentResponse;
  } catch (error: any) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.message || 'Failed to fetch payment');
  }
};

const deleteShipment = async (shipmentId: string) => {
  console.log('🗑️ Deleting shipment:', shipmentId);
  
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { order: true },
  });

  if (!shipment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shipment not found');
  }

  console.log('📦 Shipment found:', {
    id: shipment.id,
    consignmentId: shipment.consignmentId,
    invoice: shipment.invoice,
    status: shipment.deliveryStatus,
  });

  // Check if shipment is already delivered
  if (shipment.deliveryStatus === 'delivered' || shipment.deliveryStatus === 'partial_delivered') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete delivered shipment');
  }

  try {
    // Cancel in Steadfast if consignment ID exists
    if (shipment.consignmentId) {
      console.log('🗑️ Cancelling in Steadfast...');
      await steadfastClient.cancelOrder(
        parseInt(shipment.consignmentId),
        'Cancelled by admin from dashboard'
      );
    } else {
      console.log('⚠️ No consignment ID, skipping Steadfast cancellation');
    }

    // Update shipment status to cancelled
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        deliveryStatus: 'cancelled',
        trackingMessage: 'Shipment cancelled by admin',
        lastUpdatedAt: new Date(),
      },
    });


    // Update order status back to CANCELLED with tracking event
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: {
        status: 'CANCELLED',
        statusNote: 'Shipment has been cancelled. Please contact support if you have any questions.',
        trackingEvents: {
          create: {
            status: 'Cancelled',
            note: 'Your shipment has been cancelled. Please contact support if you have any questions.',
          },
        },
      },
    });


    return {
      message: 'Shipment cancelled successfully',
      shipment: updatedShipment,
    };
  } catch (error: any) {
    
    // If Steadfast cancellation fails, still update local status
    if (error.status === 404 || error.message?.includes('not found')) {
      
      const updatedShipment = await prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          deliveryStatus: 'cancelled',
          trackingMessage: 'Shipment cancelled by admin (not found in Steadfast)',
          lastUpdatedAt: new Date(),
        },
      });

      await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: 'CANCELLED',
          statusNote: 'Shipment has been cancelled.',
        },
      });

      return {
        message: 'Shipment cancelled locally (not found in Steadfast)',
        shipment: updatedShipment,
      };
    }

    throw new ApiError(
      httpStatus.BAD_REQUEST,
      error.message || 'Failed to cancel shipment'
    );
  }
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
  getPayments,
  getPaymentById,
  deleteShipment,
};
