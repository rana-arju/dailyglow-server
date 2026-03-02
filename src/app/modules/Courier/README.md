# Steadfast (Packzy) Courier Integration

Complete end-to-end shipping workflow with admin dashboard actions, database storage, webhook live updates, and balance management.

## Features

- ✅ Create shipments in Steadfast via API
- ✅ Store all shipment details in MongoDB using Prisma
- ✅ Real-time webhook integration for delivery/tracking updates
- ✅ Balance management and withdrawal requests
- ✅ Delivery man assignment tracking
- ✅ Background sync for shipment status (fallback)
- ✅ Comprehensive error handling and idempotency

## Database Models

### Shipment
Stores all shipment information including:
- Order relationship (one-to-one)
- Steadfast consignment details
- Delivery status and tracking
- Recipient information
- Delivery man assignment
- Provider payload (for debugging)

### CourierEvent
Tracks all webhook events:
- Delivery status updates
- Tracking updates
- Raw payload storage
- Duplicate prevention

### CourierBalanceSnapshot
Stores balance history:
- Current balance snapshots
- Timestamp tracking

### WithdrawalRequest
Manages withdrawal workflow:
- Amount and status tracking
- Admin approval workflow

## API Endpoints

### Admin Endpoints

#### 1. Create Shipment
```
POST /api/courier/shipments
```

**Request Body:**
```json
{
  "orderId": "order_id_here",
  "invoice": "INV-12345",
  "recipient_name": "John Doe",
  "recipient_phone": "01712345678",
  "alternative_phone": "01812345678",
  "recipient_email": "john@example.com",
  "recipient_address": "House 10, Road 5, Dhanmondi, Dhaka",
  "cod_amount": 1500,
  "note": "Deliver before 5 PM",
  "item_description": "Beauty products",
  "total_lot": 2,
  "delivery_type": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "id": "shipment_id",
    "consignmentId": "12345",
    "trackingCode": "ABC123",
    "deliveryStatus": "in_review",
    ...
  }
}
```

#### 2. Get All Shipments
```
GET /api/courier/shipments?deliveryStatus=in_review&page=1&limit=10
```

#### 3. Get Shipment by Order ID
```
GET /api/courier/shipments/order/:orderId
```

#### 4. Sync Shipment Status (Manual)
```
POST /api/courier/shipments/:shipmentId/sync
```

#### 5. Assign Delivery Man
```
POST /api/courier/shipments/assign-delivery-man
```

**Request Body:**
```json
{
  "shipmentId": "shipment_id_here",
  "assignedToName": "Delivery Man Name",
  "assignedToPhone": "01712345678",
  "assignedToHub": "Dhanmondi Hub",
  "internalNote": "Handle with care"
}
```

#### 6. Get Balance
```
GET /api/courier/balance
```

**Response:**
```json
{
  "success": true,
  "message": "Balance retrieved successfully",
  "data": {
    "status": 200,
    "current_balance": 15000.50
  }
}
```

#### 7. Create Withdrawal Request
```
POST /api/courier/withdrawals
```

**Request Body:**
```json
{
  "amount": 5000,
  "note": "Monthly withdrawal"
}
```

#### 8. Get Withdrawal Requests
```
GET /api/courier/withdrawals
```

#### 9. Update Withdrawal Status
```
PATCH /api/courier/withdrawals/:id/status
```

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

Status options: `PROCESSING`, `COMPLETED`, `REJECTED`

### Webhook Endpoint

#### Steadfast Webhook
```
POST /api/courier/webhook
```

**Headers:**
```
Authorization: Bearer YOUR_WEBHOOK_SECRET
Content-Type: application/json
```

**Delivery Status Payload:**
```json
{
  "notification_type": "delivery_status",
  "consignment_id": 12345,
  "invoice": "INV-67890",
  "cod_amount": 1500.00,
  "status": "delivered",
  "delivery_charge": 100.00,
  "tracking_message": "Package delivered successfully",
  "updated_at": "2025-03-02 12:45:30"
}
```

**Tracking Update Payload:**
```json
{
  "notification_type": "tracking_update",
  "consignment_id": 12345,
  "invoice": "INV-67890",
  "tracking_message": "Package arrived at sorting center",
  "updated_at": "2025-03-02 13:15:00"
}
```

## Workflow

### 1. Order Placement
- Customer places order on website
- Order stored in database with status `PENDING`

