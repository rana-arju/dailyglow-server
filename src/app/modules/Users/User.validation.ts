import { image } from 'pdfkit';
import z from 'zod';

export const UserUpdate = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});

export const DealerIdValidation = z.object({
  params: z.object({
    id: z.string({
      required_error: 'Dealer ID is required!',
    }),
  }),
});
