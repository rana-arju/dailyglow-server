import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { DashboardService } from './Dashboard.service';

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30days';
  const result = await DashboardService.getDashboardStats(period);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard stats fetched successfully',
    data: result,
  });
});

const getSubscribersTrend = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30days';
  const result = await DashboardService.getSubscribersTrend(period);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Subscribers trend fetched successfully',
    data: result,
  });
});

const getFolderStats = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getFolderStats();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Folder stats fetched successfully',
    data: result,
  });
});

const getStatusDistribution = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getStatusDistribution();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Status distribution fetched successfully',
    data: result,
  });
});

const getCampaignStats = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30days';
  const result = await DashboardService.getCampaignStats(period);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign stats fetched successfully',
    data: result,
  });
});

const getCampaignTrend = catchAsync(async (req: Request, res: Response) => {
  const period = (req.query.period as string) || '30days';
  const result = await DashboardService.getCampaignTrend(period);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign trend fetched successfully',
    data: result,
  });
});

const getCampaignPerformanceByMonth = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getCampaignPerformanceByMonth();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Campaign performance fetched successfully',
    data: result,
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
