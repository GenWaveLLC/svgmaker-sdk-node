#!/usr/bin/env npx ts-node

/**
 * Manual Testing Script for SVGMaker SDK (TypeScript)
 *
 * Usage:
 *   npx ts-node tests/manual-test.ts [test-type] [api-key]
 *
 * Test types:
 *   - generate: All generate tests (model, quality, both, storage, stream, styleParams)
 *   - edit: All edit tests (model, quality, both, storage, stream, styleParams)
 *   - convert: All convert tests (basic, stream, storage)
 *   - all: Run everything
 *
 * Examples:
 *   npx ts-node tests/manual-test.ts generate svgmaker-ioYOURKEY
 *   npx ts-node tests/manual-test.ts all svgmaker-ioYOURKEY
 *   SVGMAKER_API_KEY=svgmaker-ioYOURKEY SVGMAKER_BASE_URL=http://localhost:3000/api npx ts-node tests/manual-test.ts all
 */

import { SVGMakerClient } from '../src/index';
import { existsSync } from 'fs';
import { Readable } from 'stream';

// Get command line arguments
const testType = process.argv[2] || 'all';
const apiKey = process.argv[3] || process.env.SVGMAKER_API_KEY;

if (!apiKey || apiKey === 'your-api-key') {
  console.error('Error: Please provide a valid API key');
  console.error('Usage: npx ts-node tests/manual-test.ts [test-type] [api-key]');
  console.error('Or set SVGMAKER_API_KEY environment variable');
  process.exit(1);
}

const baseUrl = process.env.SVGMAKER_BASE_URL || 'http://localhost:3000/api';

console.log('SVGMaker SDK Manual Testing');
console.log('===========================');
console.log(`Test Type: ${testType}`);
console.log(`Base URL: ${baseUrl}`);
console.log(`API Key: ${apiKey.substring(0, 15)}...`);
console.log('');

const client = new SVGMakerClient(apiKey, {
  baseUrl,
  timeout: 300000,
  maxRetries: 0,
  logging: true,
});

function logResult(label: string, result: any) {
  console.log(`  SVG URL: ${result.svgUrl}`);
  console.log(`  Credits: ${result.creditCost}`);
  console.log(`  Message: ${result.message}`);
  if (result.metadata) {
    console.log(`  Request ID: ${result.metadata.requestId}`);
    console.log(`  Credits remaining: ${result.metadata.creditsRemaining}`);
  }
  if (result.svgUrlExpiresIn) console.log(`  URL expires in: ${result.svgUrlExpiresIn}`);
  if (result.generationId) console.log(`  Generation ID: ${result.generationId}`);
}

function consumeStream(label: string, stream: Readable): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const timeoutId = setTimeout(() => {
      console.log(`  TIMEOUT after 120s`);
      stream.destroy();
      resolve(false);
    }, 120000);

    let eventCount = 0;
    let success = false;

    stream.on('data', (event: any) => {
      eventCount++;
      console.log(`  Event ${eventCount}: status=${event.status} ${event.message || ''}`);
      if (event.status === 'complete') {
        console.log(`  SVG URL: ${event.svgUrl}`);
        if (event.creditCost) console.log(`  Credits: ${event.creditCost}`);
        if (event.generationId) console.log(`  Generation ID: ${event.generationId}`);
        if (event.metadata) console.log(`  Request ID: ${event.metadata?.requestId}`);
        success = true;
      } else if (event.status === 'error') {
        console.log(`  Stream error: ${event.error}`);
        success = false;
      }
    });

    stream.on('end', () => {
      clearTimeout(timeoutId);
      console.log(`  Stream ended (${eventCount} events)`);
      resolve(success);
    });

    stream.on('error', (error: any) => {
      clearTimeout(timeoutId);
      console.error(`  Stream error: ${error.message}`);
      resolve(false);
    });
  });
}

function findTestImage(): string | null {
  const paths = [
    'tests/test-images/test-image.png',
    'tests/test-images/test-image.jpg',
    'tests/test-images/input.png',
    'tests/test-images/image.jpg',
  ];
  return paths.find(p => existsSync(p)) || null;
}

// ========== GENERATE TESTS ==========

