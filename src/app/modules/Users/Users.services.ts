import httpStatus from 'http-status';
import fs from 'fs';
import prisma from '../../lib/prisma';
import path from 'path';
import { Role, User, UserStatus } from '@prisma/client';
import type { IPaginationOptions } from '../../interface/pagination.type';
import { paginationHelper } from '../../helpers/paginationHelper';
import ApiError from '../../errors/ApiError';
import { uploadAndCleanup, deleteFromS3, extractS3Key } from '../../helpers/s3Upload';
import config from '../../../config';

import { QuickStatusResponse } from './Users.subscription.interface';

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  return user;
};

const getSingleProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      image: true,
      role: true,
      status: true,
      email: true,
      createdAt: true,
      accountWith: true,

      isVerified: true,
      isEmailVerified: true,
    },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  await prisma.user.update({
    where: { id: userId },
    data: {
      profileView: {
        increment: 1,
      },
    },
  });
  return user;
};

// Enhanced Dealer Profile with comprehensive information
const getDealerProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      role: Role.USER, // Ensure it's a user
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
      isVerified: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Dealer not found');
  }

  return {
    // Basic user info
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    image: user.image,
    role: user.role,
    isVerified: user.isVerified,
  };
};

const getAllBlockedUsers = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  //  const { search } = options;

  const users = await prisma.user.findMany({
    where: {
      status: UserStatus.BLOCKED,
      NOT: {
        role: Role.SUPERADMIN,
      },
    },
    skip,
    take: limit,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  const total = await prisma.user.count({
    where: {
      NOT: {
        role: Role.SUPERADMIN,
      },
    },
  });
  const totalPages = Math.ceil(total / limit); // Calculate total pages

  return {
    meta: {
      total,
      page,
      totalPage: Math.ceil(total / limit),
      limit,
    },
    data: users,
  };
};

const updateMyProfile = async (userId: string, payload: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const data = await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      image: true,
      role: true,
    },
  });

  return data;
};

const updateMyProfileImage = async (userId: string, payload: any, file: any) => {
  // Fetch the existing user with their current image
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  // If the user doesn't exist, throw a 404 error
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  let imageURL = existingUser.image; // Keep existing image if no new file is uploaded

  // If a new file is provided, upload to S3
  if (file && file.filename) {
    const localFilePath = path.join(process.cwd(), 'public', 'uploads', file.filename);
    const s3Key = `profile-images/${userId}/${Date.now()}-${file.originalname}`;
    const bucketName = config.aws.s3Bucket;

    if (!bucketName) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'S3 bucket not configured');
    }

    // Upload to S3 and delete local file
    const uploadResult = await uploadAndCleanup(localFilePath, s3Key, bucketName);

    if (!uploadResult.success) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, uploadResult.error || 'Failed to upload image');
    }

    imageURL = uploadResult.url || existingUser.image;

    // Delete old image from S3 if it exists
    if (existingUser.image && existingUser.image.includes('s3.amazonaws.com')) {
      const oldS3Key = extractS3Key(existingUser.image);
      if (oldS3Key) {
        await deleteFromS3(oldS3Key, bucketName);
        console.log(`Old profile image deleted from S3: ${oldS3Key}`);
      }
    }
  }

  // Update the user's profile with the new image URL
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      image: imageURL,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      image: true,
    },
  });

  // Return the updated user data
  return updatedUser;
};

const updateUserStatus = async (userId: string, payload: { status: any }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
  });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status: payload.status.toUpperCase(),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });



  return updatedUser;
};

const updateUserRole = async (userId: string, payload: { role: Role }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, status: true },
  });
  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      role: payload.role as Role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });



  return updatedUser;
};

// Get user profile stats for profile page
const getUserProfileStats = async (userId: string) => {
  try {
    // Get user basic info with subscription and academy data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image || undefined,
      role: user.role,
      status: user.status,
    };
  } catch (error) {
    console.error('Error fetching user profile stats:', error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to fetch user profile stats');
  }
};

export const UsersService = {
  getMyProfile,

  updateMyProfile,
  updateMyProfileImage,
  updateUserStatus,
  getSingleProfile,
  getAllBlockedUsers,
  updateUserRole,
  getDealerProfile,
  // New profile page functions
  getUserProfileStats,
};
