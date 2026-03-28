#!/bin/bash
# Build and test script for Cloudflare Workers Backend

set -e

echo "🔨 Building backend..."
npm run build

echo ""
echo "📦 Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 3

echo ""
echo "🧪 Running tests..."

# Function to make API calls
api_call() {
  local method=$1
  local endpoint=$2
  local data=$3
  local headers=$4

  curl -s -X "$method" "http://localhost:8787/api$endpoint" \
    -H "Content-Type: application/json" \
    $headers \
    ${data:+-d "$data"}
}

# Test 1: Health check
echo ""
echo "Test 1: Health check"
api_call GET "/health"

# Test 2: Signup
echo ""
echo "Test 2: Signup"
SIGNUP_RESPONSE=$(api_call POST "/auth/signup" \
  '{"email":"admin@test.local","password":"password123","name":"Admin","companyName":"Test Co"}')

echo "Signup response: $SIGNUP_RESPONSE"

# Extract token (adjust based on actual response structure)
TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token from signup"
  kill $DEV_PID
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:50}..."

# Test 3: Login
echo ""
echo "Test 3: Login"
api_call POST "/auth/login" \
  '{"email":"admin@test.local","password":"password123"}'

# Test 4: Get current user
echo ""
echo "Test 4: Get current user"
api_call GET "/auth/me" "" "-H \"Authorization: Bearer $TOKEN\""

# Test 5: List users
echo ""
echo "Test 5: List users"
api_call GET "/users" "" "-H \"Authorization: Bearer $TOKEN\""

# Test 6: Create user
echo ""
echo "Test 6: Create user"
api_call POST "/users" \
  '{"email":"agent@test.local","password":"pass123","name":"Agent","profile":"agent","companyId":1}' \
  "-H \"Authorization: Bearer $TOKEN\""

# Test 7: Update user
echo ""
echo "Test 7: Update user"
api_call PUT "/users/2" \
  '{"name":"Updated Agent"}' \
  "-H \"Authorization: Bearer $TOKEN\""

# Test 8: Get user
echo ""
echo "Test 8: Get user by ID"
api_call GET "/users/2" "" "-H \"Authorization: Bearer $TOKEN\""

# Cleanup
echo ""
echo "✅ All tests completed!"
kill $DEV_PID
