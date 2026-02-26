import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { TrackingController } from '../controllers/tracking.controller';

const router = Router();
const campaignController = new CampaignController();
const trackingController = new TrackingController();

// Campaign routes
router.post('/campaigns', campaignController.createCampaign.bind(campaignController));
router.put('/campaigns/:id', campaignController.updateCampaign.bind(campaignController));
router.get('/campaigns/:id', campaignController.getCampaign.bind(campaignController));
router.get('/campaigns', campaignController.listCampaigns.bind(campaignController));
router.post('/campaigns/:id/send', campaignController.sendCampaign.bind(campaignController));
router.get('/campaigns/:id/stats', campaignController.getCampaignStats.bind(campaignController));
router.delete('/campaigns/:id', campaignController.deleteCampaign.bind(campaignController));

// Tracking routes
router.get('/track/open', trackingController.trackOpen.bind(trackingController));
router.get('/track/click', trackingController.trackClick.bind(trackingController));
router.get('/unsubscribe', trackingController.unsubscribe.bind(trackingController));
router.post('/unsubscribe', trackingController.unsubscribeOneClick.bind(trackingController));

export default router;
