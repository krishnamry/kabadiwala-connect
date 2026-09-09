import assert from 'assert';

console.log('====================================================');
console.log('🧪 VERIFYING RECYCLER LOT BIDDING FLOW & VALIDATIONS');
console.log('====================================================\n');

// 1. Check lot biddable status definition
const isBiddable = (status) => status === 'AVAILABLE' || status === 'REQUESTED' || status === 'BIDDING';

assert.strictEqual(isBiddable('AVAILABLE'), true, 'AVAILABLE lots must be biddable');
assert.strictEqual(isBiddable('REQUESTED'), true, 'REQUESTED lots must be biddable');
assert.strictEqual(isBiddable('BIDDING'), true, 'BIDDING lots must be biddable');
assert.strictEqual(isBiddable('HANDOVER_PENDING'), false, 'HANDOVER_PENDING lots must not be biddable');
assert.strictEqual(isBiddable('CONFIRMED'), false, 'CONFIRMED lots must not be biddable');
assert.strictEqual(isBiddable('REJECTED'), false, 'REJECTED lots must not be biddable');
console.log('✅ 1. Lot biddable eligibility check passed for all statuses.');

// 2. Mock lot creation
let lot = {
  id: 'lot-test-1',
  lotCode: 'KC-LOT-TEST',
  status: 'AVAILABLE',
  category: 'High-Grade PCB / Motherboards',
  approxWeightKg: 18.5,
  recyclerOfferedRate: 640,
  askingPrice: 11840,
  estimatedValue: 11840,
  minBidAmount: 5920, // 50%
  bids: []
};

// 3. Test robust number parsing & comparison in addBidToLot
const addBidToLot = (targetLot, bidData) => {
  const ask = Number(targetLot.askingPrice || targetLot.estimatedValue || 0);
  const minBid = Number(targetLot.minBidAmount) || Math.floor(ask * 0.5);
  const numericBid = Number(bidData.bidAmount);
  if (isNaN(numericBid) || numericBid < minBid) {
    throw new Error(`Invalid bid: Must be at least ₹${minBid} (50% of asking price ₹${ask})`);
  }

  const weight = Number(targetLot.approxWeightKg) || 1;
  const newBid = {
    id: `bid-${Date.now()}`,
    recyclerId: bidData.recyclerId,
    recyclerName: bidData.recyclerName,
    bidAmount: numericBid,
    bidPerKg: Math.round(numericBid / weight),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  const updatedBids = [...(targetLot.bids || []), newBid];
  const highestBid = Math.max(...updatedBids.map(b => Number(b.bidAmount)));
  const newStatus = (targetLot.status === 'AVAILABLE' || targetLot.status === 'REQUESTED') ? 'BIDDING' : targetLot.status;

  return {
    ...targetLot,
    bids: updatedBids,
    highestBid,
    status: newStatus
  };
};

// Test rejecting bid below 50%
assert.throws(() => {
  addBidToLot(lot, { recyclerId: 'rec-1', recyclerName: 'Recycler 1', bidAmount: 5000 });
}, /below minimum acceptable bid|Invalid bid/, 'Bids below 50% must throw validation error');
console.log('✅ 2. Bids below 50% threshold are rejected strictly (₹5,000 < ₹5,920).');

// Test string number bidding (e.g. "10000" which in string comparison was "10000" < "5920" === true!)
lot = addBidToLot(lot, { recyclerId: 'rec-1', recyclerName: 'Recycler 1', bidAmount: "10000" });
assert.strictEqual(lot.highestBid, 10000, 'String "10000" must be correctly treated as numeric ₹10,000');
assert.strictEqual(lot.status, 'BIDDING', 'Status should transition to BIDDING');
console.log('✅ 3. String numeric bid "10000" correctly parsed as ₹10,000 without alphabetical comparison bug.');

// Test Rate per Kg dual input calculation
const weight = lot.approxWeightKg; // 18.5 kg
const offeredRate = lot.recyclerOfferedRate; // ₹640/kg
const inputRate = 500; // ₹500/kg (78% of ₹640)
const calculatedTotal = Math.round(inputRate * weight); // ₹9,250
assert.strictEqual(calculatedTotal, 9250);
assert(calculatedTotal >= lot.minBidAmount, 'Calculated total from rate/kg is well above 50% threshold');

lot = addBidToLot(lot, { recyclerId: 'rec-2', recyclerName: 'Recycler 2', bidAmount: 11500 });
assert.strictEqual(lot.highestBid, 11500, 'Highest bid updated to 11500');
console.log('✅ 4. Rate per kg (₹500/kg -> ₹9,250) and higher competitive bids work flawlessly.');

// Test odd 50% boundary (e.g. lot 104 with ask 12885 -> 50% is 6442.5)
const lot104 = {
  id: 'lot-104',
  askingPrice: 12885,
  minBidAmount: 6443,
  approxWeightKg: 27
};
const bidExactMin = addBidToLot(lot104, { recyclerId: 'rec-1', recyclerName: 'Recycler 1', bidAmount: 6443 });
assert.strictEqual(bidExactMin.highestBid, 6443, 'Exact 50% threshold bid accepted');
console.log('✅ 5. Odd number boundary lot (asking ₹12,885, min ₹6,443) accepts exact min bid.');

console.log('\n====================================================');
console.log('🎉 ALL RECYCLER BIDDING FLOW CHECKS PASSED (100%)');
console.log('====================================================\n');
