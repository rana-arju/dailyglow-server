import { z } from 'zod';

export const getUsersQueryValidation = z.object({
  query: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).optional(),
    search: z.string().optional(),
    role: z.enum([ 'USER', 'all']).optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'BLOCKED', 'INACTIVE', 'all']).optional(),
    sortBy: z.enum(['name', 'email', 'role', 'status', 'created', 'updated']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    isVerified: z.string().transform((val) => val === 'true').optional(),
    hasSubscription: z.string().transform((val) => val === 'true').optional(),
  }).optional(),
});

export type GetUsersQueryType = z.infer<typeof getUsersQueryValidation>;