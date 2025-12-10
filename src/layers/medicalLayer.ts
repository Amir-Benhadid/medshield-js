import { SanitizerOptions, LayerProcessor, ProcessedResult, DetectionResult } from "@/types";
import type { TokenVault } from "@/utils/tokenVault";

/**
 * MedicalLayer: Identifies healthcare-specific terminology.
 * 
 * This layer uses a combination of built-in dictionaries and user-provided 
 * terminology to detect medical terms that could be used as identifiers 
 * in specific contexts (e.g., rare diseases or specific ICD-10 codes).
 */
export class MedicalLayer implements LayerProcessor {
    /** 
     * Default list of common medical keywords that might trigger PHI concerns 
     * in certain high-privacy clinical documents.
     */
    private defaultMedicalTerms: string[] = [
        'ICD-10', 'Diagnosis', 'Patient', 'Admitted', 'Discharged', 
        'Prognosis', 'Medication', 'Surgery', 'Pathology'
    ];

    /**
     * Scans the text for medical identifiers using dictionary matching.
     * 
     * @param text Original input text.
     * @param options Sanitizer configuration including custom dictionaries.
     */
    public process(text: string, options: SanitizerOptions, vault?: TokenVault): ProcessedResult {
        let sanitizedText = text;
        const detections: DetectionResult[] = [];

        // Combine default terms with user-provided terms
        const searchTerms = [...this.defaultMedicalTerms, ...(options.dictionary || [])];

        searchTerms.forEach(term => {
            // Case-insensitive word boundary search
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            
            sanitizedText = sanitizedText.replace(regex, (matchValue, offset) => {
                detections.push({
                    label: 'MEDICAL_TERM',
                    value: matchValue,
                    startIndex: offset
                });

                if (options.preserveMedicalContext) {
                    return matchValue; // Leave the medical term untouched
                }

                // For medical terms, we often just highlight them or obscure if requested.
                // In REDACT/MASK mode, we wrap them in tags.
                if (options.level === 'REDACT' || options.level === 'MASK') {
                    return `[MEDICAL_${term.toUpperCase()}]`;
                }
                
                // For SYNTHESIZE, medical terms are usually preserved but can be generalized.
                return matchValue; 
            });
        });

        return { sanitizedText, detections };
    }
}
