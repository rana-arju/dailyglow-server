import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../errors/ApiError';
import prisma from '../../lib/prisma';
import { IChangePassword, IRegisterUser, IUserLogin, RefreshPayload } from './auth.interface ';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import { Role, UserStatus } from '@prisma/client';
import { forgotEmailTemplate } from '../../utils/emailNotifications/forgotHTML';
import { verifyToken } from '../../utils/verifyToken';
import { OTPFn } from './OTPFn';

const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User not found');
  }

  OTPFn(user.email, user.id, 'Forgot Password OTP', forgotEmailTemplate);
  
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    otpSent: true,
    message: 'OTP sent successfully to your email',
    type: 'forgotPassword',
  };
};

const loginUserFromDB = async (payload: IUserLogin) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is not active. Please contact with admin.');
  }

  const isCorrectPassword = await bcrypt.compare(payload.password, userData.password as string);

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  if (userData.status === UserStatus.PENDING && !userData.isEmailVerified) {
    // OTPFn(userData.email, userData.id, 'OTP Verification', emailTemplate);
    return {
      id: userData.id,
      email: userData.email,
      message: 'Please verify your email. OTP sent to your email.',
      requiresEmailVerification: true,
    };
  }

  const newRefreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string
  );
  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  // Return user details and access token
  return {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    image: userData.image,
    status: userData.status,
    isVerified: userData.isVerified,
    accessToken: accessToken,
    refreshToken: newRefreshToken,
  };
};
const UserDeleteFromDB = async (email: string) => {
  //find user
  const userData = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'This user is not active!');
  }
  if (userData.isDeleted) {
    throw new ApiError(httpStatus.FORBIDDEN, 'This user already deleted!');
  }

  //account soft delete
  const userDelete = await prisma.user.update({
    where: {
      email: userData.email,
    },
    data: {
      isDeleted: true,
    },
  });
  return userDelete;
};
const adminLoginUserFromDB = async (payload: IUserLogin) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (userData.role !== Role.ADMIN && userData.role !== Role.SUPERADMIN) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied. Only admin and superadmin can login here.');
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked. Please contact support.');
  }

  const isCorrectPassword = await bcrypt.compare(payload.password, userData.password as string);

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password incorrect');
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.refresh_secret as string,
    config.jwt.refresh_expires_in as string
  );

  return {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    image: userData.image,
    status: userData.status,
    isVerified: userData.isVerified,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };
};

const createAdminUser = async (payload: IRegisterUser) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User already exists with this email');
  }

  if (payload.role !== Role.ADMIN && payload.role !== Role.SUPERADMIN) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role. Only ADMIN or SUPERADMIN can be created');
  }

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.bcrypt_salt_rounds));

  const newUser = await prisma.user.create({
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
  });

  return {
    id: newUser.id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    role: newUser.role,
    status: newUser.status,
  };
};

const verifyOTP = async (userId: string, otpCode: string) => {
  const otpRecord = await prisma.oTP.findFirst({
    where: { userId },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP not found or expired');
  }

  if (otpRecord.otpCode !== otpCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP');
  }

  if (new Date() > otpRecord.expiry) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'OTP has expired');
  }

  await prisma.oTP.delete({
    where: { id: otpRecord.id },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const resetToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email },
    config.jwt.reset_pass_secret as string,
    config.jwt.reset_pass_token_expires_in as string
  );

  return {
    message: 'OTP verified successfully',
    resetToken,
  };
};

const resetPassword = async (userId: string, newPassword: string) => {
  const hashedPassword: string = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: 'please login',
  };
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password: true,
      email: true,
      id: true,
      status: true,
    },
  });

  if (!userData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'User not found!, If you have already have account please reset your password'
    );
  }

  if (userData.status === UserStatus.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account has been blocked. Please contact support.');
  }

  const isCorrectPassword = await bcrypt.compare(payload.oldPassword, userData.password as string);

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Credentials not matched');
  }

  const hashedPassword: string = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
    },
  });
  
  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found in the database.');
  }
  
  return {
    message: 'password updated successfully',
  };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(token, config.jwt.refresh_secret as string) as RefreshPayload;

  const { email, iat } = decoded;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      image: true,
      isVerified: true,
      passwordChangedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  /* Reject if password changed after token was issued */
  if (
    user.passwordChangedAt &&
    /* convert both to seconds since epoch */
    Math.floor(user.passwordChangedAt.getTime() / 1000) > iat
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password was changed after this token was issued');
  }
  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // ✅ FIX: Use ACCESS token config, not REFRESH token config
  const accessToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.access_secret as string,
    config.jwt.access_expires_in as string
  );
  // ✅ GENERATE NEW REFRESH TOKEN to extend session
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

export const AuthServices = {
  loginUserFromDB,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  adminLoginUserFromDB,
  createAdminUser,
  UserDeleteFromDB,
  refreshToken,
};
