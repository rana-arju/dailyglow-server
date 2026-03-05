import express from 'express';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';
import { AdminController } from './Admin.controller';
import validateRequest from '../../middlewares/validateRequest';
import { AdminValidation } from './Admin.validation';

const router = express.Router();

// Get all admins with filtering and pagination
router.get('/', auth(Role.SUPERADMIN), AdminController.getAllAdmins);

// Get admin by ID
router.get('/:id', auth(Role.SUPERADMIN), AdminController.getAdminById);

// Create new admin (only SUPERADMIN)
router.post(
  '/',
  auth(Role.SUPERADMIN),
  validateRequest(AdminValidation.createAdminSchema),
  AdminController.createAdmin
);

// Suspend admin (only SUPERADMIN)
router.patch('/:id/suspend', auth(Role.SUPERADMIN), AdminController.suspendAdmin);

// Activate admin (only SUPERADMIN)
router.patch('/:id/activate', auth(Role.SUPERADMIN), AdminController.activateAdmin);

// Delete admin (only SUPERADMIN)
router.delete('/:id', auth(Role.SUPERADMIN), AdminController.deleteAdmin);

export const AdminRoutes = router;
