import express from 'express';
import { CustomerAuthController } from './customerAuth.controller';
import auth from '../../middlewares/auth';

const router = express.Router();

router.post('/login', CustomerAuthController.loginCustomer);
router.post('/refresh-token', CustomerAuthController.refreshToken);

router.post(
  '/change-password',
  auth('CUSTOMER'), // Assuming auth middleware can handle 'CUSTOMER' role
  CustomerAuthController.changePassword
);

export const CustomerAuthRoutes = router;
