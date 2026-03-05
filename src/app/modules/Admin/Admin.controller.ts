import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { AdminService } from './Admin.services';

const getAllAdmins = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { page, limit, search, role, status, sortBy, sortOrder } = req.query as {
    page?: string;
    limit?: string;
    search?: string;
    role?: 'ADMIN' | 'SUPERADMIN' | 'all';
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };

  const queryParams = {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 10,
    search: search?.trim(),
    role: role === 'all' ? undefined : role,
    status: status === 'all' ? undefined : status,
    sortBy: sortBy || 'createdAt',
    sortOrder: sortOrder || 'desc',
  };

  const data = await AdminService.getAllAdmins(queryParams);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admins fetched successfully!',
    data,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await AdminService.getAdminById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin details fetched successfully!',
    data,
  });
});

const createAdmin = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const data = await AdminService.createAdmin(req.body, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Admin created successfully!',
    data,
  });
});

const suspendAdmin = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const data = await AdminService.suspendAdmin(id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin suspended successfully!',
    data,
  });
});

const activateAdmin = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const data = await AdminService.activateAdmin(id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin activated successfully!',
    data,
  });
});

const deleteAdmin = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { id } = req.params;
  const data = await AdminService.deleteAdmin(id, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin deleted successfully!',
    data,
  });
});

export const AdminController = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  suspendAdmin,
  activateAdmin,
  deleteAdmin,
};
