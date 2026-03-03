import prisma from '../../lib/prisma';
import { ICreateOrder } from './order.interface';
import { OrderStatus } from '@prisma/client';
import { CustomerService } from '../Customers/customer.service';
import { generateUniqueOrderId } from '../../utils/generateOrderId';
import { generateRandomPassword, normalizePhoneNumber } from '../../utils/customerUtils';

const createOrder = async (orderData: ICreateOrder) => {
  const discount = orderData.discount || 0;
  const deliveryFee = orderData.deliveryFee || 0;

  // Calculate subtotal (price * quantity - discount)
  const subtotal = orderData.productPrice * orderData.quantity - discount;

  // Calculate total (subtotal + delivery fee)
  const total = subtotal + deliveryFee;

  // Generate unique order number
  let orderNumber = generateUniqueOrderId();
  
  // Ensure uniqueness (check if exists, regenerate if needed)
  let existingOrder = await prisma.order.findUnique({
    where: { orderNumber },
  });
  
  while (existingOrder) {
    orderNumber = generateUniqueOrderId();
    existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
    });
  }

  const normalizedPhone = normalizePhoneNumber(orderData.phoneNumber);

  // Find or create customer by phone number
  let customer = await CustomerService.getCustomerByPhoneNumber(
    normalizedPhone
  );

  if (!customer) {
    // Generate random 8-digit password
    const randomPassword = generateRandomPassword(8);
    // Create new customer
    customer = await CustomerService.createCustomer({
      fullName: orderData.fullName,
      phoneNumber: normalizedPhone,
      password: randomPassword,
    });
  }

  // Create order linked to customer
  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      fullName: orderData.fullName,
      phoneNumber: normalizedPhone,
      city: orderData.city,
      thanaUpazila: orderData.thanaUpazila,
      address: orderData.address,
      productName: orderData.productName,
      productPrice: orderData.productPrice,
      originalPrice: orderData.originalPrice,
      quantity: orderData.quantity,
      discount,
      deliveryFee,
      subtotal,
      total,
      orderNote: orderData.orderNote,
    },
  });

  // Update customer stats
  await CustomerService.updateCustomerStats(customer.id);

  return order;
};

const getAllOrders = async (filters?: {
  status?: string;
  search?: string;
  dateFilter?: 'today' | 'week' | 'month' | '3months' | '6months' | 'year';
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  // Status filter
  if (filters?.status) {
    where.status = filters.status;
  }

  // Search filter (orderNumber, fullName, phoneNumber)
  if (filters?.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { phoneNumber: { contains: filters.search } },
    ];
  }

  // Date filter
  if (filters?.dateFilter) {
    const dateRange = getDateRange(filters.dateFilter);
    where.createdAt = {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    };
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            totalOrders: true,
            totalSpent: true,
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  // Calculate stats for filtered orders
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalProfit = orders.reduce((sum, order) => {
    if (order.originalPrice) {
      return sum + (order.total - (order.originalPrice * order.quantity));
    }
    return sum;
  }, 0);

  return {
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    stats: {
      totalRevenue,
      totalProfit,
    },
  };
};

const getDateRange = (filter: 'today' | 'week' | 'month' | '3months' | '6months' | 'year') => {
  // Get current UTC time
  const now = new Date();
  
  // Convert to BD timezone (UTC+6)
  // BD time = UTC time + 6 hours
  const bdOffset = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const bdNow = new Date(now.getTime() + bdOffset);
  
  // Create start date in BD timezone
  let startDate = new Date(bdNow);
  
  switch (filter) {
    case 'today':
      // Start of today in BD time (12:01 AM)
      startDate.setHours(0, 1, 0, 0);
      break;
    case 'week':
      startDate.setDate(bdNow.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setMonth(bdNow.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '3months':
      startDate.setMonth(bdNow.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '6months':
      startDate.setMonth(bdNow.getMonth() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'year':
      startDate.setFullYear(bdNow.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  // End date is current BD time (11:59 PM for today)
  let endDate = new Date(bdNow);
  if (filter === 'today') {
    endDate.setHours(23, 59, 59, 999);
  }
  
  // Convert BD times back to UTC for database query
  const startDateUTC = new Date(startDate.getTime() - bdOffset);
  const endDateUTC = new Date(endDate.getTime() - bdOffset);
  
  return { startDate: startDateUTC, endDate: endDateUTC };
};

const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          totalOrders: true,
          totalSpent: true,
        },
      },
    },
  });

  return order;
};

const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  return order;
};

const updateOrder = async (id: string, updateData: Partial<ICreateOrder>) => {
  const order = await prisma.order.update({
    where: { id },
    data: updateData,
  });

  return order;
};

const deleteOrder = async (id: string) => {
  const order = await prisma.order.delete({
    where: { id },
  });

  return order;
};

export const OrderService = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
};
