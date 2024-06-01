import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { defineFlow, startFlowsServer } from '@genkit-ai/flow';
import { geminiPro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import 'dotenv/config'

configureGenkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const CyberBullying = defineFlow(
  {
    name: 'CyberBullying',
    inputSchema: z.object({
      conversationHistory: z.array(z.object({
        id: z.string().optional(),
        speaker: z.string(),
        message: z.string(),
        timestamp: z.string(),
      })).optional().describe("The conversation to analyze for cyberbullying instances"),
      type: z.enum(["classification", "contextual"]).default("classification").describe("Prompt type: classification or contextual analysis"),
      targetType: z.enum(["general", "hateSpeech", "threat", "harassment"]).default("general").optional().describe("Optional target for specific cyberbullying types"),
    }),
  },
  async ({ type, conversationHistory, targetType }) => {
    const llmResponse = await generate({
      prompt: `
                Analyze the following conversation and identify instances of cyberbullying. Consider the tone, intent, and power dynamics between participants.
                Conversations: 
                  ${conversationHistory?.map((c) => `\t -> ${c.speaker}: ${c.message} at ${c.timestamp}`).join("\n")}
                Type: ${type}
                Target: ${targetType}  
              `,
      model: geminiPro,
      output: {
        schema: z.object({
          analysis: z.string().optional().describe("Analysis of the conversation for cyberbullying instances, one sentence summary"),
          isBullying: z.boolean().optional().describe("Whether the conversation contains instances of cyberbullying"),
          victim: z.array(z.string()).optional().describe("The victim of the cyberbullying"),
          bullies: z.array(z.string()).optional().describe("The bully in the conversation "),
          targets: z.array(z.string()).optional().describe("The target of the cyberbullying "),
          type: z.enum(['cyberbullying', 'verbal', 'physical', 'social']).nullable().optional().describe("The type of cyberbullying or NA if not applicable"),
          sensitivity: z.number().optional().describe("The sensitivity of the conversation 0 - 1"),
          confidence: z.number().optional().describe("The confidence of the analysis"),
          conversation: z.array(z.object({
            id: z.string().nullable().optional().describe("The id of the conversation should not be null"),
            speaker: z.string(),
            message: z.string(),
            isBullyComment: z.boolean().optional().describe("Whether the message is a bully comment"),
            timestamp: z.string(),
            analysis: z.string().nullable().optional().describe("This should have a value if the conversation is involved in the bullying"),
          })).optional().describe("Only the conversations involved in the bullying")
        }),
      },
      config: {
        temperature: 1,
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
          }, {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
          }, {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
          }, {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
          }
        ],
      },
    });

    return llmResponse.output();
  }
);

startFlowsServer({
  cors: {
    origin: "*",
  },
});
