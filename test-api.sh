#!/bin/bash

# API Test Script for Lab Assistant AI Backend

API_URL="http://localhost:3000"
echo "Testing API at $API_URL"

# Health check
echo -e "\n=== Health Check ==="
curl -s "$API_URL/" | jq '.'

# Create a user
echo -e "\n=== Create User ==="
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.api@example.com",
    "name": "API Test User",
    "role": "RESEARCHER",
    "plan": "FREE"
  }')

echo "$USER_RESPONSE" | jq '.'

# Extract user ID from response
USER_ID=$(echo "$USER_RESPONSE" | jq -r '.data.id // empty')
if [ -z "$USER_ID" ]; then
  echo "Failed to create user or get user ID"
  exit 1
fi

echo "Created user with ID: $USER_ID"

# Get user by ID
echo -e "\n=== Get User by ID ==="
curl -s "$API_URL/api/users/$USER_ID" | jq '.'

# Get user by email
echo -e "\n=== Get User by Email ==="
curl -s "$API_URL/api/users/email/test.api@example.com" | jq '.'

# Update user
echo -e "\n=== Update User ==="
curl -s -X PUT "$API_URL/api/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated API Test User",
    "plan": "PRO"
  }' | jq '.'

# Record user login
echo -e "\n=== Record User Login ==="
curl -s -X POST "$API_URL/api/users/$USER_ID/login" | jq '.'

# List users
echo -e "\n=== List Users ==="
curl -s "$API_URL/api/users?page=1&limit=5" | jq '.'

# Test protocol routes
echo -e "\n=== Test Protocol Routes ==="
curl -s "$API_URL/api/protocols" | jq '.'

# Test experiment routes
echo -e "\n=== Test Experiment Routes ==="
curl -s "$API_URL/api/experiments" | jq '.'

# Delete user (cleanup)
echo -e "\n=== Delete User (Cleanup) ==="
curl -s -X DELETE "$API_URL/api/users/$USER_ID" | jq '.'

echo -e "\n=== API Tests Complete ==="