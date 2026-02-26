#!/bin/bash

# Test Order API Script
# Make sure the server is running before executing this script

API_URL="http://localhost:5000/api/v1"

echo "🧪 Testing Order API..."
echo ""

# Test 1: Create Order
echo "1️⃣ Creating a new order..."
ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders" \
  -H "Content-Type: application/json" \
  -d '{
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
  }')

echo "$ORDER_RESPONSE" | jq '.'
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id')
echo ""

if [ "$ORDER_ID" != "null" ]; then
  echo "✅ Order created successfully! ID: $ORDER_ID"
  echo ""

  # Test 2: Get Order by ID
  echo "2️⃣ Fetching order by ID..."
  curl -s -X GET "$API_URL/orders/$ORDER_ID" | jq '.'
  echo ""

  # Test 3: Get All Orders
  echo "3️⃣ Fetching all orders..."
  curl -s -X GET "$API_URL/orders?page=1&limit=5" | jq '.'
  echo ""

  # Test 4: Update Order Status
  echo "4️⃣ Updating order status to CONFIRMED..."
  curl -s -X PATCH "$API_URL/orders/$ORDER_ID/status" \
    -H "Content-Type: application/json" \
    -d '{"status": "CONFIRMED"}' | jq '.'
  echo ""

  echo "✅ All tests completed!"
else
  echo "❌ Failed to create order"
fi
