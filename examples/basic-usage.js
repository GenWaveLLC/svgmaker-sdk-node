// Basic usage example for the SVGMaker SDK
const { SVGMakerClient } = require('svgmaker-sdk');

// Replace with your actual API key
const API_KEY = process.env.SVGMAKER_API_KEY || 'your-api-key';

async function main() {
  try {
    // Create a client instance
    const client = new SVGMakerClient(API_KEY);

    // Generate an SVG
    console.log('Generating SVG...');
    const generateResult = await client.generate
      .withPrompt('A minimalist mountain landscape with sun')
      .withQuality('medium')
      .withStyle('minimalist')
      .withColorMode('monochrome')
      .execute();

    console.log('Generation successful!');
    console.log('SVG URL:', generateResult.svgUrl);
    console.log('Credits used:', generateResult.creditCost);

    // You could also edit or convert images
    // Example for editing (uncomment to use):
    /*
    console.log('Editing image...');
    const editResult = await client.edit
      .withImage('./input.png')
      .withPrompt('Add a red border')
      .withQuality('medium')
      .execute();
    
    console.log('Edit successful!');
    console.log('SVG URL:', editResult.svgUrl);
    */

    // Example for converting (uncomment to use):
    /*
    console.log('Converting image to SVG...');
    const convertResult = await client.convert
      .withFile('./image.jpg')
      .execute();
    
    console.log('Conversion successful!');
    console.log('SVG URL:', convertResult.svgUrl);
    */
  } catch (error) {
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
