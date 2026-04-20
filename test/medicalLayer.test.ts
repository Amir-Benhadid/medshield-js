import { test } from 'node:test';
import assert from 'node:assert';
import { MedicalLayer } from '../src/layers/medicalLayer';

test('MedicalLayer: Default Terms', () => {
    const layer = new MedicalLayer();
    const input = 'The diagnosis was confirmed yesterday.';
    const result = layer.process(input, { level: 'MASK' });

    assert.ok(result.sanitizedText.includes('[MEDICAL_DIAGNOSIS]'));
    assert.strictEqual(result.detections[0].label, 'MEDICAL_TERM');
});

test('MedicalLayer: Custom Dictionary', () => {
    const layer = new MedicalLayer();
    const options = { 
        level: 'REDACT' as const, 
        dictionary: ['Xylizine', 'Hyper-Stasis'] 
    };
    const input = 'Patient was prescribed Xylizine for Hyper-Stasis.';
    const result = layer.process(input, options);

    assert.ok(result.sanitizedText.includes('[MEDICAL_XYLIZINE]'));
    assert.ok(result.sanitizedText.includes('[MEDICAL_HYPER-STASIS]'));
});

test('MedicalLayer: Case Insensitivity', () => {
    const layer = new MedicalLayer();
    const input = 'DIAGNOSIS and diagnosis';
    const result = layer.process(input, { level: 'MASK' });

    assert.strictEqual(result.detections.length, 2);
});
