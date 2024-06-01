"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CyberBullying = void 0;
const ai_1 = require("@genkit-ai/ai");
const core_1 = require("@genkit-ai/core");
const flow_1 = require("@genkit-ai/flow");
const googleai_1 = require("@genkit-ai/googleai");
const z = __importStar(require("zod"));
const googleai_2 = require("@genkit-ai/googleai");
require("dotenv/config");
(0, core_1.configureGenkit)({
    plugins: [
        (0, googleai_2.googleAI)({
            apiKey: process.env.GOOGLE_GENAI_API_KEY,
        }),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});
exports.CyberBullying = (0, flow_1.defineFlow)({
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
}, async ({ type, conversationHistory, targetType }) => {
    const llmResponse = await (0, ai_1.generate)({
        prompt: `
                Analyze the following conversation and identify instances of cyberbullying. Consider the tone, intent, and power dynamics between participants.
                Conversations: 
                  ${conversationHistory === null || conversationHistory === void 0 ? void 0 : conversationHistory.map((c) => `\t -> ${c.speaker}: ${c.message} at ${c.timestamp}`).join("\n")}
                Type: ${type}
                Target: ${targetType}  
              `,
        model: googleai_1.geminiPro,
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
});
(0, flow_1.startFlowsServer)({
    cors: {
        origin: "*",
    },
});
//# sourceMappingURL=index.js.map