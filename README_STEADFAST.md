# Steadfast Courier Integration - Quick Start

## 🎯 What This Does

Complete Steadfast (Packzy) courier integration for your MERN backend with real-time tracking, webhook updates, and balance management.

## 📦 Installation

```bash
# 1. Generate Prisma client and migrate database
npx prisma generate
npx prisma db push

# 2. Add environment variables to .env
STEADFAST_API_KEY=your-api-key
STEADFAST_SECRET_KEY=your-secret-key
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_WEBHOOK_SECRET=your-webhook-secret

# 3. Start server
npm run dev
```

## 🔧 Steadfast Portal Setup

1. Login to https://portal.packzy.com
2. Go to **Settings > Webhook**
3. Set **Callback URL**: `https://yourdomain.com/api/courier/webhook`
4. Set **Auth Token**: `Bearer your-webhook-secret`
5. Save

## 🚀 Usage

### Create Shipment
```javascript
POST /api/courier/shipments
{
  "orderId": "order_id",
  "invoice": "INV-001",
  "recipient_name": "John Doe",
  "recipient_phone": "01712345678",
  "recipient_address": "Dhaka",
  "cod_amount": 1500
}
```

### Get Balance
```javascript
GET /api/courier/balance
```

### View Shipments
```javascript
GET /api/courier/shipments?page=1&limit=10
```

## 📚 Documentation

- **Setup Guide**: `STEADFAST_SETUP_GUIDE.md`
- **API Reference**: `COURIER_API_REFERENCE.md`
- **Complete Guide**: `STEADFAST_INTEGRATION_COMPLETE.md`
- **Deployment**: `DEPLOYMENT_CHECKLIST.md`
- **Postman**: `Steadfast_Courier_API.postman_collection.json`

## ✨ Features

✅ Create shipments in Steadfast  
✅ Real-time webhook updates  
✅ Background sync (every 30 min)  
✅ Balance management  
✅ Withdrawal requests  
✅ Delivery man assignment  
✅ Complete error handling  

## 🧪 Testing

Import `Steadfast_Courier_API.postman_collection.json` into Postman and test all endpoints.

## 📞 Support

Check the documentation files for detailed information and troubleshooting.

---

**Ready to ship! 🚚📦**
