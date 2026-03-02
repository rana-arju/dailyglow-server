import { z } from 'zod';

const phoneRegex = /^01[0-9]{9}$/;

// Accept snake_case from API (frontend compatibility)
export const createShipmentSchema = z.object({
  body: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    recipient_name: z
      .string()
      .min(1, 'Recipient name is required')
      .max(100, 'Name must be within 100 characters'),
    recipient_phone: z
      .string()
      .min(1, 'Recipient phone is required')
      .regex(phoneRegex, 'Phone must be 11 digits starting with 01 (e.g., 01712345678)'),
    alternative_phone: z
      .string()
      .regex(phoneRegex, 'Alternative phone must be 11 digits starting with 01')
      .optional()
      .or(z.literal('')),
    recipient_email: z
      .string()
      .email('Invalid email format')
      .optional()
      .or(z.literal('')),
    recipient_address: z
      .string()
      .min(1, 'Recipient address is required')
      .min(10, 'Address must be at least 10 characters')
      .max(250, 'Address must be within 250 characters'),
    cod_amount: z
      .number({ required_error: 'COD amount is required' })
      .min(0, 'COD amount cannot be negative'),
    note: z.string().max(500, 'Note must be within 500 characters').optional(),
    item_description: z
      .string()
      .max(200, 'Item description must be within 200 characters')
      .optional(),
    total_lot: z
      .number()
      .int()
      .positive('Total lot must be a positive number')
      .optional(),
    delivery_type: z
      .enum(['0', '1'])
      .or(z.number().int().min(0).max(1))
      .optional(),
  }),
});

export const assignDeliveryManSchema = z.object({
  body: z.object({
    shipmentId: z.string().min(1, 'Shipment ID is required'),
    assignedToName: z.string().min(1, 'Delivery man name is required'),
    assignedToPhone: z
      .string()
      .regex(phoneRegex, 'Phone must be 11 digits starting with 01'),
    assignedToHub: z.string().optional(),
    internalNote: z.string().optional(),
  }),
});

export const withdrawalRequestSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    note: z.string().optional(),
  }),
});

export const CourierValidation = {
  createShipmentSchema,
  assignDeliveryManSchema,
  withdrawalRequestSchema,
};