async function generateWithModel(): Promise<boolean> {
  console.log('\n[Generate] With model (no quality)');
  try {
    const result = await client.generate
      .configure({
        prompt: 'A minimalist mountain landscape',
        model: 'gpt-image-1-mini',
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function generateWithQuality(): Promise<boolean> {
  console.log('\n[Generate] With quality (no model)');
  try {
    const result = await client.generate
      .configure({
        prompt: 'A red sports car',
        quality: 'high',
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function generateWithBothModelAndQuality(): Promise<boolean> {
  console.log('\n[Generate] With BOTH model and quality (should fail validation)');
  try {
    await client.generate
      .configure({
        prompt: 'A cat on a fence',
        quality: 'high',
        model: 'gpt-image-1-mini',
      })
      .execute();
    console.log('  FAIL: Should have thrown validation error');
    return false;
  } catch (error: any) {
    console.log(`  PASS (caught expected error): ${error.message}`);
    return true;
  }
}

async function generateWithStorageFalse(): Promise<boolean> {
  console.log('\n[Generate] With storage: false');
  try {
    const result = await client.generate
      .configure({
        prompt: 'A simple house icon',
        quality: 'low',
        storage: false,
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function generateWithStorageTrue(): Promise<boolean> {
  console.log('\n[Generate] With storage: true');
  try {
    const result = await client.generate
      .configure({
        prompt: 'A golden trophy',
        quality: 'medium',
        storage: true,
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function generateWithStream(): Promise<boolean> {
  console.log('\n[Generate] With stream');
  try {
    const stream = client.generate
      .configure({
        prompt: 'A rocket launching into space',
        quality: 'low',
      })
      .stream();
    const ok = await consumeStream('', stream);
    console.log(ok ? '  PASS' : '  FAIL');
    return ok;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function generateWithStyleParams(): Promise<boolean> {
  console.log('\n[Generate] With styleParams + aspectRatio + background');
  try {
    const result = await client.generate
      .configure({
        prompt: 'A forest with tall trees and a river',
        quality: 'low',
        aspectRatio: 'landscape',
        background: 'transparent',
        styleParams: {
          style: 'flat',
          color_mode: 'few_colors',
          image_complexity: 'scene',
          composition: 'full_scene',
          text: 'only_title',
        },
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

// ========== EDIT TESTS ==========

async function editWithModel(): Promise<boolean> {
  console.log('\n[Edit] With model (no quality)');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.edit
      .configure({
        image: img,
        prompt: 'Add a golden frame around this image',
        model: 'gpt-image-1-mini',
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function editWithQuality(): Promise<boolean> {
  console.log('\n[Edit] With quality (no model)');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.edit
      .configure({
        image: img,
        prompt: 'Make the background blue',
        quality: 'low',
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function editWithBothModelAndQuality(): Promise<boolean> {
  console.log('\n[Edit] With BOTH model and quality (should fail validation)');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    await client.edit
      .configure({
        image: img,
        prompt: 'Add stars to the sky',
        quality: 'high',
        model: 'gpt-image-1-mini',
      })
      .execute();
    console.log('  FAIL: Should have thrown validation error');
    return false;
  } catch (error: any) {
    console.log(`  PASS (caught expected error): ${error.message}`);
    return true;
  }
}

async function editWithStorageFalse(): Promise<boolean> {
  console.log('\n[Edit] With storage: false');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.edit
      .configure({
        image: img,
        prompt: 'Convert to silhouette style',
        quality: 'low',
        storage: false,
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function editWithStorageTrue(): Promise<boolean> {
  console.log('\n[Edit] With storage: true');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.edit
      .configure({
        image: img,
        prompt: 'Add a sunset gradient',
        quality: 'low',
        storage: true,
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function editWithStream(): Promise<boolean> {
  console.log('\n[Edit] With stream');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const stream = client.edit
      .configure({
        image: img,
        prompt: 'Make it look like a cartoon',
        quality: 'low',
      })
      .stream();
    const ok = await consumeStream('', stream);
    console.log(ok ? '  PASS' : '  FAIL');
    return ok;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function editWithStyleParams(): Promise<boolean> {
  console.log('\n[Edit] With styleParams + aspectRatio + background');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.edit
      .configure({
        image: img,
        prompt: 'Restyle this image',
        quality: 'low',
        aspectRatio: 'square',
        background: 'opaque',
        styleParams: {
          style: 'isometric',
          color_mode: 'monochrome',
          composition: 'centered_object',
        },
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

// ========== CONVERT TESTS ==========

async function convertBasic(): Promise<boolean> {
  console.log('\n[Convert] Without stream');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.convert.aiVectorize
      .configure({
        file: img,
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function convertWithStream(): Promise<boolean> {
  console.log('\n[Convert] With stream');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const stream = client.convert.aiVectorize
      .configure({
        file: img,
      })
      .stream();
    const ok = await consumeStream('', stream);
    console.log(ok ? '  PASS' : '  FAIL');
    return ok;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

async function convertWithStorage(): Promise<boolean> {
  console.log('\n[Convert] With storage: true');
  const img = findTestImage();
  if (!img) {
    console.log('  SKIP: No test image found');
    return false;
  }
  try {
    const result = await client.convert.aiVectorize
      .configure({
        file: img,
        storage: true,
      })
      .execute();
    console.log('  PASS');
    logResult('', result);
    return true;
  } catch (error: any) {
    console.log(`  FAIL: ${error.message}`);
    return false;
  }
}

// ========== RUNNER ==========

async function runTests(): Promise<void> {
  const results: Record<string, boolean> = {};

  if (testType === 'generate' || testType === 'all') {
    results['generate-model'] = await generateWithModel();
    results['generate-quality'] = await generateWithQuality();
    results['generate-both-error'] = await generateWithBothModelAndQuality();
    results['generate-storage-false'] = await generateWithStorageFalse();
    results['generate-storage-true'] = await generateWithStorageTrue();
    results['generate-stream'] = await generateWithStream();
    results['generate-styleparams'] = await generateWithStyleParams();
  }

  if (testType === 'edit' || testType === 'all') {
    results['edit-model'] = await editWithModel();
    results['edit-quality'] = await editWithQuality();
    results['edit-both-error'] = await editWithBothModelAndQuality();
    results['edit-storage-false'] = await editWithStorageFalse();
    results['edit-storage-true'] = await editWithStorageTrue();
    results['edit-stream'] = await editWithStream();
    results['edit-styleparams'] = await editWithStyleParams();
  }

  if (testType === 'convert' || testType === 'all') {
    results['convert-basic'] = await convertBasic();
    results['convert-stream'] = await convertWithStream();
    results['convert-storage'] = await convertWithStorage();
  }

  // Summary
  console.log('\n\nTest Summary');
  console.log('============');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`  ${passed ? 'PASS' : 'FAIL'} ${test}`);
  });

  const passed = Object.values(results).filter(r => r).length;
  const total = Object.values(results).length;
  console.log(`\n${passed}/${total} passed`);
}

runTests().catch((error: any) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
