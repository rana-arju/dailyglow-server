import express from 'express';
import { CustomerController } from './customer.controller';

const router = express.Router();

// Get all customers (admin route)
router.get('/', CustomerController.getAllCustomers);

// Get customer by ID
router.get('/:id', CustomerController.getCustomerById);

export const CustomerRoutes = router;
