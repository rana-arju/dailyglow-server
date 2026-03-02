import express from 'express';

import { AuthRouters } from '../modules/auth/auth.routes';
import { UsersRoutes } from '../modules/Users/Users.route';
import { AdminRoutes } from '../modules/Admin/Admin.route';
import { OrderRoutes } from '../modules/Orders/order.routes';
import { CustomerRoutes } from '../modules/Customers/customer.routes';
import { CustomerAuthRoutes } from '../modules/customerAuth/customerAuth.routes';
import { DashboardRoutes } from '../modules/Dashboard';
import { CourierRoutes } from '../modules/Courier';
import { WebhookRoutes } from '../modules/Webhooks';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
  },
  {
    path: '/customer-auth',
    route: CustomerAuthRoutes,
  },
  {
    path: '/users',
    route: UsersRoutes,
  },
  {
    path: '/admins',
    route: AdminRoutes,
  },
  {
    path: '/dashboard',
    route: DashboardRoutes,
  },

  {
    path: '/orders',
    route: OrderRoutes,
  },
  {
    path: '/customers',
    route: CustomerRoutes,
  },
  {
    path: '/courier',
    route: CourierRoutes,
  },
  {
    path: '/webhooks',
    route: WebhookRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
