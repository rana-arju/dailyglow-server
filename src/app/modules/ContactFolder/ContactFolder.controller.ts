import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { ContactFolderService } from './ContactFolder.service';

const createFolder = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body;
  const result = await ContactFolderService.createContactFolder(name);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Folder created successfully',
    data: result,
  });
});

const getAllFolders = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactFolderService.getAllFolders();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folders fetched successfully',
    data: result,
  });
});

const getFolderById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContactFolderService.getFolderById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder fetched successfully',
    data: result,
  });
});

const updateFolder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const result = await ContactFolderService.updateFolder(id, name);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder updated successfully',
    data: result,
  });
});

const deleteFolder = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContactFolderService.deleteFolder(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder deleted successfully',
    data: result,
  });
});

export const ContactFolderController = {
  createFolder,
  getAllFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
};
