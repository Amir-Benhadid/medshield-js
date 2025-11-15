/**
 * MedShield-JS: HIPAA & PII Regex Patterns
 * Categorized by sensitivity type.
 */

export interface PatternDefinition {
    id: string;
    label: string;
    regex: RegExp;
    contextKeywords?: string[];
}

export const PII_PATTERNS: PatternDefinition[] = [
    // --- 1. Government Identifiers ---
    {
        id: 'ssn',
        label: 'SSN',
        regex: /\b\d{3}-\d{2}-\d{4}\b/g,
        contextKeywords: ['ssn', 'social security', 'soc sec']
    },
    {
        id: 'passport',
        label: 'PASSPORT',
        regex: /\b[A-Z][0-9]{8}\b/g,
        contextKeywords: ['passport', 'travel doc']
    },

    // --- 2. Contact Information ---
    {
        id: 'email',
        label: 'EMAIL',
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        contextKeywords: ['email', 'e-mail', 'contact']
    },
    {
        id: 'phone',
        label: 'PHONE',
        regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        contextKeywords: ['phone', 'tel', 'cell', 'mobile', 'fax']
    },

    // --- 3. Medical/Healthcare Specifics ---
    {
        id: 'mrn',
        label: 'MRN',
        regex: /\bMRN[:\- ]*[A-Z0-9]{4,10}\b/gi,
        contextKeywords: ['medical record', 'mrn', 'patient id', 'chart']
    },
    {
        id: 'icd10',
        label: 'ICD_CODE',
        regex: /\b[A-Z][0-9][0-9A-Z](\.[0-9A-Z]{1,4})?\b/g,
        contextKeywords: ['diagnosis', 'icd', 'code']
    },
    {
        id: 'npi',
        label: 'NPI_NUMBER',
        regex: /\b[1-9][0-9]{9}\b/g,
        contextKeywords: ['npi', 'provider id', 'practitioner']
    },

    // --- 4. Personal Dates ---
    {
        id: 'date',
        label: 'DATE',
        regex: /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(?:\d{4}-\d{2}-\d{2})\b/g,
        contextKeywords: ['dob', 'birth', 'admitted', 'discharged', 'on']
    },

    // --- 5. Network & Digital Identifiers ---
    {
        id: 'ip_address',
        label: 'IP_ADDRESS',
        regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        contextKeywords: ['ip', 'address', 'host', 'log']
    },
    {
        id: 'mac_address',
        label: 'MAC_ADDRESS',
        regex: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g,
        contextKeywords: ['mac', 'device id', 'hardware']
    },

    // --- 6. Financial ---
    {
        id: 'credit_card',
        label: 'CREDIT_CARD',
        regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        contextKeywords: ['visa', 'mastercard', 'amex', 'payment', 'card']
    }
];