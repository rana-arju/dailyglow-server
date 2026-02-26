import express from 'express';
import { CampaignController } from './Campaigns.controller';
import validateRequest from '../../middlewares/validateRequest';
import { CampaignValidation } from './Campaigns.validation';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

import { fileUploader } from '../../middlewares/multerFileUpload';

router.post(
  '/create-manual',
  auth(Role.ADMIN, Role.SUPERADMIN),
  validateRequest(CampaignValidation.createCampaignManual),
  CampaignController.createCampaignManual
);

router.post(
  '/create-csv',
  auth(Role.ADMIN, Role.SUPERADMIN),
  fileUploader.csvUpload,
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(CampaignValidation.createCampaignCSV),
  CampaignController.createCampaignCSV
);

router.get(
  '/',
  auth(Role.ADMIN, Role.SUPERADMIN),
  CampaignController.getAllCampaigns
);

router.get(
  '/:id',
  auth(Role.ADMIN, Role.SUPERADMIN),
  CampaignController.getCampaignById
);

router.put(
  '/:id',
  auth(Role.ADMIN, Role.SUPERADMIN),
  validateRequest(CampaignValidation.updateCampaign),
  CampaignController.updateCampaign
);

router.post(
  '/:id/send',
  auth(Role.ADMIN, Role.SUPERADMIN),
  CampaignController.sendCampaign
);

router.get(
  '/:id/stats',
  auth(Role.ADMIN, Role.SUPERADMIN),
  CampaignController.getCampaignStats
);

export const CampaignRoutes = router;
