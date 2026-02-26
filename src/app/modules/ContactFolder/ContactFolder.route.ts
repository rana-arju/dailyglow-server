import express from 'express';
import { ContactFolderController } from './ContactFolder.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ContactFolderValidation } from './ContactFolder.validation';
// import auth from '../../middlewares/auth'; // Uncomment when auth is ready

const router = express.Router();

// Create a new folder
router.post(
  '/',
  // auth(), // Uncomment when auth middleware is ready
  validateRequest(ContactFolderValidation.createContactFolderSchema),
  ContactFolderController.createFolder
);

// Get all folders
router.get(
  '/',
  // auth(),
  ContactFolderController.getAllFolders
);

// Get folder by ID
router.get(
  '/:id',
  // auth(),
  ContactFolderController.getFolderById
);

// Update folder
router.patch(
  '/:id',
  // auth(),
  validateRequest(ContactFolderValidation.updateContactFolderSchema),
  ContactFolderController.updateFolder
);

// Delete folder
router.delete(
  '/:id',
  // auth(),
  ContactFolderController.deleteFolder
);

export const ContactFolderRoutes = router;
