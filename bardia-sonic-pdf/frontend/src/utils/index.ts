/**
 * Utils Index
 * Export all utility modules from a central location
 */

// Import and export speech utilities
import * as speechUtilsImport from './speechUtils';
export const speechUtils = speechUtilsImport;

// Export audio utilities
export { audioUtils } from './audioUtils';

// Re-export types with 'export type'
export type { 
  SpeechOptions, 
  SpeechSynthesisManager 
} from './speechUtils'; 