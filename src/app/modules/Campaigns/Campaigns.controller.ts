import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { CampaignServices } from './Campaigns.services';
import pickValidFields from '../../shared/pickValidFields';

import { uploadToS3 } from '../../utils/s3.service';
import fs from 'fs';

const createCampaignManual = catchAsync(async (req: Request, res: Response) => {
  const result = await CampaignServices.createCampaignManual(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Campaign created with manual recipients successfully',
    data: result,
  });
});

const createCampaignCSV = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new Error('CSV file is required');
  }

  // Upload to S3 for persistence
  const s3Key = `campaigns/${Date.now()}-${req.file.originalname}`;
  const s3Url = await uploadToS3(req.file.path, s3Key);

  const result = await CampaignServices.createCampaignCSV(req.body, req.file.path);

  // Clean up local file
  if (fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
  }

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Campaign created with CSV recipients successfully',
    data: {
      ...result,
      s3Url,
    },
  });
});

const getAllCampaigns = catchAsync(async (req: Request, res: Response) => {
  const filters = pickValidFields(req.query, ['searchTerm', 'status']);
  const options = pickValidFields(req.query, [
    'limit',
    'page',
    'sortBy',
    'sortOrder',
  ]);

  const result = await CampaignServices.getAllCampaigns(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaigns fetched successfully',
    data: result,
  });
});

const getCampaignById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CampaignServices.getCampaignById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign fetched successfully',
    data: result,
  });
});

const updateCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CampaignServices.updateCampaign(id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign updated successfully',
    data: result,
  });
});

const sendCampaign = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CampaignServices.sendCampaign(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign sending initiated',
    data: result,
  });
});

const getCampaignStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CampaignServices.getCampaignStats(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign stats fetched successfully',
    data: result,
  });
});

export const CampaignController = {
  createCampaignManual,
  createCampaignCSV,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  sendCampaign,
  getCampaignStats,
};
