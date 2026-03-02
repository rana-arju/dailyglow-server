# 🚀 Steadfast Integration - Deployment Checklist

Use this checklist to ensure everything is properly configured before going live.

## ✅ Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Verify all collections created in MongoDB:
  - [ ] `shipments`
  - [ ] `courier_events`
  - [ ] `courier_balance_snapshots`
  - [ ] `withdrawal_requests`
- [ ] Test database connection

### 2. Environment Configuration
- [ ] Add Steadfast credentials to `.env`:
  - [ ] `STEADFAST_API_KEY`
  - [ ] `STEADFAST_SECRET_KEY`
  - [ ] `STEADFAST_BASE_URL`
  - [ ] `STEADFAST_WEBHOOK_SECRET`
- [ ] Generate strong webhook secret: `openssl rand -hex 32`
- [ ] Verify all environment variables loaded
- [ ] Test API credentials with balance endpoint

### 3. Steadfast Portal Configuration
- [ ] Login to Steadfast portal
- [ ] Navigate to Settings > API
- [ ] Verify API access enabled
- [ ] Copy API Key and Secret Key
- [ ] Navigate to Settings > Webhook
- [ ] Set Callback URL: `https://yourdomain.com/api/courier/webhook`
- [ ] Set Auth Token: `Bearer your-webhook-secret`
- [ ] Enable webhook notifications
- [ ] Save configuration
- [ ] Test webhook with sample payload

### 4. Code Review
- [ ] Review `steadfast.client.ts` for correct base URL
- [ ] Review `courier.service.ts` for business logic
- [ ] Review `courier.controller.ts` for authentication
- [ ] Review `courier.routes.ts` for route protection
- [ ] Review `courierSync.cron.ts` for cron schedule
- [ ] Verify error handling in all files
- [ ] Check TypeScript compilation: `npm run build`

### 5. Security
- [ ] Add admin authentication middleware to routes
- [ ] Implement role-based access control
- [ ] Verify webhook Bearer token validation
- [ ] Enable HTTPS in production
- [ ] Configure CORS properly
- [ ] Add rate limiting to endpoints
- [ ] Sanitize error messages (no sensitive data)
- [ ] Review and update security headers

### 6. Testing
- [ ] Import Postman collection
- [ ] Test all endpoints:
  - [ ] Get review data
  - [ ] Create shipment
  - [ ] Get all shipments
  - [ ] Get shipment by order
  - [ ] Sync shipment status
  - [ ] Assign delivery man
  - [ ] Get balance
  - [ ] Create withdrawal
  - [ ] Get withdrawals
  - [ ] Update withdrawal status
  - [ ] Webhook delivery status
  - [ ] Webhook tracking update
- [ ] Test with real Steadfast account
- [ ] Test webhook with ngrok (local) or production URL
- [ ] Verify database records created correctly
- [ ] Test error scenarios

### 7. Monitoring Setup
- [ ] Set up logging for courier operations
- [ ] Monitor cron job execution
- [ ] Set up alerts for failed shipments
- [ ] Monitor webhook reception
- [ ] Track API response times
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor database performance

### 8. Documentation
- [ ] Review `STEADFAST_SETUP_GUIDE.md`
- [ ] Review `COURIER_API_REFERENCE.md`
- [ ] Review module README
- [ ] Update team documentation
- [ ] Document any custom configurations
- [ ] Create runbook for common issues

### 9. Frontend Integration
- [ ] Implement "Confirm Shipment" button
- [ ] Create shipment review modal
- [ ] Add shipment details view
- [ ] Display tracking information
- [ ] Show delivery status
- [ ] Add balance display
- [ ] Implement withdrawal management UI
- [ ] Test end-to-end workflow

### 10. Production Deployment
- [ ] Build application: `npm run build`
- [ ] Test build locally: `npm start`
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Verify webhook works on staging
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Test production webhook
- [ ] Monitor logs for errors

## 🧪 Testing Scenarios

### Scenario 1: Create Shipment
1. Create a test order
2. Get review data: `GET /api/courier/shipments/review/:orderId`
3. Verify prefilled data is correct
4. Create shipment: `POST /api/courier/shipments`
5. Verify shipment created in Steadfast
6. Verify shipment stored in database
7. Verify order status updated to SHIPPED

### Scenario 2: Webhook Update
1. Create a shipment
2. Send test webhook: `POST /api/courier/webhook`
3. Verify shipment status updated
4. Verify courier event created
5. Verify order status updated if final
6. Send duplicate webhook
7. Verify duplicate ignored

