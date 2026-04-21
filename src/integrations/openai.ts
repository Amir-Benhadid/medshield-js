import { SanitizerOptions, ProcessedResult } from '../types';
import { Sanitizer } from '../index';

/**
 * Middleware wrapper for the official OpenAI Node.js SDK.
 * 
 * Intercepts outgoing prompt messages to sanitize PII/PHI before
 * transmission to the cloud. Optionally reinstates data on the response.
 */
export class OpenAIMedShieldMiddleware {
    private sanitizer: Sanitizer;

    constructor(options?: SanitizerOptions) {
        // Enforce determinism so that context holds across chat turns
        const config = { ...options, deterministic: true };
        this.sanitizer = new Sanitizer(config);
    }

    /**
     * Sanitizes an array of OpenAI ChatCompletion messages.
     * @param messages The array of messages to send.
     * @returns A tuple of the sanitized messages and the detection logs for auditing.
     */
    public sanitizeMessages(messages: any[]): { safeMessages: any[], auditLog: ProcessedResult[] } {
        const auditLog: ProcessedResult[] = [];
        const safeMessages = messages.map(msg => {
            if (msg.content && typeof msg.content === 'string') {
                const result = this.sanitizer.scan(msg.content);
                auditLog.push(result);
                return { ...msg, content: result.sanitizedText };
            }
            return msg;
        });

        return { safeMessages, auditLog };
    }

    /**
     * Resets the deterministic vault. Useful when starting a new patient context.
     */
    public resetSession(): void {
        this.sanitizer.resetContext();
    }
}
