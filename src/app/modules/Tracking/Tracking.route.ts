import express from 'express';
import { TrackingController } from './Tracking.controller';
import { TrackingController as NewTrackingController } from '../../../controllers/tracking.controller';

const router = express.Router();
const newTracking = new NewTrackingController();

// New tracking endpoints with token-based tracking
router.get('/open', newTracking.trackOpen.bind(newTracking));
router.get('/click', newTracking.trackClick.bind(newTracking));
router.get('/unsubscribe', newTracking.unsubscribe.bind(newTracking));
router.post('/unsubscribe', newTracking.unsubscribeOneClick.bind(newTracking));

// Legacy tracking endpoints (Public)
router.get('/open/:campaignId/:contactId', TrackingController.trackOpen);
router.get('/click/:campaignId/:contactId', TrackingController.trackClick);
router.get('/unsubscribe/:contactId', TrackingController.unsubscribe);

// SES Webhook endpoint (Public, but should be secured with SNS signature validation in production)
router.post('/webhook/ses', TrackingController.handleSESWebhook);

export const TrackingRoutes = router;
