import { test } from 'node:test';
import assert from 'node:assert';
import { RegexLayer } from '../src/layers/regexLayer';
import { SanitizerOptions } from '../src/types';

test('RegexLayer: SSN Detection', () => {
    const layer = new RegexLayer();
    const options: SanitizerOptions = { level: 'REDACT' };
    const input = 'My SSN is 111-22-3333.';
    const result = layer.process(input, options);

    assert.strictEqual(result.sanitizedText, 'My SSN is [SSN].');
    assert.strictEqual(result.detections.length, 1);
    assert.strictEqual(result.detections[0].label, 'SSN');
});

test('RegexLayer: Email Detection', () => {
    const layer = new RegexLayer();
    const options: SanitizerOptions = { level: 'MASK' };
    const input = 'Contact support@medshield.com or dev@medshield.io';
    const result = layer.process(input, options);

    assert.ok(result.sanitizedText.includes('[HIDDEN_EMAIL]'));
    assert.strictEqual(result.detections.length, 2);
});

test('RegexLayer: overlapping patterns (Phone vs Other)', () => {
    const layer = new RegexLayer();
    const options: SanitizerOptions = { level: 'REDACT' };
    // This looks like a phone and an MRN if MRN-regex is loose
    const input = 'ID: MRN-123-456-7890'; 
    const result = layer.process(input, options);

    assert.ok(result.detections.length > 0);
    // Ensure no double-replacement corruption like [[LABEL]]
    assert.ok(!result.sanitizedText.includes('[['));
});

test('RegexLayer: Multiple occurrences of same pattern', () => {
    const layer = new RegexLayer();
    const input = 'IP1: 192.168.1.1, IP2: 127.0.0.1';
    const result = layer.process(input, { level: 'MASK' });

    assert.strictEqual(result.detections.length, 2);
    assert.strictEqual(result.sanitizedText, 'IP1: [HIDDEN_IP_ADDRESS], IP2: [HIDDEN_IP_ADDRESS]');
});

test('RegexLayer: SSN Synthetic Data', () => {
    const layer = new RegexLayer();
    const input = 'SSN: 123-45-6789';
    const result = layer.process(input, { level: 'SYNTHESIZE' });

    assert.notStrictEqual(result.sanitizedText, 'SSN: 123-45-6789');
    assert.match(result.sanitizedText, /SSN: \d{3}-\d{2}-\d{4}/);
});
