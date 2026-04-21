#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Sanitizer } from "../index";

// Initialize MedShield components
const sanitizer = new Sanitizer({ level: 'SYNTHESIZE', deterministic: true, preserveMedicalContext: true });

// Create the MCP server instance
const server = new Server(
  {
    name: "medshield-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register MedShield Tools.
 * These tools act as interceptors for EMR integrations and AI queries.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "sanitize_text",
        description: "Scans and obfuscates/synthesizes PHI/PII in medical text while preserving clinical context. Use this before sending EMR data to LLMs.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The raw medical text or EMR dump containing potential PHI.",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "reset_privacy_context",
        description: "Resets deterministic ID mappings. Run this when switching to a different patient or conversation session.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      }
    ],
  };
});

/**
 * Handle Tool Executions.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "sanitize_text") {
    const text = String(request.params.arguments?.text || "");
    const result = sanitizer.scan(text);
    
    // Log blocked detections to console (stderr so it doesn't break stdio MCP)
    if (result.detections.length > 0) {
      console.error(`[MedShield MCP] Blocked ${result.detections.length} sensitive entities.`);
    }

    return {
      content: [
        {
          type: "text",
          text: result.sanitizedText,
        },
      ],
    };
  }

  if (request.params.name === "reset_privacy_context") {
    sanitizer.resetContext();
    return {
      content: [
        {
          type: "text",
          text: "MedShield session reset. Deterministic IDs cleared.",
        },
      ],
    };
  }

  throw new Error("Tool not found");
});

/**
 * Start the MCP Server using stdio
 */
async function main() {
  console.error("Starting MedShield MCP Server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MedShield MCP Server active and listening for queries.");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
