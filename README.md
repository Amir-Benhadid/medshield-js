# MedShield-JS

**Privacy-First Healthcare PII/PHI Sanitization Engine for the Age of Generative AI.**

MedShield-JS is a high-performance, modular TypeScript library designed to detect, mask, and synthesize sensitive medical data (PHI/PII). It acts as an "invisible privacy firewall" for MedTech applications, AI agents, and clinical researchers, ensuring HIPAA-compliant data flows without sacrificing the utility of Large Language Models (LLMs).

---

## Key Features

*   **Multi-Layer Detection Engine**:
    *   **Regex Layer**: High-speed detection of deterministic patterns (SSNs, Emails, MRNs, Credit Cards, IP Addresses, etc.).
    *   **NLP Layer (NER)**: Context-aware entity extraction using `compromise` and `compromise-medical` to identify Names, Locations, and Organizations.
    *   **Medical Layer**: Dictionary-based lookup for clinical terminology, ICD-10 codes, and custom hospital vocabularies.
*   **Three Sensitivity Modes**:
    *   `REDACT`: Complete removal of data (e.g., `[SSN]`).
    *   `MASK`: Partial obfuscation with type labels (e.g., `[HIDDEN_PHONE]`).
    *   `SYNTHESIZE`: Replaces real data with medically plausible, format-preserving fake data using `@faker-js/faker`.
*   **Advanced AI Agent Support**:
    *   **Deterministic Tokenization**: Consistent mapping (e.g., "John Doe" always becomes `[PERSON_0]`) to maintain clinical reasoning across LLM chat turns.
    *   **Medical Context Preservation**: Intelligently strips identifiers while retaining medical conditions (Diabetes, Asthma) for research integrity.
*   **Agentic SDK Integrations**: Official middleware for **OpenAI SDK**, **LangChain**, and **Vercel AI SDK**.
*   **Built-in MCP Server**: Native support for the Model Context Protocol (MCP) to integrate directly into AI IDEs and agents.

---

## Installation

```bash
npm install medshield-js
```

---

## Quick Start

```typescript
import { Sanitizer } from 'medshield-js';

const sanitizer = new Sanitizer({ level: 'MASK' });
const input = "Patient John Doe (SSN: 111-22-3333) was admitted today.";

const result = sanitizer.scan(input);

console.log(result.sanitizedText);
// Output: Patient [HIDDEN_PERSON] (SSN: [HIDDEN_SSN]) was admitted today.

console.log(result.detections);
// Details about every entity found, including original value and indices.
```

---

## Advanced Usage

### 1. Reaching Full "Synthetic Data" Generation
Preserve the *shape* of the data while removing all *risk*.

```typescript
const synthesizer = new Sanitizer({ 
    level: 'SYNTHESIZE', 
    deterministic: true,
    preserveMedicalContext: true 
});

const text = "Jane Smith has ICD-10 J45.901.";
console.log(synthesizer.sanitize(text));
// Output: "Sarah Miller has ICD-10 J45.901." (Name is consistent, Diagnosis is preserved)
```

### 2. OpenAI Middleware
Protect prompts before they hit the cloud.

```typescript
import { OpenAIMedShieldMiddleware } from 'medshield-js';

const firewall = new OpenAIMedShieldMiddleware({ level: 'MASK' });

const rawMessages = [
    { role: 'user', content: 'What is the history for patient Robert Brown?' }
];

const { safeMessages } = firewall.sanitizeMessages(rawMessages);
// safeMessages[0].content -> "What is the history for patient [PERSON_0]?"
```

### 3. MCP Server (Model Context Protocol)
Run MedShield as a system-wide service that AI Agents can call.

```bash
# Start the server via npx
npx medshield-mcp
```

Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "medshield": {
      "command": "npx",
      "args": ["-y", "medshield-js-mcp"]
    }
  }
}
```

---

## Architecture: Chain of Responsibility

MedShield-JS uses a modular pipeline where text flows through multiple specialized layers.

1.  **RegexLayer**: Handles patterns with strict formats.
2.  **NERLayer**: Uses NLP for context-sensitive entities like names.
3.  **MedicalLayer**: Matches clinical keywords and ICD codes.

Each layer contributes to a `ProcessedResult` object, aggregating all detections and performing safe string replacements from back-to-front to maintain character index integrity.

---

## Testing

MedShield-JS is thoroughly tested with 27+ unit and integration tests.

```bash
# Run the test suite
npm run test
```

---

## Security & Privacy
This library is designed to help with HIPAA/GDPR compliance but does not guarantee it on its own. Always audit your LLM data pipelines. MedShield-JS processes all data **locally** and never sends your text to external servers (except for the synthetic data generators which are also local libraries).

---

## License
Apache License 2.0 © 2026 MedShield-JS Team
