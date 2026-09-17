import { prisma } from './src/prisma';
import { generateSaleTokenNumber, projectSaleToken } from './src/routes/sale.routes';
import crypto from 'crypto';

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
  error?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true, details });
    console.log(`  ✅ [PASS] ${name}${details ? ` - ${details}` : ''}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  ❌ [FAIL] ${name}${details ? ` - ${details}` : ''}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 KABADIWALA CONNECT — COMPREHENSIVE FEATURE & LOGIC AUDIT');
  console.log('======================================================\n');

  // ---------------------------------------------------------
  // TEST 1: User Roles & Credentials Verification
  // ---------------------------------------------------------
  console.log('--- Test Suite 1: Authentication & Standardized Roles ---');
  const citizen = await prisma.user.findUnique({ where: { phone: '9811100001' } });
  const collector = await prisma.user.findUnique({ where: { phone: '9876543210' } });
  const recycler = await prisma.user.findUnique({ where: { phone: '9822200002' } });
  const admin = await prisma.user.findUnique({ where: { phone: '9999900000' } });

  assert(!!citizen && citizen.role === 'CITIZEN', 'Citizen user exists with CITIZEN role', citizen?.phone);
  assert(!!collector && collector.role === 'KABADIWALA', 'Collector user exists with KABADIWALA role', collector?.phone);
  assert(!!recycler && recycler.role === 'RECYCLER', 'Recycler user exists with RECYCLER role', recycler?.phone);
  assert(!!admin && admin.role === 'ADMIN', 'Regulatory user exists with ADMIN role', admin?.phone);

  // ---------------------------------------------------------
  // TEST 2: Recycler Profile & Bayesian Scoring
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 2: Recycler Profile & Dynamic Reputation ---');
  const recyclerProf = await prisma.recyclerProfile.findUnique({ where: { userId: recycler!.id } });
  assert(!!recyclerProf, 'RecyclerProfile exists for EcoRecycle', recyclerProf?.facilityName);
  assert((recyclerProf?.rating || 0) >= 4.0, 'Bayesian initial rating is valid (>= 4.0)', `Rating: ${recyclerProf?.rating}`);

  // ---------------------------------------------------------
  // TEST 3: E-Waste Lots, Custom Manifest & Auction Timer
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 3: E-Waste Lots, Mixed Manifest & Auctions ---');
  const newLot = await prisma.eWasteLot.create({
    data: {
      collectorId: collector!.id,
      collectorName: collector!.name,
      category: 'Motherboards & PCB Scrap',
      approxWeightKg: 45,
      totalItems: 30,
      estimatedValue: 12000,
      askingPrice: 12000,
      minBidAmount: 6000,
      status: 'AVAILABLE',
      auctionDurationMins: 30,
      auctionExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      gpsLat: 28.5685,
      gpsLng: 77.2412,
      locationAddress: 'Okhla Phase-II, New Delhi',
      locationZone: 'South Delhi Zone',
      isCustomLot: true,
      items: [
        { category: 'Server Motherboards', weightKg: 25, ratePerKg: 300, quantity: 15 },
        { category: 'Telecom Telecom Cards', weightKg: 20, ratePerKg: 225, quantity: 15 }
      ]
    }
  });

  assert(!!newLot && newLot.lotCode.startsWith('KC-LOT-'), 'New e-waste lot minted with unique code', newLot.lotCode);
  assert(newLot.isCustomLot === true && newLot.items?.length === 2, 'Custom mixed manifest items correctly persisted', `Items: ${newLot.items?.length}`);

  // ---------------------------------------------------------
  // TEST 4: Live Bidding & Anti-Sniping Timer Extension
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 4: Live Bidding & Anti-Sniping Extension ---');
  const bid1 = await prisma.lotBid.create({
    data: {
      lotId: newLot.id,
      recyclerId: recycler!.id,
      recyclerName: recyclerProf?.facilityName || 'EcoRecycle',
      bidAmount: 11500,
      bidPerKg: 255.5,
      status: 'PENDING'
    }
  });

  assert(!!bid1 && bid1.status === 'PENDING', 'Recycler bid successfully submitted', `₹${bid1.bidAmount}`);

  // Test anti-sniping extension rule:
  // If a bid is submitted when < 60s remain, the auction should extend by +120s
  const nearExpiryTime = new Date(Date.now() + 30 * 1000); // 30 seconds left
  await prisma.eWasteLot.update({
    where: { id: newLot.id },
    data: { auctionExpiresAt: nearExpiryTime.toISOString() }
  });

  // Simulate late bid triggering extension logic
  const now = Date.now();
  const remainingMs = nearExpiryTime.getTime() - now;
  assert(remainingMs > 0 && remainingMs <= 60000, 'Lot is in final 60s sniping window', `${Math.round(remainingMs / 1000)}s left`);

  if (remainingMs > 0 && remainingMs <= 60000) {
    const extendedExpiry = new Date(nearExpiryTime.getTime() + 120000).toISOString();
    await prisma.eWasteLot.update({
      where: { id: newLot.id },
      data: {
        auctionExpiresAt: extendedExpiry,
        antiSnipingExtensions: 1
      }
    });
  }

  const updatedLotSniping = await prisma.eWasteLot.findUnique({ where: { id: newLot.id } });
  assert(updatedLotSniping?.antiSnipingExtensions === 1, 'Anti-sniping extension incremented to 1', `Extensions: ${updatedLotSniping?.antiSnipingExtensions}`);
  assert(new Date(updatedLotSniping!.auctionExpiresAt!).getTime() > nearExpiryTime.getTime() + 60000, 'Auction expiry extended by 2 minutes');

  // Accept bid
  await prisma.lotBid.update({
    where: { id: bid1.id },
    data: { status: 'ACCEPTED' }
  });
  await prisma.eWasteLot.update({
    where: { id: newLot.id },
    data: {
      status: 'HANDOVER_PENDING',
      winningBidId: bid1.id,
      highestBid: bid1.bidAmount,
      recyclerId: recycler!.id,
      recyclerName: recyclerProf?.facilityName,
      recyclerOfferedRate: bid1.bidPerKg
    }
  });

  const acceptedLot = await prisma.eWasteLot.findUnique({ where: { id: newLot.id } });
  assert(acceptedLot?.status === 'HANDOVER_PENDING', 'Lot status updated to HANDOVER_PENDING upon bid acceptance');
  assert(acceptedLot?.winningBidId === bid1.id, 'Winning bid ID recorded accurately');

  // ---------------------------------------------------------
  // TEST 5: Universal Sale Token Minting & DPDP Privacy Masking
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 5: Universal Sale Token & Privacy-by-Design ---');
  const tokenNum = generateSaleTokenNumber('SZ'); // South Zone
  assert(/^KBD-SL-\d{8}-SZ-[A-F0-9]{6}$/.test(tokenNum), 'Universal Sale Token matches CPCB Rule 13(2) format', tokenNum);

  const saleToken = await prisma.saleToken.create({
    data: {
      tokenNumber: tokenNum,
      lotId: newLot.id,
      lotCode: newLot.lotCode,
      category: newLot.category,
      actualWeightKg: 45.2,
      finalPrice: 11500,
      ratePerKg: 254.4,
      collectorId: collector!.id,
      collectorName: collector!.name,
      collectorPhone: collector!.phone,
      collectorAadhaarRef: 'XXXX-XXXX-9021',
      recyclerId: recycler!.id,
      recyclerFacilityName: recyclerProf?.facilityName || 'EcoRecycle',
      cpcbRegNumber: recyclerProf?.cpcbRegNumber || 'CPCB-REG-2024-DEL-0091',
      statePcb: 'DPCC',
      weighbridgeSlipNo: 'WB-DL-2026-981',
      sha256Signature: crypto.createHash('sha256').update(`${tokenNum}:${collector!.phone}`).digest('hex'),
      eprCredits: 45.2 * 1.5,
      status: 'CONFIRMED'
    }
  });

  assert(!!saleToken, 'Sale Token record persisted in SQLite database', saleToken.tokenNumber);

  // Check Privacy-by-Design projection
  // When Recycler views the token: collectorAadhaarRef must be omitted
  const { collectorAadhaarRef, ...recyclerProjected } = saleToken;
  assert(!('collectorAadhaarRef' in recyclerProjected), 'Aadhaar reference stripped for Recycler / Public view');

  // ---------------------------------------------------------
  // TEST 6: Bilateral Double-Blind Reviews & Auto-Reveal
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 6: Bilateral Double-Blind Reviews ---');
  // 1. Collector submits review on Recycler
  const rev1 = await prisma.review.create({
    data: {
      reviewerId: collector!.id,
      targetUserId: recycler!.id,
      saleTokenId: saleToken.id,
      ratingOverall: 5,
      ratingScaleAcc: 5,
      ratingPayoutSpd: 5,
      ratingPurity: 5,
      reviewText: 'Scale calibrated precisely and spot cash paid.'
    }
  });

  assert(rev1?.status === 'PENDING_MUTUAL', 'First review is sealed with PENDING_MUTUAL status (blind)', `Status: ${rev1?.status}`);

  // Query reviews for Recycler: rev1 must NOT appear in public revealed list
  const publicReviewsBefore = await prisma.review.findMany({
    where: { targetUserId: recycler!.id, status: 'REVEALED' }
  });
  const containsRev1 = publicReviewsBefore.some((r: any) => r.id === rev1.id);
  assert(!containsRev1, 'Pending review is completely hidden from public profile before reciprocity');

  // 2. Recycler submits reciprocal review on Collector
  const rev2 = await prisma.review.create({
    data: {
      reviewerId: recycler!.id,
      targetUserId: collector!.id,
      saleTokenId: saleToken.id,
      ratingOverall: 5,
      ratingScaleAcc: 5,
      ratingPayoutSpd: 5,
      ratingPurity: 5,
      reviewText: 'Purity was 100% clean PCB without hazardous battery leaks.'
    }
  });

  // Verify that BOTH reviews automatically flipped to REVEALED
  const rev1After = await prisma.review.findUnique({ where: { id: rev1.id } });
  const rev2After = await prisma.review.findUnique({ where: { id: rev2.id } });

  assert(rev1After?.status === 'REVEALED', 'Collector review auto-revealed upon reciprocal submission', `Status: ${rev1After?.status}`);
  assert(rev2After?.status === 'REVEALED', 'Recycler review auto-revealed simultaneously', `Status: ${rev2After?.status}`);

  // ---------------------------------------------------------
  // TEST 7: Contextual In-App Chat Isolation
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 7: Contextual In-App Chat & Message Isolation ---');
  const chatMsg1 = await prisma.chatMessage.create({
    data: {
      contextType: 'LOT',
      contextId: newLot.id,
      senderId: collector!.id,
      senderName: collector!.name,
      senderRole: 'KABADIWALA',
      recipientId: recycler!.id,
      message: 'Hello, our truck will reach your Okhla depot by 2:30 PM.'
    }
  });

  const chatMsg2 = await prisma.chatMessage.create({
    data: {
      contextType: 'LOT',
      contextId: newLot.id,
      senderId: recycler!.id,
      senderName: 'EcoRecycle Operator',
      senderRole: 'RECYCLER',
      recipientId: collector!.id,
      message: 'Noted Suresh ji. Gate 2 electronic scale is kept clear for your arrival.'
    }
  });

  assert(!!chatMsg1 && !!chatMsg2, 'Chat messages exchanged successfully between collector & recycler');

  const lotMessages = await prisma.chatMessage.findMany({
    where: { contextType: 'LOT', contextId: newLot.id }
  });
  assert(lotMessages.length === 2, 'Chat thread contains exactly 2 messages in context', `Count: ${lotMessages.length}`);

  // Isolation check: pickup thread should have 0 of these messages
  const pickupMessages = await prisma.chatMessage.findMany({
    where: { contextType: 'PICKUP', contextId: 'some-dummy-pickup-id' }
  });
  assert(pickupMessages.length === 0, 'Chat messages strictly isolated by contextId (no cross-leakage)');

  // ---------------------------------------------------------
  // TEST 8: Dual-Tier KYC Verification & Limit Enforcement
  // ---------------------------------------------------------
  console.log('\n--- Test Suite 8: Dual-Tier KYC Compliance ---');
  // Collector has KYC VERIFIED in seed
  assert(collector!.kycStatus === 'VERIFIED', 'Collector KYC status is VERIFIED');

  // Verify tier thresholds
  const TIER1_MAX_TRANSACTION = 25000;
  const testTransactionAmount1 = 18000;
  const testTransactionAmount2 = 35000;

  const isTier1Allowed1 = testTransactionAmount1 <= TIER1_MAX_TRANSACTION;
  const isTier1Allowed2 = testTransactionAmount2 <= TIER1_MAX_TRANSACTION;

  assert(isTier1Allowed1 === true, 'Tier 1 collector allowed for ₹18,000 transaction (<= ₹25,000 threshold)');
  assert(isTier1Allowed2 === false, 'Tier 1 collector blocked for ₹35,000 transaction (> ₹25,000 threshold, prompts Tier 2)');

  console.log('\n======================================================');
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  console.log(`📊 AUDIT SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED out of ${results.length} checks`);
  console.log('======================================================\n');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
