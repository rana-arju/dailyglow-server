import prisma from '../../lib/prisma';
import { DateFilter } from './dashboard.interface';

const getDateRange = (filter: DateFilter) => {
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

const getDashboardStats = async (filter: DateFilter = 'today') => {
  const { startDate, endDate } = getDateRange(filter);

  // Get filtered customers
  const totalCustomers = await prisma.customer.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  // Get filtered orders
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      orderNumber: true,
      fullName: true,
      phoneNumber: true,
      productName: true,
      productPrice: true,
      originalPrice: true,
      quantity: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });

  const totalOrders = orders.length;

  // Calculate total revenue
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  // Calculate total profit (only for orders with originalPrice)
  const totalProfit = orders.reduce((sum, order) => {
    if (order.originalPrice) {
      const profit = order.total - (order.originalPrice * order.quantity);
      return sum + profit;
    }
    return sum;
  }, 0);

  // Get recent orders (last 10)
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      orderNumber: true,
      fullName: true,
      phoneNumber: true,
      productName: true,
      total: true,
      status: true,
      createdAt: true,
    },
  });

  // Generate chart data based on filter
  const chartData = await generateChartData(filter, startDate, endDate);

  return {
    totalCustomers,
    totalOrders,
    totalRevenue,
    totalProfit,
    recentOrders,
    chartData,
  };
};

const generateChartData = async (
  filter: DateFilter,
  startDate: Date,
  endDate: Date
) => {
  const intervals = getIntervals(filter, startDate, endDate);
  
  const salesProfitData = [];
  const orderStatusData = [];

  for (const interval of intervals) {
    // Get orders for this interval
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: interval.start,
          lte: interval.end,
        },
      },
      select: {
        total: true,
        originalPrice: true,
        quantity: true,
        status: true,
      },
    });

    // Calculate sales and profit
    const sales = orders.reduce((sum, order) => sum + order.total, 0);
    const profit = orders.reduce((sum, order) => {
      if (order.originalPrice) {
        return sum + (order.total - (order.originalPrice * order.quantity));
      }
      return sum;
    }, 0);

    salesProfitData.push({
      label: interval.label,
      sales,
      profit,
    });

    // Calculate order status counts
    const totalOrders = orders.length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
    const successRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    orderStatusData.push({
      label: interval.label,
      totalOrders,
      cancelledOrders,
      deliveredOrders,
      cancelRate: Math.round(cancelRate * 10) / 10,
      successRate: Math.round(successRate * 10) / 10,
    });
  }

  return {
    salesProfitData,
    orderStatusData,
  };
};

const getIntervals = (filter: DateFilter, startDate: Date, endDate: Date) => {
  const intervals = [];
  const bdOffset = 6 * 60 * 60 * 1000;

  switch (filter) {
    case 'today': {
      // Hourly intervals for today
      const bdStart = new Date(startDate.getTime() + bdOffset);
      for (let hour = 0; hour < 24; hour++) {
        const intervalStart = new Date(bdStart);
        intervalStart.setHours(hour, 0, 0, 0);
        const intervalEnd = new Date(intervalStart);
        intervalEnd.setHours(hour, 59, 59, 999);
        
        intervals.push({
          label: `${hour}:00`,
          start: new Date(intervalStart.getTime() - bdOffset),
          end: new Date(intervalEnd.getTime() - bdOffset),
        });
      }
      break;
    }
    case 'week': {
      // Daily intervals for week
      const bdStart = new Date(startDate.getTime() + bdOffset);
      for (let day = 0; day < 7; day++) {
        const intervalStart = new Date(bdStart);
        intervalStart.setDate(bdStart.getDate() + day);
        intervalStart.setHours(0, 0, 0, 0);
        const intervalEnd = new Date(intervalStart);
        intervalEnd.setHours(23, 59, 59, 999);
        
        intervals.push({
          label: intervalStart.toLocaleDateString('bn-BD', { weekday: 'short' }),
          start: new Date(intervalStart.getTime() - bdOffset),
          end: new Date(intervalEnd.getTime() - bdOffset),
        });
      }
      break;
    }
    case 'month': {
      // Daily intervals for month (last 30 days)
      const bdStart = new Date(startDate.getTime() + bdOffset);
      for (let day = 0; day < 30; day++) {
        const intervalStart = new Date(bdStart);
        intervalStart.setDate(bdStart.getDate() + day);
        intervalStart.setHours(0, 0, 0, 0);
        const intervalEnd = new Date(intervalStart);
        intervalEnd.setHours(23, 59, 59, 999);
        
        intervals.push({
          label: intervalStart.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
          start: new Date(intervalStart.getTime() - bdOffset),
          end: new Date(intervalEnd.getTime() - bdOffset),
        });
      }
      break;
    }
    case '3months':
    case '6months':
    case 'year': {
      // Monthly intervals
      const months = filter === '3months' ? 3 : filter === '6months' ? 6 : 12;
      const bdStart = new Date(startDate.getTime() + bdOffset);
      
      for (let month = 0; month < months; month++) {
        const intervalStart = new Date(bdStart);
        intervalStart.setMonth(bdStart.getMonth() + month);
        intervalStart.setDate(1);
        intervalStart.setHours(0, 0, 0, 0);
        
        const intervalEnd = new Date(intervalStart);
        intervalEnd.setMonth(intervalStart.getMonth() + 1);
        intervalEnd.setDate(0);
        intervalEnd.setHours(23, 59, 59, 999);
        
        intervals.push({
          label: intervalStart.toLocaleDateString('bn-BD', { month: 'short', year: 'numeric' }),
          start: new Date(intervalStart.getTime() - bdOffset),
          end: new Date(intervalEnd.getTime() - bdOffset),
        });
      }
      break;
    }
  }

  return intervals;
};

export const DashboardService = {
  getDashboardStats,
};
