import { faker } from '@faker-js/faker';

/**
 * TokenVault handles deterministic tokenization and synthetic data consistency.
 * 
 * In advanced applications, it's critical that if "John Doe" appears 5 times,
 * he is replaced with "[PERSON_A]" or the exact same synthetic name ("Alex Johnson")
 * every time. This maintains the context needed for LLMs to reason about data.
 */
export class TokenVault {
    private counters: Record<string, number> = {};
    private tokenMap: Map<string, string> = new Map();
    private syntheticMap: Map<string, string> = new Map();

    /**
     * Resets the vault. Useful for clearing context between discrete conversations.
     */
    public reset(): void {
        this.counters = {};
        this.tokenMap.clear();
        this.syntheticMap.clear();
    }

    /**
     * Gets a deterministic mask for a given value based on its category.
     * @param originalValue The sensitive data to mask (e.g., "Jane Smith").
     * @param category The type category (e.g., "PERSON", "MRN").
     * @returns A deterministic token (e.g., "[PERSON_A]" or "[PERSON_1]").
     */
    public getDeterministicToken(originalValue: string, category: string): string {
        const key = `${category}:${originalValue}`;
        if (this.tokenMap.has(key)) {
            return this.tokenMap.get(key)!;
        }

        if (this.counters[category] === undefined) {
            this.counters[category] = 0;
        }

        // We can use alphabetical (A, B, C) or numeric indexing
        const index = this.counters[category]++;
        // Simple numeric token. A production system might do base26 for letters.
        const token = `[${category}_${index}]`;
        this.tokenMap.set(key, token);

        return token;
    }

    /**
     * Gets a consistent piece of synthetic data for a given original value.
     * @param originalValue The sensitive data.
     * @param category The type category.
     * @param generator A callback that produces a random piece of synthetic data.
     * @returns The newly generated or previously cached synthetic data.
     */
    public getConsistentSynthetic(originalValue: string, category: string, generator: () => string): string {
        const key = `${category}:${originalValue}`;
        if (this.syntheticMap.has(key)) {
            return this.syntheticMap.get(key)!;
        }

        const syntheticValue = generator();
        this.syntheticMap.set(key, syntheticValue);
        return syntheticValue;
    }
}
