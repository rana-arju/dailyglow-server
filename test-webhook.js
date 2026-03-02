/**
 * Test script for Steadfast webhook
 * 
 * Usage:
 * 1. Make sure your server is running
 * 2. Update the WEBHOOK_SECRET below
 * 3. Update the consignment_id to match an existing shipment
 * 4. Run: node test-webhook.js
 */

const WEBHOOK_URL = 'http://localhost:5000/api/v1/webhooks/steadfast';
const WEBHOOK_SECRET = 'your-webhook-secret-here'; // Update this

// Test delivery status update
const deliveryStatusPayload = {
  notification_type: 'delivery_status',
  consignment_id: 12345, // Update with real consignment ID
  invoice: 'ORD-123456',
  cod_amount: 1500.00,
  status: 'delivered',
  delivery_charge: 100.00,
  tracking_message: 'Your package has been delivered successfully.',
  updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
};

// Test tracking update
const trackingUpdatePayload = {
  notification_type: 'tracking_update',
  consignment_id: 12345, // Update with real consignment ID
  invoice: 'ORD-123456',
  tracking_message: 'Package arrived at the sorting center.',
  updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
};

async function testWebhook(payload, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEBHOOK_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', data);
    } else {
      console.log('❌ Error:', response.status, data);
    }
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Steadfast Webhook Tests');
  console.log('Webhook URL:', WEBHOOK_URL);
  
  // Test 1: Delivery Status Update
  await testWebhook(deliveryStatusPayload, 'Delivery Status Update');
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Tracking Update
  await testWebhook(trackingUpdatePayload, 'Tracking Update');
  
  console.log('\n✨ Tests completed!');
}

runTests();
