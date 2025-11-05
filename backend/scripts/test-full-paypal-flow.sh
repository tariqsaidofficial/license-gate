#!/bin/bash

echo "🔥 PayPal Full Payment Flow Test"
echo "================================"
echo ""

# Check if backend is running
if ! lsof -ti:3000 > /dev/null; then
    echo "❌ Backend is not running on port 3000"
    echo "Please start it with: npm run dev"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Step 1: Create an order
echo "📝 Step 1: Creating PayPal order..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "test-product-123",
    "amount": "29.99",
    "currency": "USD",
    "userEmail": "buyer@example.com"
  }')

echo "Response: $ORDER_RESPONSE"
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)
APPROVAL_URL=$(echo $ORDER_RESPONSE | grep -o '"approvalUrl":"[^"]*"' | sed 's/"approvalUrl":"//;s/"//')

if [ -z "$ORDER_ID" ]; then
    echo "❌ Failed to create order"
    exit 1
fi

echo "✅ Order created: $ORDER_ID"
echo "📱 Approval URL: $APPROVAL_URL"
echo ""

echo "⏸️  MANUAL STEP REQUIRED:"
echo "1. Open this URL in your browser:"
echo "   $APPROVAL_URL"
echo "2. Log in with PayPal sandbox buyer account"
echo "3. Approve the payment"
echo "4. Copy the Order ID from the URL (should be: $ORDER_ID)"
echo ""
echo "Press Enter when you've approved the payment..."
read

# Step 2: Capture payment
echo ""
echo "💰 Step 2: Capturing payment..."
CAPTURE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/payments/paypal/capture \
  -H "Content-Type: application/json" \
  -d "{\"orderId\": \"$ORDER_ID\"}")

echo "Response: $CAPTURE_RESPONSE"
echo ""

# Check if capture was successful
if echo "$CAPTURE_RESPONSE" | grep -q "COMPLETED"; then
    echo "✅ Payment captured successfully!"
else
    echo "❌ Payment capture failed or pending"
fi

echo ""
echo "⏳ Waiting 3 seconds for webhook processing..."
sleep 3

# Step 3: Check webhook events
echo ""
echo "📊 Step 3: Checking webhook events..."
echo "Run this command to check database:"
echo "npm run ts-node scripts/check-webhook-events.ts"
echo ""

# Step 4: Check if license was generated
echo "📄 Step 4: To verify license generation, check:"
echo "- Database table: licenses (should have new entry for buyer@example.com)"
echo "- Email inbox for buyer@example.com"
echo ""

echo "✨ Test complete!"
echo ""
echo "Next steps:"
echo "1. Verify webhook event in database"
echo "2. Verify license was created"
echo "3. Check email was sent"
