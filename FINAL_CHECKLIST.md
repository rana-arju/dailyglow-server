# ✅ Final Integration Checklist

## Backend Setup

### 1. Database Migration
```bash
cd dailyglowskin-server
npx prisma generate
npx prisma db push
```
- [ ] Prisma client generated
- [ ] Database schema updated
- [ ] New collections created (shipments, courier_events, etc.)

### 2. Environment Variables
Add to `dailyglowskin-server/.env`:
```env
STEADFAST_API_KEY=your-api-key
STEADFAST_SECRET_KEY=your-secret-key
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_WEBHOOK_SECRET=your-webhook-secret
```
- [ ] API credentials added
- [ ] Webhook secret generated
- [ ] Server restarted

### 3. Steadfast Portal
1. Login to https://portal.packzy.com
2. Settings > Webhook
3. Configure:
   - Callback URL: `https://yourdomain.com/api/v1/courier/webhook`
   - Auth Token: `Bearer [your-webhook-secret]`
   - Save

- [ ] Webhook URL configured
- [ ] Auth token set
- [ ] Webhook enabled

## Frontend Setup

### 1. Dependencies
```bash
cd beautycommerce
npm install
```
- [ ] Dependencies installed
- [ ] No errors

### 2. Build Test
```bash
npm run build
```
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No build warnings

### 3. Development Server
```bash
npm run dev
```
- [ ] Server starts on port 3000
- [ ] No console errors

## Testing

### Admin Flow
- [ ] Navigate to `/dashboard/orders`
- [ ] See orders list
- [ ] Find CONFIRMED order
- [ ] Click "শিপমেন্ট নিশ্চিত করুন" button
- [ ] Modal opens with prefilled data
- [ ] No invoice field (uses orderNumber)
- [ ] Submit form
- [ ] Success message appears
- [ ] Order status changes to SHIPPED
- [ ] "View Shipment" button appears

### Customer Flow
- [ ] Navigate to `/track-order`
- [ ] Enter valid orderNumber
- [ ] Enter matching phoneNumber
- [ ] Click "ট্র্যাক করুন"
- [ ] Order details appear
- [ ] Status shown in Bengali
- [ ] statusNote displayed
- [ ] Tracking code visible (if shipped)

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
- [ ] Webhook receives request
- [ ] Returns 200 OK
- [ ] Shipment status updated
- [ ] Order status updated
- [ ] statusNote updated
- [ ] Courier event created

### Steadfast Portal
- [ ] Login to portal
- [ ] Create test consignment
- [ ] Verify appears in system
- [ ] Check tracking code matches
- [ ] Test status updates

## Verification

### Database Checks
```javascript
// Check shipments
db.shipments.find().sort({ createdAt: -1 }).limit(5)

// Check courier events
db.courier_events.find().sort({ createdAt: -1 }).limit(5)

// Check orders with statusNote
db.orders.find({ statusNote: { $exists: true } }).limit(5)
```
- [ ] Shipments created correctly
- [ ] Invoice = orderNumber
- [ ] Courier events logged
- [ ] statusNote populated

### API Checks
```bash
# Get shipment review data
curl http://localhost:5000/api/v1/courier/shipments/review/ORDER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Track order (public)
curl "http://localhost:5000/api/v1/courier/track?orderNumber=ORD-XXX&phoneNumber=01XXXXXXXXX"

# Get balance
curl http://localhost:5000/api/v1/courier/balance \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
- [ ] Review data returns correctly
- [ ] No invoice field in response
- [ ] Tracking works without auth
- [ ] Balance endpoint works

## Production Deployment

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Build successful
- [ ] Environment variables set
- [ ] Webhook URL updated to production
- [ ] Database backed up

### Deployment
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Database migrated
- [ ] Cron job running
- [ ] Webhook accessible
- [ ] SSL certificate valid

### Post-Deployment
- [ ] Test admin flow in production
- [ ] Test customer tracking in production
- [ ] Send test webhook to production
- [ ] Monitor logs for errors
- [ ] Check Steadfast portal integration
- [ ] Verify real orders work

## Documentation

- [ ] `QUICK_START.md` - Read and understood
- [ ] `INTEGRATION_SUMMARY.md` - Reviewed
- [ ] `STEADFAST_INTEGRATION_COMPLETE.md` - Reference available
- [ ] `COURIER_API_REFERENCE.md` - API docs accessible
- [ ] `BUILD_FIXES.md` - Build issues resolved
- [ ] Team trained on new features

## Support

### If Issues Occur

**Shipment creation fails:**
1. Check orderNumber exists
2. Verify API credentials
3. Check phone format (01XXXXXXXXX)
4. Review shipment.providerPayload for errors

**Customer can't track:**
1. Verify orderNumber + phoneNumber match
2. Check order has orderNumber field
3. Test API endpoint directly

**Webhook not working:**
1. Verify URL is publicly accessible
2. Check Bearer token matches
3. Test with curl
4. Review server logs

**Build errors:**
1. Clear node_modules and reinstall
2. Clear Next.js cache: `rm -rf .next`
3. Check TypeScript version
4. Review `BUILD_FIXES.md`

## Sign-Off

- [ ] Backend team approved
- [ ] Frontend team approved
- [ ] QA testing complete
- [ ] Documentation complete
- [ ] Ready for production

---

**Date:** _________________

**Approved By:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
