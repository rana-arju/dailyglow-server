# Steadfast Courier Integration - Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Admin Dashboard)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Order List   │  │ Shipment     │  │ Balance &    │              │
│  │ + Confirm    │  │ Details      │  │ Withdrawals  │              │
│  │   Button     │  │ + Tracking   │  │              │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
└─────────┼──────────────────┼──────────────────┼──────────────────────┘
          │                  │                  │
          │ HTTP Requests    │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    API Routes Layer                         │    │
│  │  /api/courier/shipments/review/:orderId                     │    │
│  │  /api/courier/shipments (POST)                              │    │
│  │  /api/courier/shipments (GET)                               │    │
│  │  /api/courier/shipments/order/:orderId                      │    │
│  │  /api/courier/balance                                       │    │
│  │  /api/courier/withdrawals                                   │    │
│  │  /api/courier/webhook (POST) ◄─────────────────────┐       │    │
│  └────────────────┬───────────────────────────────────┘       │    │
│                   │                                            │    │
│                   ▼                                            │    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              Controller Layer                               │    │
│  │  - Request validation (Zod)                                │    │
│  │  - Authentication check                                    │    │
│  │  - Call service methods                                    │    │
│  │  - Format responses                                        │    │
│  └────────────────┬───────────────────────────────────────────┘    │
│                   │                                                 │
│                   ▼                                                 │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │               Service Layer                                 │    │
│  │  - Business logic                                          │    │
│  │  - Database operations (Prisma)                            │    │
│  │  - Call Steadfast API client                               │    │
│  │  - Error handling                                          │    │
│  │  - Webhook processing                                      │    │
│  └────────────────┬───────────────────────────────────────────┘    │
│                   │                                                 │
│         ┌─────────┴─────────┐                                      │
│         ▼                   ▼                                      │
│  ┌──────────────┐    ┌──────────────────┐                         │
│  │   Prisma     │    │   Steadfast      │                         │
│  │   Client     │    │   API Client     │                         │
│  │              │    │   (axios)        │                         │
│  └──────┬───────┘    └────────┬─────────┘                         │
│         │                     │                                    │
│         │                     │ HTTPS                              │
│         │                     ▼                                    │
│         │            ┌─────────────────────┐                       │
│         │            │  Steadfast Portal   │                       │
│         │            │  API Endpoints      │                       │
│         │            │  - Create Order     │                       │
│         │            │  - Get Status       │                       │
│         │            │  - Get Balance      │                       │
│         │            └─────────────────────┘                       │
│         │                                                           │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │              Background Cron Job                          │     │
│  │  - Runs every 30 minutes                                 │     │
│  │  - Syncs non-final shipments                             │     │
│  │  - Updates database                                      │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (MongoDB)                              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   orders     │  │  shipments   │  │ courier_     │              │
│  │              │  │              │  │ events       │              │
│  │ - id         │  │ - id         │  │              │              │
│  │ - status     │  │ - orderId    │  │ - shipmentId │              │
│  │ - customer   │  │ - consignId  │  │ - type       │              │
│  │ - total      │  │ - tracking   │  │ - status     │              │
│  └──────────────┘  │ - status     │  │ - payload    │              │
│                    │ - delivery   │  └──────────────┘              │
│  ┌──────────────┐  │   man        │                                │
│  │ courier_     │  └──────────────┘  ┌──────────────┐              │
│  │ balance_     │                    │ withdrawal_  │              │
│  │ snapshots    │                    │ requests     │              │
│  │              │                    │              │              │
│  │ - balance    │                    │ - amount     │              │
│  │ - timestamp  │                    │ - status     │              │
│  └──────────────┘                    └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Create Shipment Flow
```
Admin Dashboard
    │
    ├─► GET /api/courier/shipments/review/:orderId
    │       │
    │       ├─► Fetch Order from DB
    │       └─► Return prefilled data
    │
    ├─► User reviews and edits data
    │
    └─► POST /api/courier/shipments
            │
            ├─► Validate with Zod
            ├─► Check order exists
            ├─► Check no duplicate shipment
            ├─► Call Steadfast API
            │       │
            │       └─► POST /create_order
            │
            ├─► Store shipment in DB
            ├─► Update order status to SHIPPED
            └─► Return shipment data
```

### 2. Webhook Update Flow
```
Steadfast Portal
    │
    └─► POST /api/courier/webhook
            │
            ├─► Verify Bearer token
            ├─► Find shipment by consignment_id
            ├─► Check for duplicate event
            │
            ├─► If delivery_status:
            │       ├─► Update shipment status
            │       ├─► Update delivery charge
            │       ├─► Create courier event
            │       └─► Update order status if final
            │
            └─► If tracking_update:
                    ├─► Update tracking message
                    └─► Create courier event
```

