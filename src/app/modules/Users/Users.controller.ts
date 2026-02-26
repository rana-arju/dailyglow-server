import { Request, Response } from 'express';
import httpStatus from 'http-status';

import { UsersService } from './Users.services';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import pickValidFields from '../../shared/pickValidFields';
import { User, UserStatus } from '@prisma/client';

const getMyProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const data = await UsersService.getMyProfile(req.user.id as string); // Fetch work area by ID
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fetched profile successfully!',
    data: data,
  });
});
const getUserProfileById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id; // Get user ID from the request object

  const data = await UsersService.getSingleProfile(userId); // Fetch work area by ID
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fetched profile successfully!',
    data: data,
  });
});

// Enhanced Dealer Profile
const getDealerProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id; // Get dealer user ID from the request object

  const data = await UsersService.getDealerProfile(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dealer profile fetched successfully!',
    data: data,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, search, role, status, sortBy, sortOrder, isVerified, hasSubscription } = req.query as {
    page?: string;
    limit?: string;
    search?: string;
    role?:  'USER' | 'all';
    status?: UserStatus | 'all';
    sortBy?: 'name' | 'email' | 'role' | 'status' | 'created' | 'updated';
    sortOrder?: 'asc' | 'desc';
    isVerified?: string;
    hasSubscription?: string;
  };

  // Clean and validate parameters to prevent URL encoding issues
  const cleanRole = role ? decodeURIComponent(role.toString()).trim() : undefined;
  const cleanStatus = status ? decodeURIComponent(status.toString()).trim() : undefined;
  const cleanSearch = search ? decodeURIComponent(search.toString()).trim() : undefined;
  const cleanSortBy = sortBy ? decodeURIComponent(sortBy.toString()).trim() : undefined;
  const cleanSortOrder = sortOrder ? decodeURIComponent(sortOrder.toString()).trim() : undefined;

  const queryParams = {
    page: page ? parseInt(page.toString(), 10) : undefined,
    limit: limit ? parseInt(limit.toString(), 10) : undefined,
    search: cleanSearch,
    role: cleanRole as 'BUYER' | 'DEALER' | 'all' | undefined,
    status: cleanStatus as UserStatus | 'all' | undefined,
    sortBy: cleanSortBy as 'name' | 'email' | 'role' | 'status' | 'created' | 'updated' | undefined,
    sortOrder: cleanSortOrder as 'asc' | 'desc' | undefined,
    isVerified: isVerified !== undefined ? isVerified.toString() === 'true' : undefined,
    hasSubscription: hasSubscription !== undefined ? hasSubscription.toString() === 'true' : undefined,
  };

  // Build dynamic message based on filters
  let message = 'Fetched users successfully!';
  if (search) message += ` (searched: "${search}")`;
  if (role && role !== 'all') message += ` (role: ${role})`;
  if (status && status !== 'all') message += ` (status: ${status})`;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message,
    data: '',
  });
});
const getAllBlockedUsers = catchAsync(async (req: Request, res: Response) => {
  const options = pickValidFields(req.query, ['limit', 'page', 'status']);

  const data = await UsersService.getAllBlockedUsers(options); // Fetch work area by ID
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Fetched all blocked users successfully!',
    data: data,
  });
});

const updateMyProfile = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user.id;
  const payload = req.body;

  const data = await UsersService.updateMyProfile(userId, payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully!',
    data: data,
  });
});
const updateMyProfileImage = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user.id;
  const file = req.file;

  const data = await UsersService.updateMyProfileImage(
    userId,
    { host: req.header('host'), protocol: req.protocol },
    file
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully!',
    data: data,
  });
});

const updateUserStatus = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.params.userId;

  const result = await UsersService.updateUserStatus(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User status updated successfully',
    data: result,
  });
});
const updateUserRole = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  // Use the target user's ID from route params (admin action), not the acting admin's ID
  const userId = req.params.userId;
  const result = await UsersService.updateUserRole(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User role updated successfully',
    data: result,
  });
});

// ============= USER PROFILE PAGE ENDPOINTS =============

// Get user profile stats for profile page
const getUserProfileStats = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const data = await UsersService.getUserProfileStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile stats fetched successfully!',
    data: data,
  });
});

// Get my profile stats (authenticated user)
const getMyProfileStats = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user.id;

  const data = await UsersService.getUserProfileStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Profile stats fetched successfully!',
    data: data,
  });
});

export const UsersController = {
  getMyProfile,
  getUserProfileById,
  getDealerProfile,
  getAllUsers,
  updateUserStatus,
  updateMyProfile,
  updateMyProfileImage,
  getAllBlockedUsers,
  updateUserRole,
  // Profile page endpoints
  getUserProfileStats,
  getMyProfileStats,
};
