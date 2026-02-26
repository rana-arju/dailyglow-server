import express from 'express';

import { AuthRouters } from '../modules/auth/auth.routes';
import { UsersRoutes } from '../modules/Users/Users.route';
import { ContactRoutes } from '../modules/Contacts/Contacts.route';
import { ContactFolderRoutes } from '../modules/ContactFolder/ContactFolder.route';
import { CampaignRoutes } from '../modules/Campaigns/Campaigns.route';
import { TrackingRoutes } from '../modules/Tracking/Tracking.route';
import { DashboardRoutes } from '../modules/Dashboard/Dashboard.route';
import { AdminRoutes } from '../modules/Admin/Admin.route';
import { OrderRoutes } from '../modules/Orders/order.routes';
import emailTemplateRoutes from '../../routes/emailTemplateRoutes';

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
    path: '/contacts',
    route: ContactRoutes,
  },
  {
    path: '/contact-folders',
    route: ContactFolderRoutes,
  },
  {
    path: '/campaigns',
    route: CampaignRoutes,
  },
  {
    path: '/track',
    route: TrackingRoutes,
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
    path: '/',
    route: emailTemplateRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