### 3. Background Sync Flow
```
Cron Job (Every 30 min)
    │
    ├─► Find shipments with non-final status
    │
    └─► For each shipment:
            │
            ├─► GET /status_by_cid/{consignmentId}
            ├─► Compare with DB status
            │
            └─► If different:
                    ├─► Update shipment in DB
                    └─► Update order status if final
```

### 4. Balance Check Flow
```
Admin Dashboard
    │
    └─► GET /api/courier/balance
            │
            ├─► Call Steadfast API
            │       │
            │       └─► GET /get_balance
            │
            ├─► Store snapshot in DB
            └─► Return balance
```

## 📊 Database Relationships

```
┌─────────────┐
│   Customer  │
│             │
│ - id        │
│ - name      │
│ - phone     │
└──────┬──────┘
       │ 1:N
       │
┌──────▼──────┐
│    Order    │
│             │
│ - id        │
│ - status    │
│ - total     │
└──────┬──────┘
       │ 1:1
       │
┌──────▼──────────┐
│    Shipment     │
│                 │
│ - id            │
│ - orderId       │
│ - consignmentId │
│ - status        │
│ - tracking      │
└──────┬──────────┘
       │ 1:N
       │
┌──────▼──────────┐
│  CourierEvent   │
│                 │
│ - id            │
│ - shipmentId    │
│ - type          │
│ - status        │
│ - payload       │
└─────────────────┘
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│  1. HTTPS/TLS Encryption                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  2. Admin Authentication Middleware     │
│     - JWT verification                  │
│     - Role-based access control         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  3. Request Validation                  │
│     - Zod schema validation             │
│     - Input sanitization                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  4. Webhook Authentication              │
│     - Bearer token verification         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  5. Database Constraints                │
│     - Unique constraints                │
│     - Foreign key relationships         │
└─────────────────────────────────────────┘
```

## 🎯 Key Components

### 1. Steadfast API Client (`steadfast.client.ts`)
- Axios-based HTTP client
- Configured with API credentials
- Methods for all Steadfast endpoints
- Centralized error handling

### 2. Courier Service (`courier.service.ts`)
- Business logic layer
- Database operations via Prisma
- Calls Steadfast API client
- Webhook processing
- Background sync logic

### 3. Courier Controller (`courier.controller.ts`)
- Request/response handling
- Input validation
- Authentication checks
- Error formatting

### 4. Courier Routes (`courier.routes.ts`)
- Endpoint definitions
- Middleware application
- Route protection

### 5. Cron Job (`courierSync.cron.ts`)
- Scheduled background sync
- Status reconciliation
- Error recovery

## 🔄 State Transitions

### Order Status Flow
```
PENDING
   │
   ├─► CONFIRMED (Admin confirms)
   │
   ├─► SHIPPED (Shipment created)
   │
   ├─► DELIVERED (Webhook: delivered)
   │
   └─► CANCELLED (Webhook: cancelled)
```

### Shipment Status Flow
```
in_review
   │
   ├─► pending
   │
   ├─► hold
   │
   ├─► delivered_approval_pending
   │       │
   │       └─► delivered
   │
   ├─► partial_delivered_approval_pending
   │       │
   │       └─► partial_delivered
   │
   └─► cancelled_approval_pending
           │
           └─► cancelled
```

### Withdrawal Status Flow
```
REQUESTED
   │
   ├─► PROCESSING
   │
   ├─► COMPLETED
   │
   └─► REJECTED
```

## 📈 Scalability Considerations

1. **Database Indexing**
   - Indexed fields: orderId, consignmentId, invoice, trackingCode, deliveryStatus
   - Improves query performance

2. **Caching**
   - Balance snapshots reduce API calls
   - Consider Redis for frequently accessed data

3. **Rate Limiting**
   - 500ms delay in cron job
   - Prevents API rate limit issues

4. **Pagination**
   - All list endpoints support pagination
   - Prevents memory issues with large datasets

5. **Error Recovery**
   - Failed shipments stored with error details
   - Background sync provides fallback
   - Webhook duplicate prevention

## 🔍 Monitoring Points

1. **API Endpoints**
   - Response times
   - Success/error rates
   - Request volumes

2. **Webhooks**
   - Reception rate
   - Processing time
   - Duplicate events

3. **Cron Jobs**
   - Execution time
   - Shipments synced
   - Errors encountered

4. **Database**
   - Query performance
   - Connection pool usage
   - Storage growth

5. **External API**
   - Steadfast API response times
   - Error rates
   - Rate limit status

---

**This architecture provides a robust, scalable, and maintainable courier integration system.**
