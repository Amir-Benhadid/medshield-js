import { SanitizerOptions } from '@/types';
import { Sanitizer } from '@/index';

/**
 * Middleware wrapper for Vercel AI SDK.
 * 
 * Provides utilities to hook into `streamText` and `generateText` flows
 * to automatically strip PHI before the LLM call, and optionally reverse
 * deterministic mapping on the output stream.
 */
export class VercelAIMedShieldMiddleware {
    private sanitizer: Sanitizer;

    constructor(options?: SanitizerOptions) {
        const config = { ...options, deterministic: true };
        this.sanitizer = new Sanitizer(config);
    }

    /**
     * Sanitizes CoreMessages (user prompts, tool results) before passing 
     * them to the AiSDK generateText/streamText methods.
     */
    public sanitizeCoreMessages(messages: any[]): any[] {
        return messages.map(msg => {
            if (msg.role === 'user' || msg.role === 'tool' || msg.role === 'system') {
                if (typeof msg.content === 'string') {
                    return { ...msg, content: this.sanitizer.sanitize(msg.content) };
                }
            }
            return msg;
        });
    }
}
