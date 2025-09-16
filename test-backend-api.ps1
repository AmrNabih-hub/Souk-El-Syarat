# Souk El-Sayarat Backend API Testing Script
# Run this script to test all backend endpoints

Write-Host "🧪 Testing Souk El-Sayarat Backend API" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

$BASE_URL = "http://localhost:8080/api"

# Function to test endpoints
function Test-Endpoint {
    param($Method, $Endpoint, $Description)
    
    Write-Host "`n📍 Testing: $Description" -ForegroundColor Yellow
    Write-Host "   URL: $BASE_URL$Endpoint" -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Method $Method -ErrorAction Stop
        Write-Host "   ✅ Success" -ForegroundColor Green
        return $response
    }
    catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test Health Check
Write-Host "`n🔍 Testing Health Check..." -ForegroundColor Cyan
$health = Test-Endpoint -Method "GET" -Endpoint "/" -Description "Health Check"

# Test Auth Endpoints
Write-Host "`n🔐 Testing Auth Endpoints..." -ForegroundColor Cyan
$register = Test-Endpoint -Method "POST" -Endpoint "/auth/register" -Description "User Registration"
$login = Test-Endpoint -Method "POST" -Endpoint "/auth/login" -Description "User Login"
$verify = Test-Endpoint -Method "GET" -Endpoint "/auth/verify" -Description "Token Verification"

# Test Vehicle Endpoints
Write-Host "`n🚗 Testing Vehicle Endpoints..." -ForegroundColor Cyan
$vehicles = Test-Endpoint -Method "GET" -Endpoint "/vehicles" -Description "Get All Vehicles"
$vehicle = Test-Endpoint -Method "GET" -Endpoint "/vehicles/sample123" -Description "Get Single Vehicle"

# Test Order Endpoints
Write-Host "`n📋 Testing Order Endpoints..." -ForegroundColor Cyan
$orders = Test-Endpoint -Method "GET" -Endpoint "/orders" -Description "Get All Orders"
$userOrders = Test-Endpoint -Method "GET" -Endpoint "/orders/user/sample123" -Description "Get User Orders"

Write-Host "`n🎉 Testing Complete!" -ForegroundColor Green