### 2. Admin Confirms Shipment
- Admin views order in dashboard
- Clicks "Confirm Shipment" button
- Review modal opens with prefilled data:
  - Invoice (auto-generated or custom)
  - Recipient details from order
  - COD amount
  - Delivery instructions
- Admin can edit any field
- On confirm:
  - Validates data using Zod
  - Calls Steadfast API
  - Stores shipment in database
  - Updates order status to `SHIPPED`

### 3. Live Updates via Webhook
- Steadfast sends webhook on status changes
- System verifies webhook token
- Updates shipment status in database
- Creates courier event record
- Updates order status if delivered/cancelled
- Prevents duplicate events

### 4. Background Sync (Fallback)
- Cron job runs every 30 minutes
- Syncs shipments not in final status
- Calls Steadfast status API
- Updates database if status changed
- Ensures no updates are missed

### 5. Delivery Man Assignment
- Admin can assign delivery man internally
- Stores name, phone, hub, and notes
- Useful for tracking and customer service

### 6. Balance & Withdrawals
- Admin checks current balance
- Creates withdrawal request
- System stores request with status
- Admin manually processes withdrawal
- Updates status to COMPLETED

## Configuration

### Environment Variables

Add to `.env`:
```env
STEADFAST_API_KEY=your-api-key
STEADFAST_SECRET_KEY=your-secret-key
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_WEBHOOK_SECRET=your-webhook-secret
```

### Steadfast Portal Setup

1. Login to Steadfast portal
2. Go to Settings > API
3. Copy API Key and Secret Key
4. Go to Settings > Webhook
5. Set Callback URL: `https://yourdomain.com/api/courier/webhook`
6. Set Auth Token (Bearer): Your webhook secret
7. Save configuration

## Delivery Statuses

| Status | Description |
|--------|-------------|
| `pending` | Consignment not delivered or cancelled yet |
| `in_review` | Order placed, waiting to be reviewed |
| `delivered_approval_pending` | Delivered, waiting for admin approval |
| `partial_delivered_approval_pending` | Partially delivered, waiting for approval |
| `cancelled_approval_pending` | Cancelled, waiting for approval |
| `delivered` | Delivered and balance added |
| `partial_delivered` | Partially delivered and balance added |
| `cancelled` | Cancelled and balance updated |
| `hold` | Consignment is held |
| `unknown` | Unknown status, contact support |

## Error Handling

### Failed Shipment Creation
- If Steadfast API fails, shipment is still created in DB
- Status set to `failed`
- Error details stored in `providerPayload`
- Admin can retry or investigate

### Webhook Failures
- Background sync ensures updates are not missed
- Duplicate prevention using unique keys
- All webhook payloads stored for debugging

### Idempotency
- Invoice must be unique across all shipments
- One shipment per order (enforced by unique constraint)
- Duplicate webhook events are ignored

## Testing

### Test Shipment Creation
```bash
curl -X POST http://localhost:5000/api/courier/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_id",
    "invoice": "TEST-001",
    "recipient_name": "Test User",
    "recipient_phone": "01712345678",
    "recipient_address": "Test Address, Dhaka",
    "cod_amount": 1000
  }'
```

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/courier/webhook \
  -H "Authorization: Bearer your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "delivery_status",
    "consignment_id": 12345,
    "invoice": "TEST-001",
    "cod_amount": 1000,
    "status": "delivered",
    "delivery_charge": 60,
    "tracking_message": "Delivered successfully",
    "updated_at": "2025-03-02 12:00:00"
  }'
```

## Database Migration

Run Prisma migration:
```bash
cd dailyglowskin-server
npx prisma generate
npx prisma db push
```

## Cron Job

The background sync cron job:
- Runs every 30 minutes
- Syncs up to 100 shipments per run
- Only syncs non-final statuses
- Adds 500ms delay between API calls (rate limiting)
- Logs all activities

## Security

- Webhook endpoint verifies Bearer token
- All API endpoints should have admin authentication
- Sensitive data stored securely
- Error details not exposed to clients

## Future Enhancements

- [ ] Bulk shipment creation UI
- [ ] Return request management
- [ ] SMS notifications to customers
- [ ] Shipment tracking page for customers
- [ ] Analytics dashboard
- [ ] Export shipment reports
- [ ] Integration with other courier services

## Support

For issues or questions:
1. Check Steadfast API documentation
2. Review error logs in database
3. Contact Steadfast support for API issues
4. Check webhook configuration in portal
