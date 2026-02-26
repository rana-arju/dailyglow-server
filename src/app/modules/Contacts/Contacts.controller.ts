import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { ContactServices } from './Contacts.services';
import pickValidFields from '../../shared/pickValidFields';
import fs from 'fs';
import ApiError from '../../errors/ApiError';
import { isValidObjectId } from '../../helpers/validateObjectId';

const uploadCSVPreview = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(httpStatus.BAD_REQUEST, 'CSV file is required');
  if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only CSV files are allowed');
  }
  try {
    const result = await ContactServices.parseCSVForPreview(req.file.path);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'CSV parsed successfully', data: result });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    throw error;
  }
});

const importContacts = catchAsync(async (req: Request, res: Response) => {
  const { folderId, folderName, previewData } = req.body;
  if (!previewData || !Array.isArray(previewData) || previewData.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Preview data is required');
  const result = await ContactServices.importContactsFromPreview(folderId, folderName, previewData);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Contacts imported successfully', data: result });
});

const createContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactServices.createContact(req.body);
  sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: 'Contact created successfully', data: result });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const filters = pickValidFields(req.query, ['searchTerm', 'email', 'status', 'folderId']);
  const rawOptions = pickValidFields(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);
  
  // Map legacy "ACTIVE" status to "SUBSCRIBED" for backward compatibility
  if (filters.status === 'ACTIVE') {
    filters.status = 'SUBSCRIBED';
  }
  
  // Convert numeric fields from strings to numbers
  const options = {
    ...rawOptions,
    limit: rawOptions.limit ? parseInt(rawOptions.limit as string, 10) : undefined,
    page: rawOptions.page ? parseInt(rawOptions.page as string, 10) : undefined,
  };
  
  const result = await ContactServices.getAllContacts(filters, options);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Contacts fetched successfully', data: result.data, meta: result.meta });
});

const updateContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Map legacy "ACTIVE" status to "SUBSCRIBED" for backward compatibility
  if (req.body.status === 'ACTIVE') {
    req.body.status = 'SUBSCRIBED';
  }
  
  const result = await ContactServices.updateContact(id, req.body);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Contact updated successfully', data: result });
});

const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContactServices.deleteContact(id);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: 'Contact deleted successfully', data: result });
});

const deleteMultipleContacts = catchAsync(async (req: Request, res: Response) => {
  const { contactIds } = req.body;
  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Contact IDs are required');
  const result = await ContactServices.deleteMultipleContacts(contactIds);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: result.message, data: result });
});

export const ContactController = { uploadCSVPreview, importContacts, createContact, getAllContacts, updateContact, deleteContact, deleteMultipleContacts };
