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
 *   - stream-generate: Test streaming SVG generation
 *   - stream-edit: Test streaming image editing (requires input image)
 *   - stream-convert: Test streaming image conversion (requires input image)
 *   - streaming: Run all streaming tests
 *   - all: Run all tests (including streaming)
 *
 * Examples:
 *   npx ts-node manual-test.ts generate your-api-key
 *   npx ts-node manual-test.ts streaming your-api-key
 *   SVGMAKER_API_KEY=your-key npx ts-node manual-test.ts all
 */

import { SVGMakerClient } from '../src/index';
import * as Types from '../src/types/api';
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
  baseUrl: process.env.SVGMAKER_BASE_URL || 'https://svgmaker.io/api', // Use local URL
  timeout: process.env.SVGMAKER_TIMEOUT ? parseInt(process.env.SVGMAKER_TIMEOUT, 10) : 300000, // 5 minutes timeout for manual testing
  maxRetries: 2, // Fewer retries for faster feedback
  logging: true, // Enable logging to see what's happening
});

async function testGenerate(): Promise<boolean> {
  console.log('🎨 Testing SVG Generation...');

  try {
    const generateParams: Types.GenerateParams = {
      prompt: 'A simple tower',
      quality: 'low',
      styleParams: {
        style: 'minimalist',
        color_mode: 'monochrome',
      },
      aspectRatio: 'landscape',
      background: 'transparent',
      base64Png: true, // Request base64-encoded PNG preview
      svgText: true, // Request SVG source code as text
    };

    const result = await client.generate.configure(generateParams).execute();

    console.log('✅ Generation successful!');
    console.log(`📄 SVG URL: ${result.svgUrl}`);
    console.log(`💰 Credits used: ${result.creditCost}`);

    // Check if we got the SVG source code
    if (result.svgText) {
      const svgFilename = `tests/test-images/test-generated-ts-${Date.now()}.svg`;
      writeFileSync(svgFilename, result.svgText);
      console.log(`📄 SVG source saved as: ${svgFilename}`);
      console.log(`📏 SVG text preview: ${result.svgText.substring(0, 100)}...`);
    }

    // Save PNG image data if available
    if (result.pngImageData) {
      const filename = `tests/test-images/test-generated-ts-${Date.now()}.png`;
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
  const testImages = [
    'tests/test-images/test-image.png',
    'tests/test-images/test-image.jpg',
    'tests/test-images/input.png',
    'tests/test-images/image.jpg',
  ];
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
      prompt: 'Add a simple blue border around the image',
      styleParams: {
        style: 'cartoon',
        color_mode: 'full-color',
      },
      quality: 'medium',
      base64Png: true, // Request base64-encoded PNG preview
      svgText: true, // Request SVG source code as text
    };

    const result = await client.edit.configure(editParams).execute();

    console.log('✅ Edit successful!');
    console.log(`📄 SVG URL: ${result.svgUrl}`);
    console.log(`💰 Credits used: ${result.creditCost}`);

    // Check if we got the SVG source code
    if (result.svgText) {
      const svgFilename = `tests/test-images/test-edited-ts-${Date.now()}.svg`;
      writeFileSync(svgFilename, result.svgText);
      console.log(`📄 SVG source saved as: ${svgFilename}`);
      console.log(`📏 SVG text preview: ${result.svgText.substring(0, 100)}...`);
    }

    if (result.pngImageData) {
      const filename = `tests/test-images/test-edited-ts-${Date.now()}.png`;
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

  const testImages = [
    'tests/test-images/test-image.png',
    'tests/test-images/test-image.jpg',
    'tests/test-images/input.png',
    'tests/test-images/image.jpg',
  ];
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
      svgText: true, // Request SVG source code as text
    };

    const result = await client.convert.configure(convertParams).execute();

    console.log('✅ Conversion successful!');
    console.log(`📄 SVG URL: ${result.svgUrl}`);
    console.log(`💰 Credits used: ${result.creditCost}`);

    // Check if we got the SVG source code
    if (result.svgText) {
      const svgFilename = `tests/test-images/test-converted-ts-${Date.now()}.svg`;
      writeFileSync(svgFilename, result.svgText);
      console.log(`📄 SVG source saved as: ${svgFilename}`);
      console.log(`📏 SVG text preview: ${result.svgText.substring(0, 100)}...`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Conversion failed:', error.message);
    if (error.statusCode) console.error(`Status: ${error.statusCode}`);
    return false;
  }
}

async function testStreamGenerate(): Promise<boolean> {
  console.log('🌊 Testing Streaming SVG Generation...');

  try {
    const stream = client.generate
      .configure({
        prompt: 'A simple icon of a tree with streaming updates',
        quality: 'low',
        styleParams: {
          style: 'minimalist',
          color_mode: 'monochrome',
        },
        aspectRatio: 'square',
        base64Png: true, // Request base64-encoded PNG preview
        svgText: true, // Request SVG source code as text
      })
      .stream();

    console.log('📡 Streaming started...');
    let eventCount = 0;
    let completedSuccessfully = false;

    return new Promise<boolean>(resolve => {
      // Set a timeout to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        console.log('⏰ Stream timeout after 60 seconds');
        stream.destroy();
        resolve(false);
      }, 60000);

      stream.on('data', event => {
        eventCount++;
        console.log(`📨 Event ${eventCount}: ${event.status}`);

        if (event.status === 'processing') {
          console.log(`⏳ Processing: ${event.message}`);
        } else if (event.status === 'complete') {
          console.log(`✅ Stream completed! SVG URL: ${event.svgUrl}`);
          console.log(`💰 Credits used: ${event.creditCost}`);

          // Save SVG file if available
          if (event.svgText) {
            const svgFilename = `tests/test-images/test-stream-generated-ts-${Date.now()}.svg`;
            writeFileSync(svgFilename, event.svgText);
            console.log(`📄 SVG source saved as: ${svgFilename}`);
            console.log(`📏 SVG text preview: ${event.svgText.substring(0, 100)}...`);
          }

          // Save PNG file if available
          if (event.pngImageData) {
            const pngFilename = `tests/test-images/test-stream-generated-ts-${Date.now()}.png`;
            writeFileSync(pngFilename, event.pngImageData);
            console.log(`💾 PNG saved as: ${pngFilename}`);
          }

          completedSuccessfully = true;
        } else if (event.status === 'error') {
          console.log(`❌ Stream error: ${event.error} (${event.errorType})`);
          completedSuccessfully = false;
        }
      });

      stream.on('end', () => {
        clearTimeout(timeoutId);
        console.log(`🏁 Stream ended after ${eventCount} events`);
        resolve(completedSuccessfully);
      });

      stream.on('error', error => {
        clearTimeout(timeoutId);
        console.error('❌ Stream error:', error.message);
        resolve(false);
      });
    });
  } catch (error: any) {
    console.error('❌ Streaming generation failed:', error.message);
    if (error.statusCode) console.error(`Status: ${error.statusCode}`);
    return false;
  }
}

