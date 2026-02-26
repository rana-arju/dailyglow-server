import { z } from 'zod';

// Validation schema for creating a contact
export const createContactSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    folderId: z.string({
      required_error: 'Folder ID is required',
    }),
  }),
});

// Validation schema for CSV preview
export const csvPreviewSchema = z.object({
  body: z.object({
    folderId: z.string().optional(),
    folderName: z.string().trim().optional(),
  }),
});

// Validation schema for CSV import
export const csvImportSchema = z.object({
  body: z.object({
    folderId: z.string().optional(),
    folderName: z.string().trim().optional(),
    previewData: z.array(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    ),
  }),
});

// Validation schema for updating a contact
export const updateContactSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim().optional(),
    firstName: z.string().trim().optional(),
    lastName: z.string().trim().optional(),
    folderId: z.string().optional(),
    // Accept both ACTIVE (legacy) and SUBSCRIBED (current)
    status: z.enum(['ACTIVE', 'SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED']).optional(),
  }),
});

// Validation schema for query parameters
export const getContactsQuerySchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    email: z.string().optional(),
    // Accept both ACTIVE (legacy) and SUBSCRIBED (current)
    status: z.enum(['ACTIVE', 'SUBSCRIBED', 'UNSUBSCRIBED', 'BOUNCED', 'COMPLAINED']).optional(),
    folderId: z.string().optional(),
    limit: z.string().optional(),
    page: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const ContactValidation = {
  createContactSchema,
  csvPreviewSchema,
  csvImportSchema,
  updateContactSchema,
  getContactsQuerySchema,
};
