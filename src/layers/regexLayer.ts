import { PII_PATTERNS } from "@/constants/patterns";
import { SanitizerOptions, LayerProcessor, ProcessedResult, DetectionResult } from "@/types";
import { faker } from "@faker-js/faker";
import type { TokenVault } from "@/utils/tokenVault";

/**
 * RegexLayer: The first layer of defense.
 * 
 * Uses a collection of high-confidence regular expressions to detect
 * standardized identifiers. This implementation collects all matches first,
 * resolves overlaps, and then performs a single-pass replacement to maintain
 * index integrity.
 */
export class RegexLayer implements LayerProcessor {
    /**
     * Processes text using a suite of regular expressions.
     */
    public process(text: string, options: SanitizerOptions, vault?: TokenVault): ProcessedResult {
        const detections: DetectionResult[] = [];
        const matches: Array<{ start: number; end: number; pattern: any; value: string }> = [];

        // 1. Collect all potential matches from all patterns
        PII_PATTERNS.forEach((pattern) => {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags || 'g');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    pattern,
                    value: match[0]
                });
                // Fix for empty matches infinite loop
                if (match.index === regex.lastIndex) regex.lastIndex++;
            }
        });

        // 2. Resolve overlaps (Priority: Longer matches first, then earlier matches)
        const sortedMatches = matches.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            return (b.end - b.start) - (a.end - a.start);
        });

        const nonOverlappingMatches: typeof matches = [];
        let lastEnd = -1;

        sortedMatches.forEach((match) => {
            if (match.start >= lastEnd) {
                nonOverlappingMatches.push(match);
                lastEnd = match.end;
            }
        });

        // 3. Process matches into detections and perform replacement
        const finalMatches = nonOverlappingMatches.sort((a, b) => b.start - a.start);
        let sanitizedText = text;

        finalMatches.forEach((match) => {
            const detection: DetectionResult = {
                label: match.pattern.label,
                value: match.value,
                startIndex: match.start
            };
            detections.push(detection);

            let replacement = '';
            
            if (options.preserveMedicalContext && (match.pattern.id === 'icd10' || match.pattern.label === 'MEDICAL_TERM')) {
                replacement = match.value;
            } else if (options.deterministic && vault) {
                if (options.level === 'SYNTHESIZE') {
                    replacement = vault.getConsistentSynthetic(match.value, match.pattern.id, () => this.generateSyntheticData(match.pattern.id));
                } else {
                    replacement = vault.getDeterministicToken(match.value, match.pattern.id.toUpperCase());
                }
            } else {
                switch (options.level) {
                    case 'REDACT':
                        replacement = `[${match.pattern.label}]`;
                        break;
                    case 'MASK':
                        replacement = `[HIDDEN_${match.pattern.id.toUpperCase()}]`;
                        break;
                    case 'SYNTHESIZE':
                        replacement = this.generateSyntheticData(match.pattern.id);
                        break;
                    default:
                        replacement = `[${match.pattern.label}]`;
                }
            }

            sanitizedText = 
                sanitizedText.substring(0, match.start) + 
                replacement + 
                sanitizedText.substring(match.end);
        });

        // Inverse detections since we processed from end to front
        return { 
            sanitizedText, 
            detections: detections.reverse() 
        };
    }

    private generateSyntheticData(patternId: string): string {
        switch (patternId) {
            case 'ssn': return faker.helpers.replaceSymbols('###-##-####');
            case 'email': return faker.internet.email();
            case 'phone': return faker.phone.number();
            case 'credit_card': return faker.finance.creditCardNumber();
            case 'ip_address': return faker.internet.ipv4();
            case 'date': return faker.date.past().toLocaleDateString();
            default: return `[SYNTHETIC_${patternId.toUpperCase()}]`;
        }
    }
}
