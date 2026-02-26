import express from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { UsersController } from './Users.controller';
import { fileUploader } from '../../middlewares/multerFileUpload';
import validateRequest from '../../middlewares/validateRequest';
import { UserUpdate, DealerIdValidation } from './User.validation';

const router = express.Router();

router.get('/me', auth(Role.USER, Role.ADMIN, Role.SUPERADMIN), UsersController.getMyProfile);
router.put(
  '/update-profile',
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  validateRequest(UserUpdate),
  UsersController.updateMyProfile
);

router.get('/all', auth(Role.ADMIN, Role.SUPERADMIN), UsersController.getAllUsers);
router.get('/suspended-user', auth(Role.ADMIN, Role.SUPERADMIN), UsersController.getAllBlockedUsers);

router.put('/status/:userId', auth(Role.ADMIN, Role.SUPERADMIN), UsersController.updateUserStatus);
router.put('/role/:userId', auth(Role.ADMIN, Role.SUPERADMIN), UsersController.updateUserRole);
router.post(
  '/me/uploads-profile-photo',
  auth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  fileUploader.profileImage,
  UsersController.updateMyProfileImage
);

// ============= PROFILE PAGE ROUTES =============

// Get my profile stats (authenticated user)
router.get('/profile/stats/me', auth(Role.USER, Role.ADMIN, Role.SUPERADMIN), UsersController.getMyProfileStats);

// Get user profile stats by ID (admin or public)
router.get('/profile/stats/:userId', UsersController.getUserProfileStats);

router.get('/:id', UsersController.getUserProfileById);

export const UsersRoutes = router;
