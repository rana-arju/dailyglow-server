import express from 'express';
import { WebhookController } from './webhook.controller';

const router = express.Router();

// Steadfast webhook endpoint (no auth middleware, verified in controller)
router.post('/steadfast', WebhookController.handleSteadfastWebhook);

export const WebhookRoutes = router;
