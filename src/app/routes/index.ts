import express from 'express';

import { AuthRouters } from '../modules/auth/auth.routes';
import { UsersRoutes } from '../modules/Users/Users.route';
import { DashboardRoutes } from '../modules/Dashboard/Dashboard.route';
import { AdminRoutes } from '../modules/Admin/Admin.route';
import { OrderRoutes } from '../modules/Orders/order.routes';
import { CustomerRoutes } from '../modules/Customers/customer.routes';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRouters,
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
