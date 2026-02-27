import { PrismaClient } from '@prisma/client';
import { generateUniqueOrderId } from '../app/utils/generateOrderId';

const prisma = new PrismaClient();

async function migrateOrderNumbers() {
  console.log('Starting order number migration...');

  try {
    // Find all orders without orderNumber
    const ordersWithoutNumber = await prisma.order.findMany({
      where: {
        orderNumber: null,
      },
    });

    console.log(`Found ${ordersWithoutNumber.length} orders without order numbers`);

    // Update each order with a unique order number
    for (const order of ordersWithoutNumber) {
      let orderNumber = generateUniqueOrderId();
      
      // Ensure uniqueness
      let existing = await prisma.order.findUnique({
        where: { orderNumber },
      });
      
      while (existing) {
        orderNumber = generateUniqueOrderId();
        existing = await prisma.order.findUnique({
          where: { orderNumber },
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { orderNumber },
      });

      console.log(`Updated order ${order.id} with number ${orderNumber}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateOrderNumbers();
