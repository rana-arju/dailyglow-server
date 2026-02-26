import prisma from '../../lib/prisma';
import { ICreateOrder } from './order.interface';
import { OrderStatus } from '@prisma/client';

const createOrder = async (orderData: ICreateOrder) => {
  const discount = orderData.discount || 0;
  const deliveryFee = orderData.deliveryFee || 0;

  // Calculate subtotal (price * quantity - discount)
  const subtotal = orderData.productPrice * orderData.quantity - discount;

  // Calculate total (subtotal + delivery fee)
  const total = subtotal + deliveryFee;

  const order = await prisma.order.create({
    data: {
      fullName: orderData.fullName,
      phoneNumber: orderData.phoneNumber,
      city: orderData.city,
      thanaUpazila: orderData.thanaUpazila,
      address: orderData.address,
      productName: orderData.productName,
      productPrice: orderData.productPrice,
      quantity: orderData.quantity,
      discount,
      deliveryFee,
      subtotal,
      total,
    },
  });

  return order;
};

const getAllOrders = async (filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters?.status) {
    where.status = filters.status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getOrderById = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
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
  deleteOrder,
};
