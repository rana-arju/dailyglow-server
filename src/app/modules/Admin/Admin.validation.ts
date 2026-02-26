import { z } from 'zod';
import { Role } from '@prisma/client';

export const createAdminSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name is too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name is too long'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    role: z.enum([Role.ADMIN, Role.SUPERADMIN], {
      errorMap: () => ({ message: 'Role must be either ADMIN or SUPERADMIN' }),
    }),
  }),
});

export const AdminValidation = {
  createAdminSchema,
};
