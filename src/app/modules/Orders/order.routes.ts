import express from 'express';
import { OrderController } from './order.controller';
import validateRequest from '../../middlewares/validateRequest';
import { createOrderSchema, updateOrderStatusSchema } from './order.validation';

const router = express.Router();

// Create order (public route)
router.post(
  '/',
  validateRequest(createOrderSchema),
  OrderController.createOrder
);

// Track order (public route)
router.get('/track', OrderController.trackOrder);

// Get all orders (admin route - add auth middleware if needed)
router.get('/', OrderController.getAllOrders);

// Get order by ID
router.get('/:id', OrderController.getOrderById);

// Update order status (admin route - add auth middleware if needed)
router.patch(
  '/:id/status',
  validateRequest(updateOrderStatusSchema),
  OrderController.updateOrderStatus
);

// Update order (admin route - add auth middleware if needed)
router.patch('/:id', OrderController.updateOrder);

// Delete order (admin route - add auth middleware if needed)
router.delete('/:id', OrderController.deleteOrder);

export const OrderRoutes = router;
