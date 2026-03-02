import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import steadfastClient from '../lib/steadfast.client';

const prisma = new PrismaClient();

// Statuses that are considered final (no need to sync)
const FINAL_STATUSES = [
  'delivered',
  'partial_delivered',
  'cancelled',
  'delivered_approval_pending',
  'partial_delivered_approval_pending',
  'cancelled_approval_pending',
];

export const startCourierSyncCron = () => {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Starting courier sync job...');

    try {
      // Get all shipments that are not in final status
      const shipmentsToSync = await prisma.shipment.findMany({
        where: {
          deliveryStatus: {
            notIn: FINAL_STATUSES,
          },
          consignmentId: {
            not: null,
          },
        },
        take: 100, // Limit to avoid overwhelming the API
      });

      console.log(`Found ${shipmentsToSync.length} shipments to sync`);

      for (const shipment of shipmentsToSync) {
        try {
          if (!shipment.consignmentId) continue;

          const statusResponse = await steadfastClient.getStatusByConsignmentId(
            parseInt(shipment.consignmentId)
          );

          // Update shipment if status changed
          if (statusResponse.delivery_status !== shipment.deliveryStatus) {
            await prisma.shipment.update({
              where: { id: shipment.id },
              data: {
                deliveryStatus: statusResponse.delivery_status,
                lastUpdatedAt: new Date(),
              },
            });

            console.log(
              `Updated shipment ${shipment.id} status to ${statusResponse.delivery_status}`
            );

            // Update order status if delivered or cancelled
            const statusMap: Record<string, string> = {
              delivered: 'DELIVERED',
              partial_delivered: 'DELIVERED',
              cancelled: 'CANCELLED',
            };

            if (statusMap[statusResponse.delivery_status]) {
              await prisma.order.update({
                where: { id: shipment.orderId },
                data: { status: statusMap[statusResponse.delivery_status] as any },
              });
            }
          }

          // Add small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error: any) {
          console.error(
            `Error syncing shipment ${shipment.id}:`,
            error.message
          );
        }
      }

      console.log('Courier sync job completed');
    } catch (error: any) {
      console.error('Error in courier sync job:', error.message);
    }
  });

  console.log('Courier sync cron job started (runs every 30 minutes)');
};
