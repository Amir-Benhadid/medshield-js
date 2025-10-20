/**
 * Defines the available modes for data sanitization.
 * 
 * - REDACT: Completely removes the sensitive data (e.g., replaces with empty string or generic placeholders).
 * - MASK: Replaces sensitive data with a typed placeholder like [NAME] or [SSN].
 * - SYNTHESIZE: Replaces sensitive data with fake, realistic data to maintain context and formatting.
 */
export type SensitivityLevel = 'REDACT' | 'MASK' | 'SYNTHESIZE';

/**
 * Configuration options for the Sanitizer and its processing layers.
 */
export interface SanitizerOptions {
  /** The mode of sanitization to apply. Defaults to 'MASK'. */
  level?: SensitivityLevel;
  /** Optional custom dictionary of terms to be flagged as sensitive. */
  dictionary?: string[];
  /** If true, assigns consistent IDs (e.g., [PERSON_A]) mapped to the original value across the session. */
  deterministic?: boolean;
  /** If true, medical conditions (e.g., ICD-10) are retained for research/synthetic logic while PHI is masked. */
  preserveMedicalContext?: boolean;
}

/**
 * Represents a single instance of sensitive data found during processing.
 */
export interface DetectionResult {
  /** The type of data found (e.g., 'SSN', 'EMAIL'). */
  label: string;
  /** The actual sensitive value detected. */
  value: string;
  /** The start index of the detection in the original text. */
  startIndex: number;
}

/**
 * The consolidated result returned by a processing layer or the main engine.
 */
export interface ProcessedResult {
  /** The text after sensitive data has been sanitized. */
  sanitizedText: string;
  /** A list of all detections found during processing. */
  detections: DetectionResult[];
}

import type { TokenVault } from './utils/tokenVault';

/**
 * Interface that all processing layers must implement.
 */
export type LayerProcessor = {
  /**
   * Processes the input text and returns sanitized text along with metadata.
   * @param text The raw input text.
   * @param options Sanitization configuration.
   * @param vault For deterministic tracking across layers.
   */
  process(text: string, options: SanitizerOptions, vault?: TokenVault): ProcessedResult;
};

/**
 * Internal pattern definition used by detection layers.
 */
export type PatternDefinition = {
  id: string;
  label: string;
  regex: RegExp;
  contextKeywords?: string[];
};
