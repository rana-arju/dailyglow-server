# Courier API Reference

Quick reference for all Steadfast courier integration endpoints.

## Base URL
```
http://localhost:5000/api/courier
```

## Authentication
Most endpoints require admin authentication (add your auth middleware).
Webhook endpoint uses Bearer token authentication.

---

## Endpoints

### 1. Get Shipment Review Data
Get prefilled shipment data from an order for review before creating shipment.

**Endpoint:** `GET /shipments/review/:orderId`

**Response:**
```json
{
  "success": true,
  "message": "Shipment review data retrieved successfully",
  "data": {
    "orderId": "65f1234567890abcdef12345",
    "invoice": "INV-20250302-A1B2C3",
    "recipient_name": "John Doe",
    "recipient_phone": "01712345678",
    "alternative_phone": "",
    "recipient_email": "john@example.com",
    "recipient_address": "House 10, Road 5, Dhanmondi, Dhaka",
    "cod_amount": 1500,
    "note": "",
    "item_description": "Beauty Products",
    "total_lot": 2,
    "delivery_type": 0
  }
}
```

---

### 2. Create Shipment
Create a new shipment in Steadfast and store in database.

**Endpoint:** `POST /shipments`

**Request Body:**
```json
{
  "orderId": "65f1234567890abcdef12345",
  "invoice": "INV-20250302-A1B2C3",
  "recipient_name": "John Doe",
  "recipient_phone": "01712345678",
  "alternative_phone": "01812345678",
  "recipient_email": "john@example.com",
  "recipient_address": "House 10, Road 5, Dhanmondi, Dhaka",
  "cod_amount": 1500,
  "note": "Deliver before 5 PM",
  "item_description": "Beauty Products",
  "total_lot": 2,
  "delivery_type": 0
}
```

**Validation Rules:**
- `orderId`: Required, must exist in orders collection
- `invoice`: Required, must be unique, alphanumeric with hyphens/underscores
- `recipient_name`: Required, max 100 characters
- `recipient_phone`: Required, must be 11 digits starting with 01
- `alternative_phone`: Optional, must be 11 digits if provided
- `recipient_email`: Optional, must be valid email
- `recipient_address`: Required, max 250 characters
- `cod_amount`: Required, must be >= 0
- `delivery_type`: Optional, 0 (home) or 1 (point delivery)

**Response:**
```json
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "id": "65f1234567890abcdef12346",
    "orderId": "65f1234567890abcdef12345",
    "consignmentId": "1424107",
    "trackingCode": "15BAEB8A",
    "invoice": "INV-20250302-A1B2C3",
    "deliveryStatus": "in_review",
    "recipientName": "John Doe",
    "recipientPhone": "01712345678",
    "codAmount": 1500,
    "createdAt": "2025-03-02T10:30:00.000Z",
    "order": { ... }
  }
}
```

---

### 3. Get All Shipments
Get paginated list of all shipments with optional filtering.

**Endpoint:** `GET /shipments`

