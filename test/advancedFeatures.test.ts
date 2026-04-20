import { test } from 'node:test';
import assert from 'node:assert';
import { TokenVault } from '../src/utils/tokenVault';
import { Sanitizer } from '../src/index';

test('TokenVault: Deterministic IDs', () => {
    const vault = new TokenVault();
    
    // First time seeing these names
    const id1 = vault.getDeterministicToken('John Doe', 'PERSON');
    const id2 = vault.getDeterministicToken('Jane Smith', 'PERSON');
    
    assert.strictEqual(id1, '[PERSON_0]');
    assert.strictEqual(id2, '[PERSON_1]');
    
    // Seen "John Doe" again, should get same ID
    const id3 = vault.getDeterministicToken('John Doe', 'PERSON');
    assert.strictEqual(id3, '[PERSON_0]');
});

test('TokenVault: Synthetic Consistency', () => {
    const vault = new TokenVault();
    let generateCount = 0;
    
    const generator = () => {
        generateCount++;
        return `FakeData ${generateCount}`;
    };

    const synth1 = vault.getConsistentSynthetic('111-22-3333', 'SSN', generator);
    assert.strictEqual(synth1, 'FakeData 1');

    // Getting the same SSN again should NOT trigger the generator, but return cached data
    const synth2 = vault.getConsistentSynthetic('111-22-3333', 'SSN', generator);
    assert.strictEqual(synth2, 'FakeData 1');
    assert.strictEqual(generateCount, 1);
});

test('Sanitizer: preserveMedicalContext Integration', () => {
    const sanitizer = new Sanitizer({ 
        level: 'SYNTHESIZE', 
        preserveMedicalContext: true 
    });
    
    const input = 'Alice Smith was diagnosed with ICD-10 J45.901.';
    const result = sanitizer.scan(input);

    // Person should be synthesized (fake name, not original)
    assert.ok(!result.sanitizedText.includes('Alice Smith'));
    assert.ok(!result.sanitizedText.includes('[HIDDEN_PERSON]')); 
    
    // Medical term should be untouched
    assert.ok(result.sanitizedText.includes('ICD-10 J45.901.'));
    
    // Ensure both were detected
    assert.ok(result.detections.length >= 2);
});

test('Sanitizer: Session Resetting', () => {
    const sanitizer = new Sanitizer({ level: 'MASK', deterministic: true });
    
    // Session 1
    const res1 = sanitizer.sanitize('Patient Alex');
    assert.ok(res1.includes('[PERSON_0]'), 'First pass should be PERSON_0');
    
    // Reset
    sanitizer.resetContext();
    
    // Session 2
    const res2 = sanitizer.sanitize('Patient Bob');
    // Bob should get PERSON_0 because vault was cleared
    assert.ok(res2.includes('[PERSON_0]'), 'Reset should make Bob PERSON_0');
});
