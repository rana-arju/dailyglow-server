export interface ICustomer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerWithOrders extends ICustomer {
  orders: any[];
}