### Scenario 3: Background Sync
1. Create a shipment
2. Wait for cron job (or trigger manually)
3. Verify status synced from Steadfast
4. Verify database updated
5. Check logs for sync activity

### Scenario 4: Balance & Withdrawal
1. Get balance: `GET /api/courier/balance`
2. Verify balance displayed correctly
3. Create withdrawal: `POST /api/courier/withdrawals`
4. Verify withdrawal stored
5. Update status: `PATCH /api/courier/withdrawals/:id/status`
6. Verify status updated

## 🔍 Verification Commands

### Check Database
```javascript
// MongoDB shell
use your_database

// Check shipments
db.shipments.find().sort({ createdAt: -1 }).limit(5)

// Check courier events
db.courier_events.find().sort({ createdAt: -1 }).limit(5)

// Check balance snapshots
db.courier_balance_snapshots.find().sort({ fetchedAt: -1 }).limit(5)

// Check withdrawals
db.withdrawal_requests.find({ status: 'REQUESTED' })
```

### Check Server Logs
```bash
# Look for these messages
grep "Starting courier sync job" logs.txt
grep "Shipment created successfully" logs.txt
grep "Webhook received successfully" logs.txt
grep "Error" logs.txt
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# Get balance
curl http://localhost:5000/api/courier/balance

# Get shipments
curl http://localhost:5000/api/courier/shipments?page=1&limit=10
```

## 🚨 Common Issues & Solutions

### Issue: API credentials invalid
**Solution:** 
- Verify credentials in Steadfast portal
- Check `.env` file has correct values
- Restart server after updating `.env`

### Issue: Webhook not receiving updates
**Solution:**
- Verify webhook URL is publicly accessible
- Check Bearer token matches in both systems
- Test with ngrok for local development
- Check Steadfast portal webhook settings
- Review server logs for incoming requests

### Issue: Cron job not running
**Solution:**
- Verify server is running continuously
- Check console logs for cron messages
- Verify cron schedule syntax
- Check for errors in sync logic
- Test sync manually via API

### Issue: Duplicate shipments
**Solution:**
- Verify invoice uniqueness validation
- Check database constraints
- Review error handling in service
- Check for race conditions

### Issue: Order status not updating
**Solution:**
- Verify webhook is working
- Check status mapping in service
- Review courier event logs
- Test manual sync

## 📊 Performance Optimization

- [ ] Add database indexes for frequently queried fields
- [ ] Implement caching for balance queries
- [ ] Optimize webhook processing
- [ ] Add pagination to all list endpoints
- [ ] Monitor and optimize slow queries
- [ ] Consider Redis for caching
- [ ] Implement request queuing for bulk operations

## 🔒 Security Hardening

- [ ] Rotate API credentials regularly
- [ ] Implement IP whitelisting for webhooks
- [ ] Add request signing for webhooks
- [ ] Implement audit logging
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Implement data encryption at rest
- [ ] Add input sanitization

## 📈 Monitoring Metrics

Track these metrics in production:
- [ ] Shipment creation success rate
- [ ] Webhook reception rate
- [ ] API response times
- [ ] Cron job execution time
- [ ] Failed shipment count
- [ ] Database query performance
- [ ] Error rates by endpoint
- [ ] Balance check frequency

## 🎯 Post-Deployment

### Day 1
- [ ] Monitor all logs closely
- [ ] Verify webhooks working
- [ ] Check cron job execution
- [ ] Test with real orders
- [ ] Monitor error rates

### Week 1
- [ ] Review all shipments created
- [ ] Check webhook event logs
- [ ] Verify balance snapshots
- [ ] Review withdrawal requests
- [ ] Analyze performance metrics

### Month 1
- [ ] Review overall system performance
- [ ] Analyze delivery success rates
- [ ] Optimize based on usage patterns
- [ ] Update documentation if needed
- [ ] Plan enhancements

## ✅ Sign-Off

- [ ] Development team reviewed
- [ ] QA testing completed
- [ ] Security review passed
- [ ] Documentation complete
- [ ] Stakeholders approved
- [ ] Ready for production

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Verified By:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 🆘 Emergency Contacts

**Steadfast Support:**
- Portal: https://portal.packzy.com
- Contact through portal

**Internal Team:**
- Backend Lead: _________________
- DevOps: _________________
- On-Call: _________________

---

**Good luck with your deployment! 🚀**
