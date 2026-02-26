import httpStatus from 'http-status';
import sendResponse from '../../helpers/sendResponse';
import { AuthServices } from './auth.service';
import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import ApiError from '../../errors/ApiError';

// const createAccount = catchAsync(async (req, res) => {
//   const result = await AuthServices.createAccount(req.body);

//   sendResponse(res, {
//     statusCode: httpStatus.CREATED,
//     message: 'OTP sent to your email successfully',
//     data: result,
//   });
// });



const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUserFromDB(req.body);
  // ✅ SET NEW REFRESH TOKEN as HTTP-only cookie
  res.cookie('refreshToken', result?.refreshToken, {
    httpOnly: true,
    secure: false, // config.NODE_ENV === "production"
    sameSite: 'lax', // config.NODE_ENV === "production" ? true : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (matches JWT refresh token expiry)
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User logged in successfully',
    data: result,
  });
});


const userDeleteFromDB = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await AuthServices.UserDeleteFromDB(email);

  if (result) {
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Your account delete successfull!',
      data: result,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'User delete successfully',
    data: result,
  });
});
const adminLoginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.adminLoginUserFromDB(req.body);
  
  res.cookie('refreshToken', result?.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Admin logged in successfully',
    data: result,
  });
});

const createAdminUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.createAdminUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: 'Admin user created successfully',
    data: result,
  });
});

const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { userId, otpCode } = req.body;
  const result = await AuthServices.verifyOTP(userId, otpCode);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'OTP verified successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'An secret number has been send',
    data: result,
  });
});



const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const newPassword = req.body.newPassword;
  const result = await AuthServices.resetPassword(userId, newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Password Reset successfully please login',
    data: result,
  });
});
const changePassword = catchAsync(async (req, res) => {
  const userId: string = req.user.id;
  const oldPassword: string = req.body.oldPassword;
  const newPassword: string = req.body.newPassword;
  const result = await AuthServices.changePassword(userId, {
    newPassword,
    oldPassword,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'password changed successfully',
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Refresh token not found in cookies');
  }

  const result = await AuthServices.refreshToken(refreshToken);
  const { accessToken, refreshToken: newRefreshToken } = result;

  // ✅ SET NEW REFRESH TOKEN as HTTP-only cookie
  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: false, // config.NODE_ENV === "production"
    sameSite: 'lax', // config.NODE_ENV === "production" ? true : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days (matches JWT refresh token expiry)
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    message: 'Access token is retrieved successfully!',
    data: { accessToken },
  });
});

export const AuthControllers = {
  loginUser,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword,
  adminLoginUser,
  createAdminUser,
  userDeleteFromDB,
  refreshToken,
};
