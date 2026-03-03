import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import httpStatus from 'http-status';
import { CourierService } from './courier.service';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getShipmentReviewData = catchAsync(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    if (!order.orderNumber) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Order must have an order number');
    }

    // Check if shipment already exists
    const existingShipment = await prisma.shipment.findUnique({
      where: { orderId },
    });

    if (existingShipment) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Shipment already exists for this order'
      );
    }

    // Prepare review data with prefilled values (using orderNumber as invoice)
    const reviewData = {
      orderId: order.id,
      recipient_name: order.fullName,
      recipient_phone: order.phoneNumber,
      alternative_phone: '',
      recipient_email: order.customer?.email || '',
      recipient_address: `${order.address}, ${order.thanaUpazila || ''}, ${order.city}`.trim(),
      cod_amount: order.total,
      note: order.orderNote || '', // Include order note if exists
      item_description: order.productName,
      total_lot: order.quantity,
      delivery_type: 0,
    };

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Shipment review data retrieved successfully',
      data: reviewData,
    });
  }
);

const createShipment = catchAsync(async (req: Request, res: Response) => {
  // Pass the payload directly - it's already in snake_case from frontend
  const result = await CourierService.createShipment(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Shipment created successfully',
    data: result,
  });
});

const getShipmentByOrderId = catchAsync(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await CourierService.getShipmentByOrderId(orderId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shipment retrieved successfully',
    data: result,
  });
});

const getAllShipments = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierService.getAllShipments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shipments retrieved successfully',
    data: result.data,
    meta: result.meta,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  // Verify webhook authentication
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${config.steadfast.webhookSecret}`;

  if (!authHeader || authHeader !== expectedToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid webhook token');
  }

  const result = await CourierService.handleWebhook(req.body);

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Webhook received successfully.',
  });
});

const syncShipmentStatus = catchAsync(async (req: Request, res: Response) => {
  const { shipmentId } = req.params;
  const result = await CourierService.syncShipmentStatus(shipmentId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Shipment status synced successfully',
    data: result,
  });
});

const assignDeliveryMan = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierService.assignDeliveryMan(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Delivery man assigned successfully',
    data: result,
  });
});

const getBalance = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierService.getBalance();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Balance retrieved successfully',
    data: result,
  });
});

const createWithdrawalRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CourierService.createWithdrawalRequest(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: 'Withdrawal request created successfully',
      data: result,
    });
  }
);

const getWithdrawalRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await CourierService.getWithdrawalRequests();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Withdrawal requests retrieved successfully',
      data: result,
    });
  }
);

const updateWithdrawalStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await CourierService.updateWithdrawalStatus(id, status);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Withdrawal status updated successfully',
      data: result,
    });
  }
);

const getCustomerOrderTracking = catchAsync(
  async (req: Request, res: Response) => {
    const { orderNumber, phoneNumber } = req.query;

    if (!orderNumber || !phoneNumber) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Order number and phone number are required'
      );
    }

    const result = await CourierService.getCustomerOrderTracking(
      orderNumber as string,
      phoneNumber as string
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Order tracking retrieved successfully',
      data: result,
    });
  }
);

const getPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await CourierService.getPayments();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payments retrieved successfully',
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const { paymentId } = req.params;
  const result = await CourierService.getPaymentById(parseInt(paymentId));

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

export const CourierController = {
  getShipmentReviewData,
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
};
