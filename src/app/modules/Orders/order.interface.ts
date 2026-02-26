export interface ICreateOrder {
  fullName: string;
  phoneNumber: string;
  city: string;
  thanaUpazila?: string;
  address: string;
  productName: string;
  productPrice: number;
  quantity: number;
  discount?: number;
  deliveryFee?: number;
}

export interface IOrder extends ICreateOrder {
  id: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
