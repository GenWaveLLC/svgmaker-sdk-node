// Basic usage example for the SVGMaker SDK (TypeScript version)
import { SVGMakerClient } from '../src/index';

// Replace with your actual API key
const API_KEY = 'your-api-key';

async function main() {
  try {
    // Create a client instance
    const client = new SVGMakerClient(API_KEY);

    // Generate an SVG
    console.log('Generating SVG...');
    const generateResult = await client.generate
      .configure({
        prompt: 'A minimalist mountain landscape with sun',
        quality: 'high',
        style: 'minimalist',
        color_mode: 'monochrome',
      })
      .execute();

    console.log('Generation successful!');
    console.log('SVG URL:', generateResult.svgUrl);
    console.log('Credits used:', generateResult.creditCost);

    // Example for editing (uncomment to use):
    /*
    console.log('Editing image...');
    const editResult = await client.edit
      .configure({
        image: './input.png',
        prompt: 'Add a red border',
        quality: 'medium'
      })
      .execute();
    
    console.log('Edit successful!');
    console.log('SVG URL:', editResult.svgUrl);
    */

    // Example for converting (uncomment to use):
    /*
    console.log('Converting image to SVG...');
    const convertResult = await client.convert
      .configure({
        file: './image.jpg'
      })
      .execute();
    
    console.log('Conversion successful!');
    console.log('SVG URL:', convertResult.svgUrl);
    */

    // Example with streaming response
    console.log('Generating with streaming...');
    const stream = client.generate
      .configure({
        prompt: 'A geometric mountain landscape',
        quality: 'medium',
      })
      .stream();

    // Handle stream events
    for await (const event of stream) {
      if (event.status === 'processing') {
        console.log(`Progress: ${event.message}`);
      } else if (event.status === 'complete') {
        console.log(`Complete! SVG URL: ${event.svgUrl}`);
      } else if (event.status === 'error') {
        console.error(`Error: ${event.error}`);
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);

    // More detailed error handling
    if (error.statusCode) {
      console.error('Status code:', error.statusCode);
    }

    if (error.name === 'ValidationError') {
      console.error('Validation failed. Please check your parameters.');
    } else if (error.name === 'AuthError') {
      console.error('Authentication failed. Please check your API key.');
    } else if (error.name === 'RateLimitError') {
      console.error('Rate limit exceeded. Try again later.');
    }
  }
}

main();
