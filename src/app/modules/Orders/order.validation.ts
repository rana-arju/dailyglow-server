import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phoneNumber: z
      .string()
      .regex(/^01\d{9}$/, 'Invalid phone number format. Must be 11 digits starting with 01'),
    city: z.string().min(1, 'City is required'),
    thanaUpazila: z.string().optional(),
    address: z.string().min(1, 'Address is required'),
    productName: z.string().min(1, 'Product name is required'),
    productPrice: z.number().positive('Product price must be positive'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    discount: z.number().min(0, 'Discount cannot be negative').optional().default(0),
    deliveryFee: z.number().min(0, 'Delivery fee cannot be negative').optional().default(0),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  }),
});
