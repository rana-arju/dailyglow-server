# Steadfast (Packzy) Courier Integration - Setup Guide

Complete setup guide for integrating Steadfast courier service with your MERN backend.

## 📋 Prerequisites

- Node.js (v16+)
- MongoDB
- Steadfast account with API access
- Running backend server

## 🚀 Installation Steps

### 1. Database Migration

Generate Prisma client and push schema to MongoDB:

```bash
cd dailyglowskin-server
npx prisma generate
npx prisma db push
```

This will create the following collections:
- `shipments`
- `courier_events`
- `courier_balance_snapshots`
- `withdrawal_requests`

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Steadfast Courier Configuration
STEADFAST_API_KEY=your-api-key-here
STEADFAST_SECRET_KEY=your-secret-key-here
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_WEBHOOK_SECRET=your-webhook-secret-token
```

**How to get credentials:**
1. Login to [Steadfast Portal](https://portal.packzy.com)
2. Navigate to Settings > API
3. Copy your API Key and Secret Key
4. Generate a strong webhook secret (use: `openssl rand -hex 32`)

### 3. Steadfast Portal Configuration

#### API Setup
1. Go to Settings > API
2. Ensure API access is enabled
3. Note your API Key and Secret Key

#### Webhook Setup
1. Go to Settings > Webhook
2. Set Callback URL: `https://yourdomain.com/api/courier/webhook`
3. Set Auth Token: `Bearer your-webhook-secret-token`
4. Enable webhook notifications
5. Save configuration

**Important:** Replace `yourdomain.com` with your actual domain. For local testing, use ngrok or similar tunneling service.

### 4. Start the Server

```bash
npm run dev
```

The courier sync cron job will start automatically and run every 30 minutes.

## 🧪 Testing

### Test 1: Get Shipment Review Data

```bash
curl http://localhost:5000/api/courier/shipments/review/{orderId}
```

This endpoint returns prefilled shipment data from an order.

### Test 2: Create Shipment

```bash
curl -X POST http://localhost:5000/api/courier/shipments \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "your-order-id",
    "invoice": "INV-20250302-ABC123",
    "recipient_name": "John Doe",
    "recipient_phone": "01712345678",
    "recipient_address": "House 10, Road 5, Dhanmondi, Dhaka",
    "cod_amount": 1500,
    "note": "Deliver before 5 PM"
  }'
```

### Test 3: Get Balance

```bash
curl http://localhost:5000/api/courier/balance
```

### Test 4: Test Webhook (Local)

```bash
curl -X POST http://localhost:5000/api/courier/webhook \
  -H "Authorization: Bearer your-webhook-secret" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "delivery_status",
    "consignment_id": 12345,
    "invoice": "INV-20250302-ABC123",
    "cod_amount": 1500,
    "status": "delivered",
    "delivery_charge": 60,
    "tracking_message": "Package delivered successfully",
    "updated_at": "2025-03-02 12:00:00"
  }'
```

## 📊 Database Schema

### Shipment Model
```prisma
model Shipment {
  id                String    @id @default(auto()) @map("_id") @db.ObjectId
  orderId           String    @unique @db.ObjectId
  provider          String    @default("STEADFAST")
  consignmentId     String?   @unique
  trackingCode      String?
  invoice           String    @unique
  recipientName     String
  recipientPhone    String
  alternativePhone  String?
  recipientEmail    String?
  recipientAddress  String
  codAmount         Float
  deliveryCharge    Float?
  deliveryStatus    String    @default("in_review")
  trackingMessage   String?
  note              String?
  itemDescription   String?
  totalLot          Int?
  deliveryType      Int       @default(0)
  assignedToName    String?
  assignedToPhone   String?
  assignedToHub     String?
  internalNote      String?
  lastUpdatedAt     DateTime?
  providerPayload   Json?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

## 🔄 Workflow Integration

### Admin Dashboard Flow

1. **Order List Page**
   - Display all orders with status
   - Show "Confirm Shipment" button for CONFIRMED orders
   - Disable button if shipment already exists

2. **Confirm Shipment Modal**
   ```javascript
   // Fetch review data
   const response = await fetch(`/api/courier/shipments/review/${orderId}`);
   const reviewData = await response.json();
   
   // Display in modal/form for editing
   // On submit, call create shipment API
   ```

3. **Create Shipment**
   ```javascript
   const response = await fetch('/api/courier/shipments', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(shipmentData)
   });
   ```

4. **View Shipment Details**
   ```javascript
   const response = await fetch(`/api/courier/shipments/order/${orderId}`);
   const shipment = await response.json();
   
   // Display:
   // - Tracking code
   // - Delivery status
   // - Tracking message
   // - Courier events history
   // - Assigned delivery man
   ```

### Frontend Example (React)

```jsx
// ConfirmShipmentButton.jsx
import { useState } from 'react';

