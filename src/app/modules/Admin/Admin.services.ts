import httpStatus from 'http-status';
import prisma from '../../lib/prisma';
import { Role, UserStatus } from '@prisma/client';
import ApiError from '../../errors/ApiError';
import * as bcrypt from 'bcrypt';
import config from '../../../config';

interface AdminQueryParams {
  page: number;
  limit: number;
  search?: string;
  role?: 'ADMIN' | 'SUPERADMIN';
  status?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CreateAdminPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'SUPERADMIN';
}

const getAllAdmins = async (params: AdminQueryParams) => {
  const { page, limit, search, role, status, sortBy, sortOrder } = params;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    role: {
      in: role ? [role] : [Role.ADMIN, Role.SUPERADMIN],
    },
  };

  if (status && status !== 'all') {
    where.status = status.toUpperCase();
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy clause
  const orderBy: any = {};
  if (sortBy === 'name') {
    orderBy.firstName = sortOrder;
  } else if (sortBy === 'email') {
    orderBy.email = sortOrder;
  } else if (sortBy === 'role') {
    orderBy.role = sortOrder;
  } else if (sortBy === 'status') {
    orderBy.status = sortOrder;
  } else {
    orderBy.createdAt = sortOrder;
  }

  const [admins, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        isEmailVerified: true,
      },
      orderBy,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: admins,
  };
};

const getAdminById = async (id: string) => {
  const admin = await prisma.user.findUnique({
    where: {
      id,
      role: {
        in: [Role.ADMIN, Role.SUPERADMIN],
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      isEmailVerified: true,
      isVerified: true,
    },
  });

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  return admin;
};

const generatePassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

const createAdmin = async (payload: CreateAdminPayload, creatorId: string) => {
  // Check if creator is SUPERADMIN
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { role: true },
  });

  if (creator?.role !== Role.SUPERADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only superadmins can create new admins');
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already exists');
  }

  // Hash the provided password
  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds) || 12);

  // Create admin
  const newAdmin = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isVerified: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return newAdmin;
};

const suspendAdmin = async (id: string, actorId: string) => {
  // Check if actor is SUPERADMIN
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { role: true },
  });

  if (actor?.role !== Role.SUPERADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only superadmins can suspend admins');
  }

  // Check if target admin exists
  const admin = await prisma.user.findUnique({
    where: {
      id,
      role: {
        in: [Role.ADMIN, Role.SUPERADMIN],
      },
    },
  });

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  // Prevent suspending self
  if (id === actorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'You cannot suspend yourself');
  }

  // Update status to INACTIVE
  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.INACTIVE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedAdmin;
};

const activateAdmin = async (id: string, actorId: string) => {
  // Check if actor is SUPERADMIN
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    select: { role: true },
  });

  if (actor?.role !== Role.SUPERADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only superadmins can activate admins');
  }

  // Check if target admin exists
  const admin = await prisma.user.findUnique({
    where: {
      id,
      role: {
        in: [Role.ADMIN, Role.SUPERADMIN],
      },
    },
  });

  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Admin not found');
  }

  // Update status to ACTIVE
  const updatedAdmin = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.ACTIVE },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedAdmin;
};

export const AdminService = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  suspendAdmin,
  activateAdmin,
};
