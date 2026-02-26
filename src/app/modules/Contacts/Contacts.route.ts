import express from 'express';
import { ContactController } from './Contacts.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ContactValidation } from './Contacts.validation';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// import auth from '../../middlewares/auth'; // Uncomment when auth is ready

const router = express.Router();

// Configure multer for CSV upload
const uploadDir = path.join(__dirname, '../../../public/uploads/csv');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'contacts-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// CSV Upload and Preview
router.post(
  '/upload-csv-preview',
  // auth(),
  upload.single('file'),
  ContactController.uploadCSVPreview
);

// Import contacts from preview
router.post(
  '/import-contacts',
  // auth(),
  validateRequest(ContactValidation.csvImportSchema),
  ContactController.importContacts
);

// Create a single contact
router.post(
  '/',
  // auth(),
  validateRequest(ContactValidation.createContactSchema),
  ContactController.createContact
);

// Get all contacts
router.get(
  '/',
  // auth(),
  ContactController.getAllContacts
);

// Update contact
router.patch(
  '/:id',
  // auth(),
  validateRequest(ContactValidation.updateContactSchema),
  ContactController.updateContact
);

// Delete contact
router.delete(
  '/:id',
  // auth(),
  ContactController.deleteContact
);

// Delete multiple contacts
router.post(
  '/delete-multiple',
  // auth(),
  ContactController.deleteMultipleContacts
);

export const ContactRoutes = router;
