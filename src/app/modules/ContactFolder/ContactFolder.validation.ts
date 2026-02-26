import { z } from 'zod';

// Validation schema for creating a contact folder
export const createContactFolderSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Folder name is required',
      })
      .min(1, 'Folder name cannot be empty')
      .max(100, 'Folder name must be less than 100 characters')
      .trim(),
  }),
});

// Validation schema for updating a contact folder
export const updateContactFolderSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Folder name cannot be empty')
      .max(100, 'Folder name must be less than 100 characters')
      .trim()
      .optional(),
  }),
});

export const ContactFolderValidation = {
  createContactFolderSchema,
  updateContactFolderSchema,
};