async function testStreamEdit(): Promise<boolean> {
  console.log('🌊 Testing Streaming Image Editing...');

  // Check if we have a test image
  const testImages = [
    'tests/test-images/test-image.png',
    'tests/test-images/test-image.jpg',
    'tests/test-images/input.png',
    'tests/test-images/image.jpg',
  ];
  const availableImage = testImages.find(img => existsSync(img));

  if (!availableImage) {
    console.log('⚠️ No test image found for streaming edit test.');
    return false;
  }

  try {
    const stream = client.edit
      .configure({
        image: availableImage,
        prompt: 'Add colorful borders with streaming updates',
        styleParams: {
          style: 'cartoon',
          color_mode: 'full-color',
        },
        quality: 'medium',
        base64Png: true, // Request base64-encoded PNG preview
        svgText: true, // Request SVG source code as text
      })
      .stream();

    console.log('📡 Edit streaming started...');
    let eventCount = 0;
    let completedSuccessfully = false;

    return new Promise<boolean>(resolve => {
      // Set a timeout to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        console.log('⏰ Edit stream timeout after 60 seconds');
        stream.destroy();
        resolve(false);
      }, 60000);

      stream.on('data', event => {
        eventCount++;
        console.log(`📨 Edit Event ${eventCount}: ${event.status}`);

        if (event.status === 'processing') {
          console.log(`⏳ Processing edit: ${event.message}`);
        } else if (event.status === 'complete') {
          console.log(`✅ Edit stream completed! SVG URL: ${event.svgUrl}`);
          console.log(`💰 Credits used: ${event.creditCost}`);

          // Save SVG file if available
          if (event.svgText) {
            const svgFilename = `tests/test-images/test-stream-edited-ts-${Date.now()}.svg`;
            writeFileSync(svgFilename, event.svgText);
            console.log(`📄 SVG source saved as: ${svgFilename}`);
            console.log(`📏 SVG text preview: ${event.svgText.substring(0, 100)}...`);
          }

          // Save PNG file if available
          if (event.pngImageData) {
            const pngFilename = `tests/test-images/test-stream-edited-ts-${Date.now()}.png`;
            writeFileSync(pngFilename, event.pngImageData);
            console.log(`💾 PNG saved as: ${pngFilename}`);
          }

          completedSuccessfully = true;
        } else if (event.status === 'error') {
          console.log(`❌ Edit stream error: ${event.error} (${event.errorType})`);
          completedSuccessfully = false;
        }
      });

      stream.on('end', () => {
        clearTimeout(timeoutId);
        console.log(`🏁 Edit stream ended after ${eventCount} events`);
        resolve(completedSuccessfully);
      });

      stream.on('error', error => {
        clearTimeout(timeoutId);
        console.error('❌ Edit stream error:', error.message);
        resolve(false);
      });
    });
  } catch (error: any) {
    console.error('❌ Streaming edit failed:', error.message);
    if (error.statusCode) console.error(`Status: ${error.statusCode}`);
    return false;
  }
}

