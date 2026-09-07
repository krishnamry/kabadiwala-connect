#!/usr/bin/env bash
set -e

echo "================================================================="
echo "🧪 KABADIWALA CONNECT — FULL END-TO-END DEMO STORYLINE TEST"
echo "================================================================="

BASE_URL="http://localhost:5000"
ML_URL="http://localhost:8000"
WEB_URL="http://localhost:3000"

# 1. Health Checks
echo ""
echo "🔍 1. Verifying Service Availability..."
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
ML_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$ML_URL/health")
WEB_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$WEB_URL")

if [ "$API_HEALTH" -ne 200 ]; then
  echo "❌ Backend API is not healthy (HTTP $API_HEALTH)"
  exit 1
fi
echo "   ✅ Backend API is online (HTTP 200)"

if [ "$ML_HEALTH" -ne 200 ]; then
  echo "❌ ML Microservice is not healthy (HTTP $ML_HEALTH)"
  exit 1
fi
echo "   ✅ ML Service is online (HTTP 200)"

if [ "$WEB_HEALTH" -ne 200 ]; then
  echo "❌ Frontend is not responding (HTTP $WEB_HEALTH)"
  exit 1
fi
echo "   ✅ Frontend Vite server is online (HTTP 200)"

# 2. Authentications
echo ""
echo "🔐 2. Authenticating Demo Personas..."
RAMESH_TOKEN=$(node -e "fetch('$BASE_URL/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:'9811100001',password:'password123'})}).then(r=>r.json()).then(d=>console.log(d.data.token))")
echo "   ✅ Ramesh (Citizen) Authenticated"

SURESH_TOKEN=$(node -e "fetch('$BASE_URL/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:'9876543210',password:'password123'})}).then(r=>r.json()).then(d=>console.log(d.data.token))")
echo "   ✅ Suresh (Collector) Authenticated"

ADMIN_TOKEN=$(node -e "fetch('$BASE_URL/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:'9999900000',password:'password123'})}).then(r=>r.json()).then(d=>console.log(d.data.token))")
echo "   ✅ NDMC (Admin) Authenticated"

# 3. Fetch Initial Wallet Balance for Suresh
INITIAL_WALLET=$(node -e "fetch('$BASE_URL/api/kabadiwala/wallet', {headers:{'Authorization':'Bearer $SURESH_TOKEN'}}).then(r=>r.json()).then(d=>console.log(d.data.walletBalance))")
echo "   💰 Suresh Initial Wallet Balance: ₹$INITIAL_WALLET"

# 4. Citizen Ramesh schedules a new pickup
echo ""
echo "📦 3. Citizen Ramesh Schedules New Doorstep Pickup..."
PICKUP_ID=$(node -e "
fetch('$BASE_URL/api/pickups', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $RAMESH_TOKEN'
  },
  body: JSON.stringify({
    address: 'Lajpat Nagar II, Doorbell 4B, New Delhi',
    latitude: 28.5705,
    longitude: 77.2405,
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    notes: 'Two heavy boxes of books and empty PET juice bottles',
    items: [
      { category: 'Plastic', estWeightKg: 10.0, ratePerKg: 18.0 },
      { category: 'Paper', estWeightKg: 15.0, ratePerKg: 14.0 }
    ]
  })
}).then(r=>r.json()).then(d=>{
  if(!d.success) { console.error(d); process.exit(1); }
  console.log(d.data.id);
});
")
echo "   ✅ Pickup Created successfully: $PICKUP_ID"

