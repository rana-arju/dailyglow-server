import express from 'express';
import { CourierController } from './courier.controller';
import validateRequest from '../../middlewares/validateRequest';
import { CourierValidation } from './courier.validation';

const router = express.Router();

// Public customer tracking endpoint
router.get('/track', CourierController.getCustomerOrderTracking);

// Webhook endpoint (no auth required, verified in controller)
router.post('/webhook', CourierController.handleWebhook);

// Admin routes (add auth middleware as needed)
router.get(
  '/shipments/review/:orderId',
  CourierController.getShipmentReviewData
);

router.post(
  '/shipments',
  validateRequest(CourierValidation.createShipmentSchema),
  CourierController.createShipment
);

router.get('/shipments', CourierController.getAllShipments);

router.get('/shipments/order/:orderId', CourierController.getShipmentByOrderId);

router.post('/shipments/:shipmentId/sync', CourierController.syncShipmentStatus);

router.post(
  '/shipments/assign-delivery-man',
  validateRequest(CourierValidation.assignDeliveryManSchema),
  CourierController.assignDeliveryMan
);

router.get('/balance', CourierController.getBalance);

router.post(
  '/withdrawals',
  validateRequest(CourierValidation.withdrawalRequestSchema),
  CourierController.createWithdrawalRequest
);

router.get('/withdrawals', CourierController.getWithdrawalRequests);

router.patch('/withdrawals/:id/status', CourierController.updateWithdrawalStatus);

export const CourierRoutes = router;
