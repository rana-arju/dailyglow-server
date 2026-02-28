export interface IDashboardStats {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  recentOrders: any[];
  chartData: {
    salesProfitData: Array<{
      label: string;
      sales: number;
      profit: number;
    }>;
    orderStatusData: Array<{
      label: string;
      totalOrders: number;
      cancelledOrders: number;
      deliveredOrders: number;
      cancelRate: number;
      successRate: number;
    }>;
  };
}

export type DateFilter = 'today' | 'week' | 'month' | '3months' | '6months' | 'year';
