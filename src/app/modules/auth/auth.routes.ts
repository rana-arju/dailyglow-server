import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authValidation } from "./auth.validation";
import { AuthControllers } from "./auth.controller";

// Security middleware imports
// import {
//   authRateLimit,
//   loginRateLimit,
//   passwordResetRateLimit,
//   otpRateLimit
// } from '../../middlewares/rateLimiter';
import { fileUploadSecurity } from '../../middlewares/security';
import enhancedAuth, { enhancedCheckOTP, logout } from '../../middlewares/enhancedAuth';

const router = express.Router();

// router.post(
//   '/create-account',
//   // authRateLimit,
//   validateRequest(authValidation.registerUser),
//   AuthControllers.createAccount
// );


router.post(
  "/login",
  // loginRateLimit,
  validateRequest(authValidation.loginUser),
  AuthControllers.loginUser
);

router.post(
  "/user-delete",
  enhancedAuth(),
  AuthControllers.userDeleteFromDB
);
router.post(
  "/admin/login",
  // loginRateLimit,
  validateRequest(authValidation.loginUser),
  AuthControllers.adminLoginUser
);

router.post(
  "/admin/create",
  // authRateLimit,
  validateRequest(authValidation.createAdminUser),
  AuthControllers.createAdminUser
);

router.post(
  "/forgot-password",
  // passwordResetRateLimit,
  validateRequest(authValidation.forgotPassword),
  AuthControllers.forgotPassword
);

router.post(
  "/verify-otp",
  // otpRateLimit,
  validateRequest(authValidation.verifyOtp),
  AuthControllers.verifyOTP
);


router.post(
  "/reset-password",
  // passwordResetRateLimit,
  validateRequest(authValidation.resetPassword),
  enhancedCheckOTP,
  AuthControllers.resetPassword
);
router.post(
  "/change-password",
  validateRequest(authValidation.changePassword),
  enhancedAuth(),
  AuthControllers.changePassword
);
router.post(
  "/refresh-token",
  // authRateLimit,
  AuthControllers.refreshToken
);



// Logout route with token blacklisting
router.post(
  "/logout",
  enhancedAuth(),
  logout
);


export const AuthRouters = router;