async function testStreamConvert(): Promise<boolean> {
  console.log('🌊 Testing Streaming Image Conversion...');

  // Check if we have a test image
  const testImages = [
    'tests/test-images/test-image.png',
    'tests/test-images/test-image.jpg',
    'tests/test-images/input.png',
    'tests/test-images/image.jpg',
  ];
  const availableImage = testImages.find(img => existsSync(img));

  if (!availableImage) {
    console.log('⚠️ No test image found for streaming convert test.');
    return false;
  }

  try {
    const stream = client.convert
      .configure({
        file: availableImage,
        svgText: true,
      })
      .stream();

    console.log('📡 Convert streaming started...');
    let eventCount = 0;
    let completedSuccessfully = false;

    return new Promise<boolean>(resolve => {
      // Set a timeout to avoid hanging indefinitely
      const timeoutId = setTimeout(() => {
        console.log('⏰ Convert stream timeout after 60 seconds');
        stream.destroy();
        resolve(false);
      }, 60000);

      stream.on('data', event => {
        eventCount++;
        console.log(`📨 Convert Event ${eventCount}: ${event.status}`);

        if (event.status === 'processing') {
          console.log(`⏳ Processing conversion: ${event.message}`);
        } else if (event.status === 'complete') {
          console.log(`✅ Convert stream completed! SVG URL: ${event.svgUrl}`);
          console.log(`💰 Credits used: ${event.creditCost}`);
          console.log(`🔧 Simulation mode: ${event.simulationMode}`);

          // Save SVG file if available
          if (event.svgText) {
            const svgFilename = `tests/test-images/test-stream-converted-ts-${Date.now()}.svg`;
            writeFileSync(svgFilename, event.svgText);
            console.log(`📄 SVG source saved as: ${svgFilename}`);
            console.log(`📏 SVG text preview: ${event.svgText.substring(0, 100)}...`);
          }

          // Save PNG file if available
          if (event.pngImageData) {
            const pngFilename = `tests/test-images/test-stream-converted-ts-${Date.now()}.png`;
            writeFileSync(pngFilename, event.pngImageData);
            console.log(`💾 PNG saved as: ${pngFilename}`);
          }

          completedSuccessfully = true;
        } else if (event.status === 'error') {
          console.log(`❌ Convert stream error: ${event.error} (${event.errorType})`);
          completedSuccessfully = false;
        }
      });

      stream.on('end', () => {
        clearTimeout(timeoutId);
        console.log(`🏁 Convert stream ended after ${eventCount} events`);
        resolve(completedSuccessfully);
      });

      stream.on('error', error => {
        clearTimeout(timeoutId);
        console.error('❌ Convert stream error:', error.message);
        resolve(false);
      });
    });
  } catch (error: any) {
    console.error('❌ Streaming conversion failed:', error.message);
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

  // Individual streaming tests
  if (testType === 'stream-generate' || testType === 'streaming' || testType === 'all') {
    results['stream-generate'] = await testStreamGenerate();
    console.log('');
  }

  if (testType === 'stream-edit' || testType === 'streaming' || testType === 'all') {
    results['stream-edit'] = await testStreamEdit();
    console.log('');
  }

  if (testType === 'stream-convert' || testType === 'streaming' || testType === 'all') {
    results['stream-convert'] = await testStreamConvert();
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
