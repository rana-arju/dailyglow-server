import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import httpStatus from 'http-status';
import { CourierService } from '../Courier/courier.service';
import config from '../../../config';
import ApiError from '../../errors/ApiError';

const handleSteadfastWebhook = catchAsync(async (req: Request, res: Response) => {
  // Verify webhook authentication
  const authHeader = req.headers.authorization;
  const expectedToken = `Bearer ${config.steadfast.webhookSecret}`;

  if (!authHeader || authHeader !== expectedToken) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid webhook token');
  }

  await CourierService.handleWebhook(req.body);

  res.status(httpStatus.OK).json({
    status: 'success',
    message: 'Webhook received successfully.',
  });
});

export const WebhookController = {
  handleSteadfastWebhook,
};
