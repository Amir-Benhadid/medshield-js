import { SanitizerOptions, ProcessedResult, SensitivityLevel } from '@/types';
import { Synthesizer } from '@/utils/synthesizer';

/**
 * The primary entry point for the MedShield-JS library.
 */
export class Sanitizer {
  private engine: Synthesizer;
  private options: SanitizerOptions;

  constructor(options: SanitizerOptions = { level: 'MASK' }) {
    this.options = options;
    this.engine = new Synthesizer();
  }

  /**
   * Sanitizes the input text and returns only the clean string.
   */
  public sanitize(text: string): string {
    const result = this.engine.synthesize(text, this.options);
    return result.sanitizedText;
  }

  /**
   * Performs a full scan of the text and returns structured metadata.
   */
  public scan(text: string): ProcessedResult {
    return this.engine.synthesize(text, this.options);
  }

  /**
   * Resets the deterministic vault for a new session.
   */
  public resetContext(): void {
    this.engine.resetContext();
  }
}

/**
 * Convenient functional export for quick sanitization.
 */
export const sanitize = (text: string, options?: SanitizerOptions): string => {
  const instance = new Sanitizer(options);
  return instance.sanitize(text);
};

// --- Agentic SDK Integrations ---
export { OpenAIMedShieldMiddleware } from '@/integrations/openai';
export { LangChainMedShieldMiddleware } from '@/integrations/langchain';
export { VercelAIMedShieldMiddleware } from '@/integrations/vercel';

