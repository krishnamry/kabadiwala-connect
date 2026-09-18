const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/api/.env') });

const { detectScrapWithGemini } = require('../apps/api/dist/services/geminiDetector');

const TEST_SAMPLES = [
  {
    filename: 'sample_pcb_motherboard.jpg',
    expectedCategory: 'High-grade Printed Circuit Boards (PCBs)',
    description: 'Real Computer Motherboard (PCBs)'
  },
  {
    filename: 'sample_circuits_chips.jpg',
    expectedCategory: 'High-grade Printed Circuit Boards (PCBs)',
    description: 'High-density IC Circuit Board'
  },
  {
    filename: 'sample_battery_cells.jpg',
    expectedCategory: 'Lithium-ion Batteries',
    description: 'Cylindrical Li-Ion Battery Cells'
  },
  {
    filename: 'sample_cables_wires.jpg',
    expectedCategory: 'Copper Cables & Insulated Wires',
    description: 'Bundled Copper Cables & Wires'
  },
  {
    filename: 'sample_desktop_monitor.jpg',
    expectedCategory: 'LCD/LED Display Panels',
    description: 'Flat Computer Display Screen'
  },
  {
    filename: 'sample_electric_motor.jpg',
    expectedCategory: 'Electric Motors & Compressors',
    description: 'Copper-wound Electric Motor Stator'
  },
  {
    filename: 'sample_crt_tv_unit.jpg',
    expectedCategory: 'CRT Monitor Glass Unit',
    description: 'CRT Picture Tube Vacuum Glass'
  },
  {
    filename: 'sample_aluminum_heatsink.jpg',
    expectedCategory: 'Metal',
    description: 'Aluminum Extruded Heatsink'
  }
];

async function runMultiSampleTest() {
  console.log('\n========================================================================================');
  console.log('       KABADIWALA CONNECT — GEMINI MULTIMODAL VISION E-WASTE SCANNER AUDIT');
  console.log('========================================================================================\n');

  const results = [];
  let passedCount = 0;

  for (let i = 0; i < TEST_SAMPLES.length; i++) {
    const sample = TEST_SAMPLES[i];
    const filePath = path.join(__dirname, '..', 'test_samples', sample.filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: Sample file ${sample.filename} not found at ${filePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = 'image/jpeg';

    console.log(`[${i + 1}/${TEST_SAMPLES.length}] Testing "${sample.description}" (${sample.filename})...`);
    const startTime = Date.now();

    try {
      const result = await detectScrapWithGemini(fileBuffer, mimeType, sample.filename);
      const latencyMs = Date.now() - startTime;

      if (!result) {
        console.error(`  ❌ FAILED: Gemini returned null for ${sample.filename}`);
        results.push({
          sample: sample.description,
          status: 'FAIL',
          expected: sample.expectedCategory,
          actual: 'None (Failed)',
          detectedItem: 'N/A',
          rate: 0,
          confidence: 0,
          latencyMs: `${latencyMs}ms`
        });
        continue;
      }

      const isCategoryMatch =
        result.category.toLowerCase().includes(sample.expectedCategory.toLowerCase()) ||
        sample.expectedCategory.toLowerCase().includes(result.category.toLowerCase());

      const passed = isCategoryMatch && result.confidence >= 0.85 && result.estRate > 0;
      if (passed) passedCount++;

      console.log(`  ${passed ? '✅ PASSED' : '⚠️ MISMATCH'}:`);
      console.log(`     - Detected Item: "${result.detectedItem}"`);
      console.log(`     - Category:      "${result.category}" (Expected: "${sample.expectedCategory}")`);
      console.log(`     - Confidence:    ${Math.round(result.confidence * 100)}%`);
      console.log(`     - Est. Rate:     ₹${result.estRate}/kg`);
      console.log(`     - Safe Advice:   "${result.advice.slice(0, 85)}..."`);
      console.log(`     - Latency:       ${latencyMs}ms\n`);

      results.push({
        sample: sample.description,
        status: passed ? 'PASS' : 'WARN',
        expected: sample.expectedCategory,
        actual: result.category,
        detectedItem: result.detectedItem,
        rate: `₹${result.estRate}/kg`,
        confidence: `${Math.round(result.confidence * 100)}%`,
        latencyMs: `${latencyMs}ms`
      });
    } catch (err) {
      console.error(`  ❌ EXCEPTION for ${sample.filename}:`, err.message);
      results.push({
        sample: sample.description,
        status: 'ERROR',
        expected: sample.expectedCategory,
        actual: err.message,
        detectedItem: 'N/A',
        rate: 0,
        confidence: 0,
        latencyMs: `${Date.now() - startTime}ms`
      });
    }
  }

  console.log('\n========================================================================================');
  console.log('                                  SUMMARY TEST RESULTS');
  console.log('========================================================================================');
  console.table(results);
  console.log(`Total Samples Tested: ${TEST_SAMPLES.length}`);
  console.log(`Passed:               ${passedCount} / ${TEST_SAMPLES.length} (${Math.round((passedCount / TEST_SAMPLES.length) * 100)}% Accuracy)`);
  console.log('========================================================================================\n');

  if (passedCount < TEST_SAMPLES.length - 1) {
    process.exit(1);
  }
}

runMultiSampleTest();
