import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { CustomerAuthService } from './customerAuth.service';
import config from '../../../config';

const loginCustomer = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerAuthService.loginCustomer(req.body);

  const { refreshToken, ...others } = result;

  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === 'production',
    httpOnly: true,
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Customer logged in successfully',
    data: others,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const customerId = (req as any).user.id;
  const result = await CustomerAuthService.changePassword(customerId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await CustomerAuthService.refreshToken(refreshToken);

  // set refresh token into cookie
  const cookieOptions = {
    secure: config.env === 'production',
    httpOnly: true,
  };

  res.cookie('refreshToken', result.refreshToken, cookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Refresh token retrieved successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
});

export const CustomerAuthController = {
  loginCustomer,
  changePassword,
  refreshToken,
};
