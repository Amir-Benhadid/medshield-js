import nlp from 'compromise';
import { SanitizerOptions, LayerProcessor, ProcessedResult, DetectionResult } from "@/types";
import { faker } from "@faker-js/faker";
import type { TokenVault } from "@/utils/tokenVault";

/**
 * NERLayer: Named Entity Recognition Layer.
 * 
 * Uses the 'compromise' library to perform lightweight natural language processing.
 * This layer is crucial for detecting Names (People), Organizations, and 
 * Geographical Locations that do not follow a strict regex pattern.
 */
export class NERLayer implements LayerProcessor {
    /**
     * Processes text to find named entities using NLP.
     * 
     * @param text The input string for entity extraction.
     * @param options Sanitization options determining how entities are handled.
     */
    public process(text: string, options: SanitizerOptions, vault?: TokenVault): ProcessedResult {
        const doc = nlp(text);
        let sanitizedText = text;
        const detections: DetectionResult[] = [];

        // 1. Detect People (Names)
        const people = doc.people().out('array');
        people.forEach((person: string) => {
            this.recordAndReplace(person, 'PERSON', options, vault, (val) => {
                detections.push(val);
                sanitizedText = sanitizedText.replace(person, this.getReplacement(person, 'PERSON', options, vault));
            });
        });

        // 2. Detect Places (Locations)
        const places = doc.places().out('array');
        places.forEach((place: string) => {
            this.recordAndReplace(place, 'LOCATION', options, vault, (val) => {
                detections.push(val);
                sanitizedText = sanitizedText.replace(place, this.getReplacement(place, 'LOCATION', options, vault));
            });
        });

        // 3. Detect Organizations
        const orgs = doc.organizations().out('array');
        orgs.forEach((org: string) => {
            this.recordAndReplace(org, 'ORGANIZATION', options, vault, (val) => {
                detections.push(val);
                sanitizedText = sanitizedText.replace(org, this.getReplacement(org, 'ORGANIZATION', options, vault));
            });
        });

        return { sanitizedText, detections };
    }

    /**
     * Helper to record findings and avoid duplicate logic.
     */
    private recordAndReplace(value: string, label: string, options: SanitizerOptions, vault: TokenVault | undefined, callback: (d: DetectionResult) => void) {
        callback({
            label,
            value,
            startIndex: -1
        });
    }

    /**
     * Determines the replacement string based on entity type and mode.
     */
    private getReplacement(value: string, label: string, options: SanitizerOptions, vault?: TokenVault): string {
        if (options.deterministic && vault) {
            if (options.level === 'SYNTHESIZE') {
                return vault.getConsistentSynthetic(value, label, () => this.generateSyntheticText(label));
            }
            return vault.getDeterministicToken(value, label);
        }

        switch (options.level) {
            case 'REDACT':
                return `[${label}]`;
            case 'MASK':
                return `[HIDDEN_${label}]`;
            case 'SYNTHESIZE':
                return this.generateSyntheticText(label);
            default:
                return value;
        }
    }

    private generateSyntheticText(label: string): string {
        if (label === 'PERSON') return faker.person.fullName();
        if (label === 'LOCATION') return faker.location.city();
        if (label === 'ORGANIZATION') return faker.company.name();
        return `[SYNTHETIC_${label}]`;
    }
}
