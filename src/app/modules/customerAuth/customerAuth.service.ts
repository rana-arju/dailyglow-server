import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import { ICustomerChangePassword, ICustomerLogin, CustomerRefreshPayload } from './customerAuth.interface';
import { normalizePhoneNumber } from '../../utils/customerUtils';
import { verifyToken } from '../../utils/verifyToken';

const loginCustomer = async (payload: ICustomerLogin) => {
  const normalizedPhone = normalizePhoneNumber(payload.phoneNumber);
  
  const customerData = await prisma.customer.findUnique({
    where: {
      phoneNumber: normalizedPhone,
    },
  });

  if (!customerData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  // Raw password comparison as requested
  if (customerData.password !== payload.password) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: customerData.id,
      phoneNumber: customerData.phoneNumber,
      role: 'CUSTOMER', // Hardcoded role for customers
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: customerData.id,
      phoneNumber: customerData.phoneNumber,
      role: 'CUSTOMER',
    },
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string
  );

  return {
    id: customerData.id,
    fullName: customerData.fullName,
    phoneNumber: customerData.phoneNumber,
    email: customerData.email,
    role: 'CUSTOMER',
    accessToken,
    refreshToken,
  };
};

const changePassword = async (customerId: string, payload: ICustomerChangePassword) => {
  const customerData = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customerData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  if (customerData.password !== payload.oldPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Old password does not match');
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      password: payload.newPassword,
    },
  });

  return {
    message: 'Password updated successfully',
  };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(token, config.jwt.refresh_secret as string) as CustomerRefreshPayload;

  const { phoneNumber } = decoded;

  const customer = await prisma.customer.findUnique({
    where: { phoneNumber },
  });

  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Customer not found');
  }

  const jwtPayload = {
    id: customer.id,
    phoneNumber: customer.phoneNumber,
    role: 'CUSTOMER',
  };

  const accessToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.access_secret as string,
    config.jwt.access_expires_in as string
  );

  const newRefreshToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const CustomerAuthService = {
  loginCustomer,
  changePassword,
  refreshToken,
};