function ConfirmShipmentButton({ orderId }) {
  const [loading, setLoading] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/courier/shipments/review/${orderId}`
      );
      const data = await response.json();
      setReviewData(data.data);
      setShowModal(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/courier/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        alert('Shipment created successfully!');
        setShowModal(false);
        // Refresh order list
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <>
      <button onClick={handleConfirm} disabled={loading}>
        {loading ? 'Loading...' : 'Confirm Shipment'}
      </button>
      
      {showModal && (
        <ShipmentReviewModal
          data={reviewData}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
```

## 🔐 Security Considerations

1. **Webhook Authentication**
   - Always verify Bearer token in webhook endpoint
   - Use strong, random webhook secret
   - Rotate secrets periodically

2. **API Authentication**
   - Add admin authentication middleware to all admin routes
   - Implement role-based access control
   - Log all shipment creation attempts

3. **Data Validation**
   - All inputs validated using Zod schemas
   - Phone numbers must be 11 digits
   - Invoice must be unique
   - COD amount cannot be negative

## 📈 Monitoring

### Check Cron Job Status

The cron job logs to console. Monitor your server logs:

```bash
# Look for these messages
Starting courier sync job...
Found X shipments to sync
Updated shipment {id} status to {status}
Courier sync job completed
```

### Database Queries

```javascript
// Check recent shipments
db.shipments.find().sort({ createdAt: -1 }).limit(10)

// Check webhook events
db.courier_events.find().sort({ createdAt: -1 }).limit(10)

// Check balance snapshots
db.courier_balance_snapshots.find().sort({ fetchedAt: -1 }).limit(10)

// Check pending withdrawals
db.withdrawal_requests.find({ status: 'REQUESTED' })
```

## 🐛 Troubleshooting

### Issue: Shipment creation fails

**Check:**
1. API credentials are correct in `.env`
2. Steadfast account has sufficient balance
3. Invoice is unique
4. Phone number is 11 digits
5. Check `providerPayload` in database for error details

### Issue: Webhook not receiving updates

**Check:**
1. Webhook URL is publicly accessible
2. Bearer token matches in both systems
3. Webhook is enabled in Steadfast portal
4. Check server logs for incoming requests
5. Test with ngrok for local development

### Issue: Cron job not running

**Check:**
1. Server is running continuously
2. Check console logs for cron messages
3. Verify cron schedule syntax
4. Check for errors in sync logic

## 📞 Support

### Steadfast Support
- Portal: https://portal.packzy.com
- Support: Contact through portal

### API Documentation
- Base URL: https://portal.packzy.com/api/v1
- Refer to official Steadfast API docs

## 🎯 Next Steps

1. ✅ Complete database migration
2. ✅ Configure environment variables
3. ✅ Set up webhook in Steadfast portal
4. ✅ Test shipment creation
5. ✅ Test webhook reception
6. ✅ Integrate with admin dashboard
7. ✅ Add authentication middleware
8. ✅ Monitor production logs
9. ✅ Set up error alerting

## 📝 Notes

- Invoice format: Alphanumeric with hyphens/underscores, max 50 chars
- Phone format: 11 digits starting with 01
- Address max length: 250 characters
- Recipient name max length: 100 characters
- Delivery types: 0 = home delivery, 1 = point delivery
- COD amount must be >= 0

## 🔄 Updates & Maintenance

- Regularly check balance snapshots
- Monitor failed shipments
- Review courier events for patterns
- Update withdrawal requests status
- Sync shipment statuses manually if needed
- Keep API credentials secure and rotated
