import prisma from '../../lib/prisma';

const getAllCustomers = async (filters?: {
  page?: number;
  limit?: number;
  search?: string;
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (filters?.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { phoneNumber: { contains: filters.search } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: customers,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getCustomerById = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return customer;
};

const getCustomerByPhoneNumber = async (phoneNumber: string) => {
  const customer = await prisma.customer.findUnique({
    where: { phoneNumber },
  });

  return customer;
};

const createCustomer = async (data: {
  fullName: string;
  phoneNumber: string;
  email?: string;
}) => {
  const customer = await prisma.customer.create({
    data: {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
    },
  });

  return customer;
};

const updateCustomerStats = async (customerId: string) => {
  // Calculate total orders and total spent
  const orders = await prisma.order.findMany({
    where: { customerId },
  });

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      totalOrders,
      totalSpent,
    },
  });

  return customer;
};

export const CustomerService = {
  getAllCustomers,
  getCustomerById,
  getCustomerByPhoneNumber,
  createCustomer,
  updateCustomerStats,
};
