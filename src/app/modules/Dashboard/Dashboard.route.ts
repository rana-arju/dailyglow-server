import express from 'express';
import { DashboardController } from './Dashboard.controller';

const router = express.Router();

router.get('/stats', DashboardController.getDashboardStats);
router.get('/trend', DashboardController.getSubscribersTrend);
router.get('/folders', DashboardController.getFolderStats);
router.get('/status-distribution', DashboardController.getStatusDistribution);
router.get('/campaign-stats', DashboardController.getCampaignStats);
router.get('/campaign-trend', DashboardController.getCampaignTrend);
router.get('/campaign-performance', DashboardController.getCampaignPerformanceByMonth);

export const DashboardRoutes = router;
