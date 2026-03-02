# 🚀 Steadfast Integration - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Backend Setup (2 minutes)

```bash
cd dailyglowskin-server

# Generate Prisma client and migrate
npx prisma generate
npx prisma db push

# Add to .env
echo "STEADFAST_API_KEY=your-api-key" >> .env
echo "STEADFAST_SECRET_KEY=your-secret-key" >> .env
echo "STEADFAST_BASE_URL=https://portal.packzy.com/api/v1" >> .env
echo "STEADFAST_WEBHOOK_SECRET=$(openssl rand -hex 32)" >> .env

# Start server
npm run dev
```

### 2. Steadfast Portal Setup (1 minute)

1. Go to https://portal.packzy.com
2. Settings > Webhook
3. Callback URL: `https://yourdomain.com/api/v1/courier/webhook`
4. Auth Token: `Bearer [your-webhook-secret-from-env]`
5. Save

### 3. Frontend Setup (2 minutes)

```bash
cd beautycommerce

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev
```

## ✅ Test It

### Admin Flow
1. Go to `/dashboard/orders`
2. Find a CONFIRMED order
3. Click "শিপমেন্ট নিশ্চিত করুন" (Confirm Shipment)
4. Review data → Click "Confirm & Create Shipment"
5. ✅ Order status changes to SHIPPED

### Customer Flow
1. Go to `/track-order`
2. Enter orderNumber + phoneNumber
3. ✅ See order status and tracking info

### Webhook Test
```bash
curl -X POST http://localhost:5000/api/v1/courier/webhook \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "delivery_status",
    "consignment_id": 12345,
    "invoice": "ORD-20250302-ABC123",
    "cod_amount": 1500,
    "status": "delivered",
    "delivery_charge": 60,
    "tracking_message": "Delivered successfully",
    "updated_at": "2025-03-02 12:00:00"
  }'
```

## 📋 Key Points

### ✅ What's Automatic
- Uses `orderNumber` as invoice (no separate invoice needed)
- Updates `order.statusNote` based on delivery status
- Creates tracking history
- Background sync every 30 minutes

### 🎯 Admin Actions
- Confirm shipment for CONFIRMED orders
- View shipment details for SHIPPED orders
- Check courier balance
- Manual status sync if needed

### 👥 Customer Features
- Track order with orderNumber + phoneNumber
- See status in Bengali
- View tracking history
- Get delivery updates

## 🔗 Important URLs

### Admin
- Orders: `/dashboard/orders`
- Order Details: `/dashboard/orders/[id]`

### Customer
- Track Order: `/track-order`

### API
- Review Data: `GET /api/v1/courier/shipments/review/:orderId`
- Create Shipment: `POST /api/v1/courier/shipments`
- Track Order: `GET /api/v1/courier/track?orderNumber=XXX&phoneNumber=XXX`
- Webhook: `POST /api/v1/courier/webhook`

## 📊 Status Mapping

| Steadfast Status | Order Status | Customer Message |
|-----------------|--------------|------------------|
| in_review | PROCESSING | "Your order is under review..." |
| delivered | DELIVERED | "Your order has been delivered successfully!" |
| cancelled | CANCELLED | "Your order has been cancelled..." |
| hold | PROCESSING | "Your order is currently on hold..." |

## 🐛 Quick Troubleshooting

**Shipment creation fails?**
- Check orderNumber exists
- Verify API credentials in .env
- Check phone format: 01XXXXXXXXX

**Customer can't track?**
- Verify orderNumber + phoneNumber match
- Check order has orderNumber field

**Webhook not working?**
- Verify URL is publicly accessible
- Check Bearer token matches
- Test with curl command above

## 📚 Full Documentation

- Complete Guide: `STEADFAST_INTEGRATION_COMPLETE.md`
- API Reference: `COURIER_API_REFERENCE.md`
- Setup Guide: `STEADFAST_SETUP_GUIDE.md`
- Architecture: `ARCHITECTURE.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`

---

**That's it! You're ready to ship! 🚚📦**