**Query Parameters:**
- `deliveryStatus` (optional): Filter by status
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /shipments?deliveryStatus=in_review&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Shipments retrieved successfully",
  "data": [
    {
      "id": "65f1234567890abcdef12346",
      "consignmentId": "1424107",
      "trackingCode": "15BAEB8A",
      "deliveryStatus": "in_review",
      "order": { ... }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

### 4. Get Shipment by Order ID
Get detailed shipment information including courier events.

**Endpoint:** `GET /shipments/order/:orderId`

**Response:**
```json
{
  "success": true,
  "message": "Shipment retrieved successfully",
  "data": {
    "id": "65f1234567890abcdef12346",
    "orderId": "65f1234567890abcdef12345",
    "consignmentId": "1424107",
    "trackingCode": "15BAEB8A",
    "deliveryStatus": "delivered",
    "trackingMessage": "Package delivered successfully",
    "deliveryCharge": 60,
    "assignedToName": "Delivery Man Name",
    "assignedToPhone": "01712345678",
    "order": { ... },
    "courierEvents": [
      {
        "id": "65f1234567890abcdef12347",
        "notificationType": "delivery_status",
        "status": "delivered",
        "trackingMessage": "Package delivered successfully",
        "createdAt": "2025-03-02T15:30:00.000Z"
      }
    ]
  }
}
```

---

### 5. Sync Shipment Status
Manually sync shipment status from Steadfast API.

**Endpoint:** `POST /shipments/:shipmentId/sync`

**Response:**
```json
{
  "success": true,
  "message": "Shipment status synced successfully",
  "data": {
    "id": "65f1234567890abcdef12346",
    "deliveryStatus": "delivered",
    "lastUpdatedAt": "2025-03-02T15:30:00.000Z"
  }
}
```

---

### 6. Assign Delivery Man
Assign internal delivery man to a shipment.

**Endpoint:** `POST /shipments/assign-delivery-man`

**Request Body:**
```json
{
  "shipmentId": "65f1234567890abcdef12346",
  "assignedToName": "Delivery Man Name",
  "assignedToPhone": "01712345678",
  "assignedToHub": "Dhanmondi Hub",
  "internalNote": "Handle with care"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Delivery man assigned successfully",
  "data": {
    "id": "65f1234567890abcdef12346",
    "assignedToName": "Delivery Man Name",
    "assignedToPhone": "01712345678",
    "assignedToHub": "Dhanmondi Hub",
    "internalNote": "Handle with care"
  }
}
```

---

### 7. Get Balance
Get current Steadfast account balance.

**Endpoint:** `GET /balance`

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

---

### 8. Create Withdrawal Request
Create a withdrawal request (manual processing).

**Endpoint:** `POST /withdrawals`

**Request Body:**
```json
{
  "amount": 5000,
  "note": "Monthly withdrawal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request created successfully",
  "data": {
    "id": "65f1234567890abcdef12348",
    "amount": 5000,
    "status": "REQUESTED",
    "note": "Monthly withdrawal",
    "createdAt": "2025-03-02T10:30:00.000Z"
  }
}
```

---

### 9. Get Withdrawal Requests
Get all withdrawal requests.

**Endpoint:** `GET /withdrawals`

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal requests retrieved successfully",
  "data": [
    {
      "id": "65f1234567890abcdef12348",
      "amount": 5000,
      "status": "REQUESTED",
      "note": "Monthly withdrawal",
      "createdAt": "2025-03-02T10:30:00.000Z"
    }
  ]
}
```

---

### 10. Update Withdrawal Status
Update withdrawal request status.

**Endpoint:** `PATCH /withdrawals/:id/status`

**Request Body:**
```json
{
  "status": "COMPLETED"
}
```

**Status Options:**
- `PROCESSING`
- `COMPLETED`
- `REJECTED`

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal status updated successfully",
  "data": {
    "id": "65f1234567890abcdef12348",
    "status": "COMPLETED",
    "updatedAt": "2025-03-02T11:00:00.000Z"
  }
}
```

---

### 11. Webhook Endpoint
Receive delivery status and tracking updates from Steadfast.

**Endpoint:** `POST /webhook`

**Headers:**
```
Authorization: Bearer YOUR_WEBHOOK_SECRET
Content-Type: application/json
```

**Delivery Status Payload:**
```json
{
  "notification_type": "delivery_status",
  "consignment_id": 1424107,
  "invoice": "INV-20250302-A1B2C3",
  "cod_amount": 1500.00,
  "status": "delivered",
  "delivery_charge": 60.00,
  "tracking_message": "Package delivered successfully",
  "updated_at": "2025-03-02 15:30:00"
}
```

**Tracking Update Payload:**
```json
{
  "notification_type": "tracking_update",
  "consignment_id": 1424107,
  "invoice": "INV-20250302-A1B2C3",
  "tracking_message": "Package arrived at sorting center",
  "updated_at": "2025-03-02 13:15:00"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Webhook received successfully."
}
```

---

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

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invoice must be unique",
  "errorMessages": [...]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid webhook token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Order not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "errorMessages": [...]
}
```

---

## Testing with cURL

### Create Shipment
```bash
curl -X POST http://localhost:5000/api/courier/shipments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "orderId": "65f1234567890abcdef12345",
    "invoice": "INV-20250302-TEST",
    "recipient_name": "Test User",
    "recipient_phone": "01712345678",
    "recipient_address": "Test Address, Dhaka",
    "cod_amount": 1000
  }'
```

### Get Balance
```bash
curl http://localhost:5000/api/courier/balance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/courier/webhook \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "delivery_status",
    "consignment_id": 12345,
    "invoice": "INV-20250302-TEST",
    "cod_amount": 1000,
    "status": "delivered",
    "delivery_charge": 60,
    "tracking_message": "Delivered",
    "updated_at": "2025-03-02 12:00:00"
  }'
```

---

## Rate Limiting

- Background sync: 500ms delay between API calls
- Webhook: No rate limit (authenticated)
- Admin endpoints: Add rate limiting as needed

---

## Notes

- All timestamps are in ISO 8601 format
- All amounts are in BDT (Bangladeshi Taka)
- Phone numbers must be Bangladeshi format (11 digits, starting with 01)
- Invoice must be unique across all shipments
- One shipment per order (enforced by database constraint)
