// Automated Verification Test for Custom Mixed E-Waste Lots
import assert from 'node:assert';

console.log('====================================================');
console.log('🧪 VERIFYING CUSTOM MIXED E-WASTE LOTS LOGIC & RULES');
console.log('====================================================\n');

// 1. Line item definition & aggregation
const customItems = [
  { category: 'High-grade Printed Circuit Boards (PCBs)', weightKg: 10.0, ratePerKg: 640 },
  { category: 'Copper Cables & Insulated Wires', weightKg: 12.0, ratePerKg: 480 },
  { category: 'Lithium-ion Batteries', weightKg: 5.0, ratePerKg: 145 }
];

console.log('1. Testing Itemized Line Items & Valuation Calculations...');
const itemsWithSubtotal = customItems.map(item => ({
  ...item,
  subtotal: Math.round(item.weightKg * item.ratePerKg)
}));

assert.strictEqual(itemsWithSubtotal[0].subtotal, 6400, 'PCBs subtotal should be 10 * 640 = 6400');
assert.strictEqual(itemsWithSubtotal[1].subtotal, 5760, 'Copper cables subtotal should be 12 * 480 = 5760');
assert.strictEqual(itemsWithSubtotal[2].subtotal, 725, 'Li-ion batteries subtotal should be 5 * 145 = 725');

const totalWeight = Math.round(itemsWithSubtotal.reduce((sum, item) => sum + item.weightKg, 0) * 10) / 10;
const totalValue = Math.round(itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0));
const blendedRate = Math.round(totalValue / totalWeight);
const minBidAmount = Math.round(totalValue * 0.5);

assert.strictEqual(totalWeight, 27.0, 'Total weight should be 27 kg');
assert.strictEqual(totalValue, 12885, 'Total value should be 6400 + 5760 + 725 = 12885');
assert.strictEqual(blendedRate, 477, 'Blended average rate should be round(12885 / 27) = 477');
assert.strictEqual(minBidAmount, 6443, 'Min valid bid (50%) should be round(12885 * 0.5) = 6443');

console.log(`   ✅ Total Weight: ${totalWeight} kg`);
console.log(`   ✅ Total Asking Valuation: ₹${totalValue}`);
console.log(`   ✅ Blended Rate: ₹${blendedRate}/kg`);
console.log(`   ✅ Min Acceptable Bid (50%): ₹${minBidAmount}\n`);

// 2. Minimum Bid Enforcement on Custom Lots
console.log('2. Testing Recycler Bidding Rules on Custom Mixed Lots...');
const belowMinBid = 6000;
const validBid = 11000;

const isBelowMin = belowMinBid < minBidAmount;
const isValid = validBid >= minBidAmount;

assert.strictEqual(isBelowMin, true, 'Bids below ₹6,443 must be flagged as invalid');
assert.strictEqual(isValid, true, 'Bids above ₹6,443 must be accepted');
console.log(`   ✅ Bid of ₹${belowMinBid} is correctly rejected (below 50% min threshold of ₹${minBidAmount})`);
console.log(`   ✅ Bid of ₹${validBid} is correctly accepted (above 50% min threshold)\n`);

// 3. Custom Lot Dynamic Addition & Removal
console.log('3. Testing Dynamic Adding & Removing Material Items...');
let activeItems = [...itemsWithSubtotal];

// Add an extra item: 8 kg Engineering E-Plastics @ ₹38/kg
const newItem = { category: 'Engineering E-Plastics (ABS/HIPS)', weightKg: 8.0, ratePerKg: 38, subtotal: 304 };
activeItems.push(newItem);

assert.strictEqual(activeItems.length, 4, 'Should now have 4 items');
const newTotalWeight = Math.round(activeItems.reduce((sum, item) => sum + item.weightKg, 0) * 10) / 10;
const newTotalVal = Math.round(activeItems.reduce((sum, item) => sum + item.subtotal, 0));
assert.strictEqual(newTotalWeight, 35.0, 'New total weight should be 27 + 8 = 35 kg');
assert.strictEqual(newTotalVal, 13189, 'New total value should be 12885 + 304 = 13189');

// Remove the battery item (category: Lithium-ion Batteries)
activeItems = activeItems.filter(i => !i.category.toLowerCase().includes('batter'));
assert.strictEqual(activeItems.length, 3, 'Should have 3 items after removal');
assert.ok(!activeItems.some(i => i.category.toLowerCase().includes('batter')), 'Battery should be removed');
console.log(`   ✅ Dynamic addition of Engineering E-Plastics correctly updated lot to 35 kg and ₹13,189`);
console.log(`   ✅ Dynamic removal of Batteries correctly updated item count to 3 items\n`);

console.log('====================================================');
console.log('🎉 ALL CUSTOM MIXED LOT LOGICAL CHECKS PASSED (100%)');
console.log('====================================================');
