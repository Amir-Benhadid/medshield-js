import { SanitizerOptions, ProcessedResult } from '../types';
import { Sanitizer } from '../index';

/**
 * Middleware wrapper for LangChain.
 * 
 * In LangChain, agents use Tools to call external APIs or retrieve documents.
 * MedShield LangChainMiddleware can be attached to document loaders or
 * tool outputs to intercept and synthesize data before it enters the prompt.
 */
export class LangChainMedShieldMiddleware {
    private sanitizer: Sanitizer;

    constructor(options?: SanitizerOptions) {
        const config = { ...options, deterministic: true };
        this.sanitizer = new Sanitizer(config);
    }

    /**
     * Intercepts a Document array from a LangChain loader.
     * @param docs Array of LangChain Document objects.
     * @returns Array of sanitized Document objects.
     */
    public sanitizeDocuments(docs: any[]): any[] {
        return docs.map(doc => {
            if (doc.pageContent) {
                const result = this.sanitizer.scan(doc.pageContent);
                return {
                    ...doc,
                    pageContent: result.sanitizedText,
                    metadata: {
                        ...doc.metadata,
                        medShieldDetections: result.detections
                    }
                };
            }
            return doc;
        });
    }

    /**
     * Wraps a LangChain Tool execution to ensure returned data is safe.
     * @param toolFunction The original tool execution logic.
     */
    public wrapTool(toolFunction: (...args: any[]) => Promise<string>) {
        return async (...args: any[]): Promise<string> => {
            const rawOutput = await toolFunction(...args);
            return this.sanitizer.sanitize(rawOutput);
        };
    }
}
