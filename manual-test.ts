#!/usr/bin/env npx ts-node

/**
 * Manual Testing Script for SVGMaker SDK (TypeScript)
 *
 * Usage:
 *   npx ts-node manual-test.ts [test-type] [api-key]
 *
 * Test types:
 *   - generate: Test SVG generation
 *   - edit: Test image editing (requires input image)
 *   - convert: Test image conversion (requires input image)
 *   - all: Run all tests
 *
 * Examples:
 *   npx ts-node manual-test.ts generate your-api-key
 *   SVGMAKER_API_KEY=your-key npx ts-node manual-test.ts all
 */

import { SVGMakerClient } from './src/index';
import * as Types from './src/types/api';
import { writeFileSync, existsSync } from 'fs';

// Get command line arguments
const testType = process.argv[2] || 'generate';
const apiKey = process.argv[3] || process.env.SVGMAKER_API_KEY;

if (!apiKey || apiKey === 'your-api-key') {
  console.error('❌ Error: Please provide a valid API key');
  console.error('Usage: npx ts-node manual-test.ts [test-type] [api-key]');
  console.error('Or set SVGMAKER_API_KEY environment variable');
  process.exit(1);
}

console.log('🧪 SVGMaker SDK Manual Testing (TypeScript)');
console.log('============================================');
console.log(`Test Type: ${testType}`);
console.log(`API Key: ${apiKey.substring(0, 10)}...`);
console.log('');

// Create client with custom configuration for testing
const client = new SVGMakerClient(apiKey, {
  timeout: 60000, // Longer timeout for manual testing
  maxRetries: 2, // Fewer retries for faster feedback
  logging: true, // Enable logging to see what's happening
});

async function testGenerate(): Promise<boolean> {
  console.log('🎨 Testing SVG Generation...');

  try {
    const generateParams: Types.GenerateParams = {
      prompt: 'A simple geometric mountain landscape with sun',
      quality: 'low',
      style: 'minimalist',
      color_mode: 'monochrome',
      aspectRatio: 'landscape',
      background: 'transparent',
    };

    const result = await client.generate.configure(generateParams).execute();

    console.log('✅ Generation successful!');
    console.log(`📄 SVG URL: ${result.svgUrl}`);
    console.log(`💰 Credits used: ${result.creditCost}`);

    // Note: SVG content would need to be fetched from svgUrl
    console.log(`📏 SVG URL available: ${result.svgUrl}`);

    // Save PNG image data if available
    if (result.pngImageData) {
      const filename = `test-generated-ts-${Date.now()}.png`;
      writeFileSync(filename, result.pngImageData);
      console.log(`💾 PNG saved as: ${filename}`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    if (error.statusCode) console.error(`Status: ${error.statusCode}`);
    return false;
  }
}

async function testEdit(): Promise<boolean> {
  console.log('✏️ Testing Image Editing...');

  // Check if we have a test image
  const testImages = ['test-image.png', 'test-image.jpg', 'input.png', 'image.jpg'];
  const availableImage = testImages.find(img => existsSync(img));

  if (!availableImage) {
    console.log('⚠️ No test image found. Creating a simple test image first...');
    console.log('You can manually create any of these files to test editing:');
    testImages.forEach(img => console.log(`  - ${img}`));
    return false;
  }

  try {
    const editParams: Types.EditParams = {
      image: availableImage,
      prompt: 'Add a simple red border around the image',
      quality: 'medium',
    };

    const result = await client.edit.configure(editParams).execute();

    console.log('✅ Edit successful!');
    console.log(`📄 SVG URL: ${result.svgUrl}`);
    console.log(`💰 Credits used: ${result.creditCost}`);

    // Note: SVG content would need to be fetched from svgUrl
    console.log(`📏 SVG URL available: ${result.svgUrl}`);

    if (result.pngImageData) {
      const filename = `test-edited-ts-${Date.now()}.png`;
      writeFileSync(filename, result.pngImageData);
      console.log(`💾 PNG saved as: ${filename}`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Edit failed:', error.message);
    if (error.statusCode) console.error(`Status: ${error.statusCode}`);
    return false;
  }
}

async function testConvert(): Promise<boolean> {
  console.log('🔄 Testing Image Conversion...');

  const testImages = ['test-image.png', 'test-image.jpg', 'input.png', 'image.jpg'];
  const availableImage = testImages.find(img => existsSync(img));

  if (!availableImage) {
    console.log('⚠️ No test image found for conversion.');
    console.log('Create any of these files to test conversion:');
    testImages.forEach(img => console.log(`  - ${img}`));
    return false;
  }

  try {
    const convertParams: Types.ConvertParams = {
      file: availableImage,
    };

    const result = await client.convert.configure(convertParams).execute();

    console.log('✅ Conversion successful!');
    console.log(`📄 SVG URL: ${result.svgUrl}`);
    console.log(`💰 Credits used: ${result.creditCost}`);

    // Note: SVG content would need to be fetched from svgUrl
    console.log(`📏 SVG URL available: ${result.svgUrl}`);

    return true;
  } catch (error: any) {
    console.error('❌ Conversion failed:', error.message);
    if (error.statusCode) console.error(`Status: ${error.statusCode}`);
    return false;
  }
}

async function testErrorHandling(): Promise<void> {
  console.log('🚨 Testing Error Handling...');

  try {
    // Test with invalid API key
    const badClient = new SVGMakerClient('invalid-key');
    await badClient.generate.configure({ prompt: 'test' }).execute();
  } catch (error: any) {
    console.log('✅ Error handling works for invalid API key');
    console.log(`Error type: ${error.name || error.constructor.name}`);
  }

  try {
    // Test with missing prompt
    await client.generate.configure({ prompt: '' }).execute();
  } catch (error: any) {
    console.log('✅ Validation works for empty prompt');
    console.log(`Error type: ${error.name || error.constructor.name}`);
  }
}

async function testConfiguration(): Promise<void> {
  console.log('🔧 Testing Configuration...');

  // Test configuration updates
  client.setConfig({
    timeout: 45000,
    maxRetries: 1,
  });

  const config = client.getConfig();
  console.log(`⚙️ Updated timeout: ${config.timeout}ms`);
  console.log(`🔄 Updated max retries: ${config.maxRetries}`);
  console.log('✅ Configuration update successful');
}

async function runTests(): Promise<void> {
  const results: Record<string, boolean> = {};

  console.log('Starting TypeScript manual tests...\n');

  if (testType === 'generate' || testType === 'all') {
    results.generate = await testGenerate();
    console.log('');
  }

  if (testType === 'edit' || testType === 'all') {
    results.edit = await testEdit();
    console.log('');
  }

  if (testType === 'convert' || testType === 'all') {
    results.convert = await testConvert();
    console.log('');
  }

  if (testType === 'all') {
    await testErrorHandling();
    console.log('');

    await testConfiguration();
    console.log('');
  }

  // Summary
  console.log('📊 Test Summary');
  console.log('================');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });

  const allPassed = Object.values(results).every(result => result);
  console.log(
    `\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`
  );

  console.log('\n✨ TypeScript testing complete!');
}

// Run the tests
runTests().catch((error: any) => {
  console.error('💥 Unexpected error during testing:', error);
  process.exit(1);
});
