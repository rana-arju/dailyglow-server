import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { DashboardService } from './Dashboard.service';
import { DateFilter } from './dashboard.interface';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const { filter = 'today' } = req.query;

  const result = await DashboardService.getDashboardStats(filter as DateFilter);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats retrieved successfully',
    data: result,
  });
});

// Placeholder for other methods (if needed for email campaigns)
const getSubscribersTrend = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Not implemented',
    data: [],
  });
});

const getFolderStats = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Not implemented',
    data: [],
  });
});

const getStatusDistribution = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Not implemented',
    data: [],
  });
});

const getCampaignStats = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Not implemented',
    data: [],
  });
});

const getCampaignTrend = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Not implemented',
    data: [],
  });
});

const getCampaignPerformanceByMonth = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Not implemented',
    data: [],
  });
});

export const DashboardController = {
  getDashboardStats,
  getSubscribersTrend,
  getFolderStats,
  getStatusDistribution,
  getCampaignStats,
  getCampaignTrend,
  getCampaignPerformanceByMonth,
};
