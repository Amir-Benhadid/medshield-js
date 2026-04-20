import { test } from 'node:test';
import assert from 'node:assert';
import { NERLayer } from '../src/layers/nerLayers';

test('NERLayer: Name Detection', () => {
    const layer = new NERLayer();
    const input = 'Dr. Alice Smith performed the procedure.';
    const result = layer.process(input, { level: 'MASK' });

    assert.ok(result.sanitizedText.includes('[HIDDEN_PERSON]'));
    assert.strictEqual(result.detections[0].label, 'PERSON');
});

test('NERLayer: Location Detection', () => {
    const layer = new NERLayer();
    const input = 'Visit our clinic in New York City.';
    const result = layer.process(input, { level: 'MASK' });

    assert.ok(result.sanitizedText.includes('[HIDDEN_LOCATION]'));
});

test('NERLayer: Organization Detection', () => {
    const layer = new NERLayer();
    const input = 'Patient works at Google Health.';
    const result = layer.process(input, { level: 'MASK' });

    assert.ok(result.sanitizedText.includes('[HIDDEN_ORGANIZATION]'));
});

test('NERLayer: Synthesis', () => {
    const layer = new NERLayer();
    const input = 'Agent James Bond';
    const result = layer.process(input, { level: 'SYNTHESIZE' });

    assert.notStrictEqual(result.sanitizedText, 'Agent James Bond');
    assert.ok(!result.sanitizedText.includes('James Bond'));
});
