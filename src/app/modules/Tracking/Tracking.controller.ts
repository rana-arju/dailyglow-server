import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { TrackingServices } from './Tracking.services';

const trackOpen = catchAsync(async (req: Request, res: Response) => {
  const { campaignId, contactId } = req.params;
  
  await TrackingServices.trackOpen(campaignId, contactId);

  // Return 1x1 transparent GIF pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.end(pixel);
});

const trackClick = catchAsync(async (req: Request, res: Response) => {
  const { campaignId, contactId } = req.params;
  const { url } = req.query as { url: string };

  if (url) {
    await TrackingServices.trackClick(campaignId, contactId, url);
    res.redirect(url);
  } else {
    res.status(httpStatus.BAD_REQUEST).send('URL is required');
  }
});

const unsubscribe = catchAsync(async (req: Request, res: Response) => {
  const { contactId } = req.params;
  await TrackingServices.unsubscribe(contactId);
  
  res.send('<h1>You have been successfully unsubscribed.</h1>');
});

const handleSESWebhook = catchAsync(async (req: Request, res: Response) => {
  // SNS sends a Message as a string in the body
  let body = req.body;
  
  // If SNS structure is used, Message might be JSON string
  if (typeof body.Message === 'string') {
    try {
      body = JSON.parse(body.Message);
    } catch (e) {
      // Ignored
    }
  }

  // Handle SNS subscription confirmation if needed
  if (req.body.Type === 'SubscriptionConfirmation') {
    // In a real scenario, you'd make a GET request to req.body.SubscribeURL
    console.log('SNS Subscription Confirmation URL:', req.body.SubscribeURL);
    return res.status(httpStatus.OK).send('OK');
  }

  await TrackingServices.handleSESWebhook(body);
  
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Webhook processed successfully',
    data: null,
  });
});

export const TrackingController = {
  trackOpen,
  trackClick,
  unsubscribe,
  handleSESWebhook,
};