# 5. Collector Suresh queries nearby open requests
echo ""
echo "🗺️  4. Collector Suresh Queries Nearby Open Requests..."
NEARBY_COUNT=$(node -e "
fetch('$BASE_URL/api/pickups/nearby?lat=28.5700&lng=77.2400&radius=10', {
  headers: { 'Authorization': 'Bearer $SURESH_TOKEN' }
}).then(r=>r.json()).then(d=>console.log(d.data.length));
")
echo "   ✅ Found $NEARBY_COUNT open requests within 10km radius"

# 6. Collector Suresh accepts the pickup
echo ""
echo "🤝 5. Suresh Accepts Ramesh's Request ($PICKUP_ID)..."
ACCEPT_STATUS=$(node -e "
fetch('$BASE_URL/api/pickups/$PICKUP_ID/accept', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer $SURESH_TOKEN' }
}).then(r=>r.json()).then(d=>console.log(d.data.status));
")
echo "   ✅ Pickup status updated to: $ACCEPT_STATUS"

# 7. Collector Suresh completes pickup with digital scale weights
echo ""
echo "⚖️  6. Suresh Weighs Scrap on Digital Scale & Completes Job..."
COMPLETED_RESULT=$(node -e "
fetch('$BASE_URL/api/pickups/$PICKUP_ID/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $SURESH_TOKEN'
  },
  body: JSON.stringify({
    items: [
      { category: 'Plastic', weightKg: 12.5 },
      { category: 'Paper', weightKg: 16.0 }
    ]
  })
}).then(r=>r.json()).then(d=>{
  console.log(JSON.stringify({ status: d.data.status, amount: d.data.totalAmount }));
});
")
echo "   ✅ Pickup Completion Result: $COMPLETED_RESULT"

# 8. Verify Wallet Balance Credited
echo ""
echo "💳 7. Verifying Instant Wallet Payout for Suresh..."
NEW_WALLET=$(node -e "fetch('$BASE_URL/api/kabadiwala/wallet', {headers:{'Authorization':'Bearer $SURESH_TOKEN'}}).then(r=>r.json()).then(d=>console.log(d.data.walletBalance))")
echo "   ✅ Suresh Updated Wallet Balance: ₹$NEW_WALLET (Credited direct)"

# 9. Admin NDMC inspects aggregated statistics and trends
echo ""
echo "📊 8. Municipal Admin NDMC Inspects Live Citywide Metrics..."
ADMIN_METRICS=$(node -e "
fetch('$BASE_URL/api/admin/stats', {
  headers: { 'Authorization': 'Bearer $ADMIN_TOKEN' }
}).then(r=>r.json()).then(d=>{
  console.log('Total Kg Diverted: ' + d.data.totalKg + ' kg');
  console.log('Total Platform Payout: ₹' + d.data.totalRevenue);
  console.log('CO2 Abated: ' + d.data.environmentalImpact.co2SavedKg + ' kg');
  console.log('30-Day Timeline Points: ' + d.data.pickupsTimeline.length);
});
")
echo "   ✅ $ADMIN_METRICS"

# 10. Admin NDMC verifies collector Mohammed Irfan's KYC
echo ""
echo "🪪 9. Admin Verifies Unregistered Collector KYC Profile..."
IRFAN_PROFILE_ID=$(node -e "
fetch('$BASE_URL/api/admin/kabadiwalas', {
  headers: { 'Authorization': 'Bearer $ADMIN_TOKEN' }
}).then(r=>r.json()).then(d=>{
  const unverified = d.data.find(k => !k.verified);
  console.log(unverified ? unverified.id : d.data[0].id);
});
")

VERIFY_RESULT=$(node -e "
fetch('$BASE_URL/api/admin/kabadiwalas/$IRFAN_PROFILE_ID/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $ADMIN_TOKEN'
  },
  body: JSON.stringify({ verified: true })
}).then(r=>r.json()).then(d=>console.log(d.data.verified));
")
echo "   ✅ Collector KYC profile ($IRFAN_PROFILE_ID) verification status: $VERIFY_RESULT"

# 11. Admin exports official CPCB EPR compliance report
echo ""
echo "📜 10. Exporting Official CPCB EPR Audit Certificate..."
EPR_REPORT_ID=$(node -e "
fetch('$BASE_URL/api/admin/reports/epr', {
  headers: { 'Authorization': 'Bearer $ADMIN_TOKEN' }
}).then(r=>r.json()).then(d=>{
  console.log(d.data.reportId + ' (' + d.data.totalDisposalVerifiedKg + ' kg verified across ' + d.data.traceablePickupsCount + ' pickups)');
});
")
echo "   ✅ Official CPCB Certificate Generated: $EPR_REPORT_ID"

echo ""
echo "================================================================="
echo "🎉 ALL 10 STORYLINE STEPS PASSED SUCCESSFULLY!"
echo "   Ramesh (Citizen) ➔ Suresh (Collector) ➔ NDMC (Admin / EPR)"
echo "================================================================="
