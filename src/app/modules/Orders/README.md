# Order Management API

## Endpoints

### 1. Create Order (Public)
**POST** `/api/v1/orders`

Create a new order from the product landing page form.

**Request Body:**
```json
{
  "fullName": "রহিম আহমেদ",
  "phoneNumber": "01712345678",
  "city": "ঢাকা",
  "thanaUpazila": "মিরপুর",
  "address": "বাড়ি নং ১০, রোড নং ৫, মিরপুর-১০",
  "productName": "The Ordinary Niacinamide 10% + Zinc 1%",
  "productPrice": 650,
  "quantity": 1,
  "discount": 0,
  "deliveryFee": 0
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Order placed successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "রহিম আহমেদ",
    "phoneNumber": "01712345678",
    "city": "ঢাকা",
    "thanaUpazila": "মিরপুর",
    "address": "বাড়ি নং ১০, রোড নং ৫, মিরপুর-১০",
    "productName": "The Ordinary Niacinamide 10% + Zinc 1%",
    "productPrice": 650,
    "quantity": 1,
    "discount": 0,
    "deliveryFee": 0,
    "subtotal": 650,
    "total": 650,
    "status": "PENDING",
    "createdAt": "2026-02-26T10:30:00.000Z",
    "updatedAt": "2026-02-26T10:30:00.000Z"
  }
}
```

### 2. Get All Orders (Admin)
**GET** `/api/v1/orders`

Retrieve all orders with optional filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by order status (PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `/api/v1/orders?status=PENDING&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Orders retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 3. Get Order by ID (Admin)
**GET** `/api/v1/orders/:id`

Retrieve a specific order by ID.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order retrieved successfully",
  "data": {...}
}
```

### 4. Update Order Status (Admin)
**PATCH** `/api/v1/orders/:id/status`

Update the status of an order.

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid Status Values:**
- PENDING
- CONFIRMED
- PROCESSING
- SHIPPED
- DELIVERED
- CANCELLED

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order status updated successfully",
  "data": {...}
}
```

### 5. Delete Order (Admin)
**DELETE** `/api/v1/orders/:id`

Delete an order.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Order deleted successfully",
  "data": {...}
}
```

## Order Calculation Logic

- **Subtotal** = (Product Price × Quantity) - Discount
- **Total** = Subtotal + Delivery Fee
- If delivery is free, `deliveryFee` is stored as `0`
- Discount defaults to `0` if not provided
- Delivery fee defaults to `0` if not provided

## Order Status Flow

1. **PENDING** - Initial status when order is placed
2. **CONFIRMED** - Order confirmed by admin
3. **PROCESSING** - Order is being prepared
4. **SHIPPED** - Order has been shipped
5. **DELIVERED** - Order delivered to customer
6. **CANCELLED** - Order cancelled

## Phone Number Validation

Phone numbers must be in Bangladeshi format:
- 11 digits
- Must start with "01"
- Example: 01712345678
