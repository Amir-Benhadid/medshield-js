import { test } from 'node:test';
import assert from 'node:assert';
import { 
    OpenAIMedShieldMiddleware, 
    LangChainMedShieldMiddleware, 
    VercelAIMedShieldMiddleware 
} from '../src/index';

test('Integration: OpenAI Middleware', () => {
    const middleware = new OpenAIMedShieldMiddleware({ level: 'MASK' });
    
    // Simulate OpenAI ChatCompletion messages
    const rawMessages = [
        { role: 'system', content: 'You are a helpful medical assistant.' },
        { role: 'user', content: 'Patient John Doe came in. Contact him at 555-123-4567.' }
    ];

    const result = middleware.sanitizeMessages(rawMessages);

    // Verify system message is untouched
    assert.strictEqual(result.safeMessages[0].content, 'You are a helpful medical assistant.');
    
    // Verify user message is cleansed and deterministic
    const userMessage = result.safeMessages[1].content;
    assert.ok(userMessage.includes('[PERSON_0]'), 'John Doe should be PERSON_0');
    assert.ok(userMessage.includes('[PHONE_0]'), 'Phone should be hidden determinstically');
    
    // Verify audit log has the records
    assert.strictEqual(result.auditLog.length, 2); // 2 messages processed
    assert.ok(result.auditLog[1].detections.length >= 2, 'Should detect person and phone');
});

test('Integration: LangChain Middleware', () => {
    const middleware = new LangChainMedShieldMiddleware({ level: 'REDACT' });
    
    // Simulate LangChain Documents
    const docs = [
        { pageContent: 'Chart for Jane Smith. SSN: 999-88-7777.', metadata: { source: 'EMR' } }
    ];

    const safeDocs = middleware.sanitizeDocuments(docs);
    
    assert.ok(!safeDocs[0].pageContent.includes('Jane Smith'));
    assert.ok(safeDocs[0].pageContent.includes('[PERSON_0]')); // Deterministic ID instead of generic REDACT
    assert.ok(!safeDocs[0].pageContent.includes('999-88-7777'));
    
    // Check if detections are attached to metadata
    assert.ok(Array.isArray(safeDocs[0].metadata.medShieldDetections));
    assert.ok(safeDocs[0].metadata.medShieldDetections.length > 0);
});

test('Integration: LangChain Middleware Tool Wrapper', async () => {
    const middleware = new LangChainMedShieldMiddleware({ level: 'MASK' });
    
    // Mock a tool
    const getPatientData = async (id: string) => {
        return `Data for patient: Robert. DOB: 1990-01-01`;
    };

    const safeGetPatientData = middleware.wrapTool(getPatientData);
    const result = await safeGetPatientData('123');

    assert.ok(!result.includes('Robert'));
    assert.ok(result.includes('[PERSON_0]'));
});

test('Integration: Vercel AI SDK Middleware', () => {
    const middleware = new VercelAIMedShieldMiddleware({ level: 'MASK', deterministic: true });
    
    const coreMessages = [
        { role: 'user', content: 'What about John Doe?' },
        { role: 'assistant', content: 'I do not have data for John Doe.' },
        { role: 'tool', content: 'John Doe is admitted.' }
    ];

    const safeMessages = middleware.sanitizeCoreMessages(coreMessages);

    // Assistant role shouldn't be touched by the basic sanitize middleware
    assert.strictEqual(safeMessages[1].content, 'I do not have data for John Doe.');
    
    // User and Tool should be sanitized
    console.log("safeMessages[0]:", safeMessages[0].content);
    console.log("safeMessages[2]:", safeMessages[2].content);
    assert.ok(safeMessages[0].content.includes('[PERSON_'));
    assert.ok(safeMessages[2].content.includes('[PERSON_')); // Was sanitized deterministically
});
