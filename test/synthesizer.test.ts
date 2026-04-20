import { test } from 'node:test';
import assert from 'node:assert';
import { Synthesizer } from '../src/utils/synthesizer';

test('Synthesizer: Multi-Layer Aggregation', () => {
    const engine = new Synthesizer();
    const input = 'Alice Smith (SSN: 111-22-3333) has a Diagnosis of Asthma.';
    const result = engine.synthesize(input, { level: 'MASK' });

    // Should catch NER (Alice Smith), Regex (SSN), and Medical (Diagnosis)
    // Detections should be aggregated from all three layers
    assert.ok(result.detections.some(d => d.label === 'PERSON'));
    assert.ok(result.detections.some(d => d.label === 'SSN'));
    assert.ok(result.detections.some(d => d.label === 'MEDICAL_TERM'));
    
    assert.ok(result.sanitizedText.includes('[HIDDEN_PERSON]'));
    assert.ok(result.sanitizedText.includes('[HIDDEN_SSN]'));
    assert.ok(result.sanitizedText.includes('[MEDICAL_DIAGNOSIS]'));
});

test('Synthesizer: Empty Input', () => {
    const engine = new Synthesizer();
    const result = engine.synthesize('');
    assert.strictEqual(result.sanitizedText, '');
    assert.strictEqual(result.detections.length, 0);
});

test('Synthesizer: Text with no PII', () => {
    const engine = new Synthesizer();
    const input = 'The weather is nice today in the sky.';
    const result = engine.synthesize(input);
    assert.strictEqual(result.sanitizedText, input);
});
