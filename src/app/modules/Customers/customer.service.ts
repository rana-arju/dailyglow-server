import prisma from '../../lib/prisma';
import { normalizePhoneNumber } from '../../utils/customerUtils';

const getAllCustomers = async (filters?: {
  page?: number;
  limit?: number;
  search?: string;
  dateFilter?: 'today' | 'week' | 'month' | '3months' | '6months' | 'year';
}) => {
  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  
  // Search filter
  if (filters?.search) {
    const searchTerm = filters.search;
    const normalizedSearch = normalizePhoneNumber(searchTerm);
    where.OR = [
      { fullName: { contains: searchTerm, mode: 'insensitive' } },
      { phoneNumber: { contains: normalizedSearch || searchTerm } },
    ];
  }
// ... (rest of the code remains similar, I'll provide full replacement for clarity or use multi_replace if needed)

  // Date filter
  if (filters?.dateFilter) {
    const dateRange = getDateRange(filters.dateFilter);
    where.createdAt = {
      gte: dateRange.startDate,
      lte: dateRange.endDate,
    };
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

  // Calculate stats for filtered customers
  const totalOrders = customers.reduce((sum, customer) => sum + customer.totalOrders, 0);
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);

  return {
    data: customers,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    stats: {
      totalOrders,
      totalRevenue,
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
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const customer = await prisma.customer.findUnique({
    where: { phoneNumber: normalizedPhone },
  });

  return customer;
};

const createCustomer = async (data: {
  fullName: string;
  phoneNumber: string;
  password?: string;
  email?: string;
}) => {
  const normalizedPhone = normalizePhoneNumber(data.phoneNumber);
  const customer = await prisma.customer.create({
    data: {
      fullName: data.fullName,
      phoneNumber: normalizedPhone,
      password: data.password,
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
