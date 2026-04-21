import { LayerProcessor, SanitizerOptions, ProcessedResult, DetectionResult } from '../types';
import { RegexLayer } from '../layers/regexLayer';
import { NERLayer } from '../layers/nerLayers';
import { MedicalLayer } from '../layers/medicalLayer';
import { TokenVault } from '../utils/tokenVault';

/**
 * Synthesizer: The core engine of MedShield-JS.
 */
export class Synthesizer {
    private processors: LayerProcessor[] = [
        new RegexLayer(),
        new NERLayer(),
        new MedicalLayer()
    ];

    private defaultOptions: SanitizerOptions = {
        level: 'MASK'
    };

    /** The cross-layer vault used to enforce deterministic tokens or synthetic data. */
    private vault: TokenVault = new TokenVault();

    /**
     * Resets internal token counters and synthetic memory.
     */
    public resetContext(): void {
        this.vault.reset();
    }

    public synthesize(text: string, options?: SanitizerOptions): ProcessedResult {
        const config = { ...this.defaultOptions, ...options };
        let currentResult: ProcessedResult = { sanitizedText: text, detections: [] };

        return this.processors.reduce((acc, processor) => {
            const layerResult = processor.process(acc.sanitizedText, config, this.vault);
            return {
                sanitizedText: layerResult.sanitizedText,
                detections: [...acc.detections, ...layerResult.detections]
            };
        }, currentResult);
    }
}
