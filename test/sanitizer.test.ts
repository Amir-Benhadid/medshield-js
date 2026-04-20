import { test } from 'node:test';
import assert from 'node:assert';
import { Sanitizer } from '../src/index';

/**
 * Integration Tests: End-to-end scenarios for MedShield-JS
 */

test('Integration: Complex Medical Note', () => {
    const sanitizer = new Sanitizer({ level: 'MASK' });
    const note = `
        PATIENT: Jane Doe
        DOB: 05/12/1985
        MRN: 99887766
        LOCATION: Mayo Clinic
        
        The patient Jane Doe was admitted via Emergency for suspected appendicitis. 
        Contact relative at 555-121-4433.
        ICD-10 Code: K35.80.
    `;
    
    const result = sanitizer.scan(note);

    console.log('--- Complex Masking Result ---');
    console.log(result.sanitizedText);

    assert.ok(result.sanitizedText.includes('[HIDDEN_PERSON]'), 'Should hide Jane Doe');
    assert.ok(result.sanitizedText.includes('[HIDDEN_DATE]'), 'Should hide DOB');
    assert.ok(result.sanitizedText.includes('[HIDDEN_MRN]'), 'Should hide MRN');
    assert.ok(
        result.sanitizedText.includes('[HIDDEN_LOCATION]') || 
        result.sanitizedText.includes('[HIDDEN_ORGANIZATION]'),
        'Mayo Clinic should be detected'
    );
    assert.ok(result.sanitizedText.includes('[HIDDEN_PHONE]'), 'Should hide phone');
    assert.ok(result.sanitizedText.includes('[HIDDEN_ICD10]'), 'Should hide ICD-10');
});

test('Integration: Redaction prevents data leakage', () => {
    const sanitizer = new Sanitizer({ level: 'REDACT' });
    const pii = 'My SSN is 000-11-2222 and my credit card is 4111 2222 3333 4444';
    const result = sanitizer.scan(pii);

    assert.ok(!result.sanitizedText.includes('000-11-2222'));
    assert.ok(!result.sanitizedText.includes('4111'));
    assert.ok(result.sanitizedText.includes('[SSN]'));
    assert.ok(result.sanitizedText.includes('[CREDIT_CARD]'));
});

test('Integration: Synthetic data maintains format', () => {
    const sanitizer = new Sanitizer({ level: 'SYNTHESIZE' });
    const input = 'Call me at 416-555-1234';
    const result = sanitizer.scan(input);

    assert.ok(!result.sanitizedText.includes('416-555-1234'));
    // Should still "look" like a phone number (regex match)
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    assert.ok(phoneRegex.test(result.sanitizedText));
});

test('Integration: Custom dictionary override', () => {
    const sanitizer = new Sanitizer({ 
        level: 'MASK',
        dictionary: ['SuperSecretProjectName'] 
    });
    const input = 'He is working on SuperSecretProjectName.';
    const result = sanitizer.scan(input);

    assert.ok(result.sanitizedText.includes('[MEDICAL_SUPERSECRETPROJECTNAME]'));
});
