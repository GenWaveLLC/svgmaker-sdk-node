// Export the main client
import { SVGMakerClient } from './core/SVGMakerClient';
import { HttpClient } from './utils/httpClient';

// Export client classes
import { GenerateClient } from './clients/GenerateClient';
import { EditClient } from './clients/EditClient';
import { ConvertClient } from './clients/ConvertClient';

// Export error classes
import * as Errors from './errors/CustomErrors';

// Export types
import * as Types from './types/api';
import { SVGMakerConfig } from './types/config';

// Main export
export default SVGMakerClient;

// Named exports
export {
  // Client
  SVGMakerClient,
  GenerateClient,
  EditClient,
  ConvertClient,

  // Utils
  HttpClient,

  // Types
  Types,
  SVGMakerConfig,

  // Errors
  Errors,
};
