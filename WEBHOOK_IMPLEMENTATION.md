# Steadfast Webhook Implementation

## Overview
This document describes the implementation of real-time order tracking using Steadfast courier webhooks.

## Webhook Endpoint
```
POST https://dailyglowskin-server.vercel.app/api/v1/webhooks/steadfast
```

## Authentication
The webhook requires Bearer token authentication:
```
Authorization: Bearer YOUR_STEADFAST_WEBHOOK_SECRET
```

Set the `STEADFAST_WEBHOOK_SECRET` in your `.env` file.

## Webhook Payloads

### 1. Delivery Status Update
```json
{
  "notification_type": "delivery_status",
  "consignment_id": 12345,
  "invoice": "INV-67890",
  "cod_amount": 1500.00,
  "status": "delivered",
  "delivery_charge": 100.00,
  "tracking_message": "Your package has been delivered successfully.",
  "updated_at": "2025-03-02 12:45:30"
}
```

**Supported Status Values:**
- `pending` - Order is being processed
- `delivered` - Order delivered successfully
- `partial_delivered` - Order partially delivered
- `cancelled` - Order cancelled
- `hold` - Order on hold
- `in_review` - Order under review

### 2. Tracking Update
```json
{
  "notification_type": "tracking_update",
  "consignment_id": 12345,
  "invoice": "INV-67890",
  "tracking_message": "Package arrived at the sorting center.",
  "updated_at": "2025-03-02 13:15:00"
}
```

## Database Schema

### OrderTrackingEvent Model
Stores all tracking events for an order:
```prisma
model OrderTrackingEvent {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  orderId   String   @db.ObjectId
  status    String   // Display status (e.g., "Delivered", "Shipped")
  note      String   // Tracking message
  timestamp DateTime // Event timestamp from webhook
  createdAt DateTime @default(now())
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

## Implementation Flow

1. **Webhook Receives Event**
   - Validates Bearer token
   - Finds shipment by `consignment_id`
   - Checks for duplicate events

2. **Updates Shipment Record**
   - Updates delivery status
   - Updates tracking message
   - Updates last updated timestamp

3. **Creates Courier Event**
   - Stores raw webhook payload
   - Records event details

4. **Updates Order Status**
   - Maps delivery status to order status
   - Updates order status note
   - Creates OrderTrackingEvent record

5. **Frontend Display**
   - Order details page fetches tracking events
   - Displays timeline with timestamps and notes
   - Shows real-time status updates

## Status Mapping

| Steadfast Status | Order Status | Display Status |
|-----------------|--------------|----------------|
| delivered | DELIVERED | Delivered |
| partial_delivered | DELIVERED | Delivered |
| cancelled | CANCELLED | Cancelled |
| hold | PROCESSING | On Hold |
| pending | PROCESSING | Pending |
| in_review | PROCESSING | In Review |

## Frontend Integration

### API Response
```typescript
interface Order {
  id: string;
  status: OrderStatus;
  statusNote?: string;
  trackingEvents?: OrderTrackingEvent[];
  shipment?: {
    trackingCode?: string;
    deliveryStatus: string;
    trackingMessage?: string;
  };
}

interface OrderTrackingEvent {
  id: string;
  orderId: string;
  status: string;
  note: string;
  timestamp: string;
  createdAt: string;
}
```

### Display Example
The order details page (`/orders/[orderId]`) displays:
- Timeline of all tracking events
- Event timestamps (time and date)
- Status labels
- Tracking messages/notes
- Tracking code (if available)

## Testing

### Test Webhook Locally
```bash
curl -X POST http://localhost:5000/api/v1/webhooks/steadfast \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "notification_type": "delivery_status",
    "consignment_id": 12345,
    "invoice": "ORD-123456",
    "cod_amount": 1500.00,
    "status": "delivered",
    "delivery_charge": 100.00,
    "tracking_message": "Your package has been delivered successfully.",
    "updated_at": "2025-03-02 12:45:30"
  }'
```

## Configuration

### Environment Variables
```env
STEADFAST_API_KEY=your-api-key
STEADFAST_SECRET_KEY=your-secret-key
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_WEBHOOK_SECRET=your-webhook-secret-token
```

### Steadfast Dashboard Setup
1. Log in to Steadfast dashboard
2. Navigate to Settings > Webhooks
3. Add webhook URL: `https://dailyglowskin-server.vercel.app/api/v1/webhooks/steadfast`
4. Set authentication header: `Bearer YOUR_WEBHOOK_SECRET`
5. Enable events: Delivery Status Update, Tracking Update

## Files Modified

### Backend
- `prisma/schema.prisma` - Added OrderTrackingEvent model
- `src/app/modules/Courier/courier.service.ts` - Enhanced webhook handler
- `src/app/modules/Orders/order.service.ts` - Added tracking events to order query
- `src/app/modules/Webhooks/` - New webhook module
- `src/app/routes/index.ts` - Added webhook routes

### Frontend
- `lib/api/orders.ts` - Added tracking event types
- `app/(site)/orders/[orderId]/page.tsx` - Display tracking timeline

## Notes
- Duplicate webhook events are automatically detected and ignored
- All webhook payloads are stored in `CourierEvent` for debugging
- Tracking events are displayed in chronological order
- The system supports both delivery status and tracking updates
