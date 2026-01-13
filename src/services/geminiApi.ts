import { MAP_ANALYSIS_PROMPT } from "../data/mapAnalysisPrompt";

export interface GeminiResponse {
  text: string;
}

interface GeminiApiError {
  code?: number;
  status?: string;
  message?: string;
}

/**
 * Task-specific configuration for optimal AI responses
 */
interface TaskConfig {
  temperature: number;
  maxOutputTokens: number;
  topK: number;
  topP: number;
}

/**
 * Centralized Gemini API service with:
 * - Configurable model (via VITE_GEMINI_MODEL)
 * - Automatic fallback models if a 404/model-not-found occurs
 * - Task-specific temperature and token settings
 * - Domain knowledge for groundwater analysis
 * - Consistent error normalization
 */
export class GeminiApiService {
  private apiKeys: string[] = [];
  private currentKeyIndex: number = 0;
  private disabledKeys: Set<string> = new Set();
  
  /* 
  /* 
   * VALIDATED: gemini-2.0-flash-exp is the correct model name (returns 429 Quota Exceeded, not 404)
   * This confirms the model exists and is accessible with the current key.
   */
  private primaryModel =
    (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.0-flash-exp";
    
  // Fallback order (will try sequentially on model-not-found or quota exceeded)
  private fallbackModels = [
    "gemini-2.5-flash",       // New high-performance model
    "gemini-2.5-flash-lite",  // Efficient lite version
    "gemini-3-flash",         // Next-gen flash model
    "gemini-2.0-flash-exp",   // Existing experimental model
    "gemini-1.5-flash",       // Stable fallback
    "gemini-1.5-pro",         // Legacy fallback
  ];
  private triedModels = new Set<string>();

  // Use v1beta for widest model support
  private apiVersion = "v1beta";

  // Task-specific configurations for optimal responses
  private taskConfigs: Record<string, TaskConfig> = {
    general: { temperature: 0.4, maxOutputTokens: 4096, topK: 40, topP: 0.95 },
    analysis: { temperature: 0.3, maxOutputTokens: 8192, topK: 40, topP: 0.9 },
    visualization: {
      temperature: 0.5,
      maxOutputTokens: 4096,
      topK: 50,
      topP: 0.95,
    },
    sql: { temperature: 0.1, maxOutputTokens: 2048, topK: 20, topP: 0.8 },
    explanation: {
      temperature: 0.4,
      maxOutputTokens: 4096,
      topK: 40,
      topP: 0.9,
    },
  };


  constructor(apiKeys: string | string[]) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys.filter(Boolean) : [apiKeys].filter(Boolean);
    if (this.apiKeys.length === 0) {
      console.error("[GEMINI] No valid API keys provided");
    }
  }

  private get apiKey(): string {
    return this.apiKeys[this.currentKeyIndex] || "";
  }

  /**
   * Switches to the next available API key if the current one is exhausted
   */
  private rotateKey(): boolean {
    if (this.apiKeys.length <= 1) return false;
    
    const failedKey = this.apiKey;
    this.disabledKeys.add(failedKey);
    
    // Find next non-disabled key
    for (let i = 1; i < this.apiKeys.length; i++) {
      const nextIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      if (!this.disabledKeys.has(this.apiKeys[nextIndex])) {
        this.currentKeyIndex = nextIndex;
        console.warn(`[GEMINI] Switched to backup API key (Index: ${this.currentKeyIndex})`);
        return true;
      }
    }
    
    return false;
  }

  private buildUrl(model: string) {
    return `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${model}:generateContent`;
  }

  /** Basic ListModels helper for debugging / future dynamic selection */
  async listModels(): Promise<string[]> {
    if (!this.apiKey) throw new Error("Gemini API key is required");
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/${this.apiVersion}/models?key=${this.apiKey}`
    );
    if (!resp.ok) return [];
    const data = await resp.json().catch(() => ({}));
    return (data.models || [])
      .map((m: any) => m.name?.replace("models/", ""))
      .filter(Boolean);
  }

  // Domain knowledge for groundwater analysis - THE SOURCE of TRUTH for RULES
  private readonly DOMAIN_KNOWLEDGE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CGWB OFFICIAL DATA PROTOCOLS - MANDATORY COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ DATA LOCK:
1. If data is provided in the query under "VERIFIED GROUND TRUTH DATA", you MUST use those exact numbers.
2. NEVER hallucinate or invent numbers if they are not provided.
3. TARGETED LOCATIONS: If the user explicitly asks for groundwater data for a specific location and no data is provided, state: "The specific data for [Location Name] is not available in my current dataset. Please check the INGRES portal."
4. GENERAL/OTHER QUERIES: If the user asks general questions (e.g., "Who is Virat Kohli", "Write a code") unrelated to groundwater:
   - You MAY answer them helpfully.
   - You MUST briefly mention: "I am primarily a Groundwater Analysis Assistant, but..."

⚠️ MATHEMATICAL CONVERSION RULES (NON-NEGOTIABLE):
1. Unit conversion: BCM = ham ÷ 100,000
   - Example trace: "2,000,000 ham ÷ 100,000 = 20.00 BCM"
2. Stage of Extraction Formula: (Extraction in ham / Extractable Resources in ham) × 100
   - Example trace: "(1,500,000 ham / 1,000,000 ham) × 100 = 150%"
3. ALWAYS show the raw ham value, the formula, and the final result.

CLASSIFICATION THRESHOLDS (CGWB Official):
- Stage > 100%: Over-Exploited (RED ALERT)
- Stage 90-100%: Critical (HIGH RISK)  
- Stage 70-90%: Semi-Critical (MODERATE RISK)
- Stage < 70%: Safe (LOW RISK)

FORBIDDEN:
- "approximately", "around", "about", "roughly"
- Estimates not based on the provided ham values
- Omitting the BCM unit or the ham -> BCM calculation trace
`;

  // Data extraction schema for visualization - client builds charts from structured data
  private readonly DATA_EXTRACTION_SCHEMA = `
DATA EXTRACTION FOR VISUALIZATION:
When asked to compare locations, show trends, or visualize data, you MUST return structured data in a JSON code block.

The JSON should be wrapped in \`\`\`json and \`\`\` tags.

FOR COMPARISON QUERIES (e.g., "Compare Punjab and Haryana"):
\`\`\`json
{
  "dataType": "comparison",
  "locations": ["Punjab", "Haryana"],
  "metrics": {
    "extraction": [17096.20, 12500.50],
    "recharge": [11621.68, 14200.30],
    "stage": [147.1, 88.0]
  },
  "unit": "MCM"
}
\`\`\`

FOR TREND QUERIES (e.g., "Show trend for Delhi"):
\`\`\`json
{
  "dataType": "trend",
  "location": "Delhi",
  "years": ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"],
  "values": {
    "extraction": [150.2, 155.8, 158.2, 160.5, 162.1],
    "recharge": [125.3, 120.5, 119.8, 118.2, 117.5]
  },
  "unit": "MCM"
}
\`\`\`

FOR SECTOR USAGE QUERIES (e.g., "Sector-wise usage in Gujarat"):
\`\`\`json
{
  "dataType": "sector",
  "location": "Gujarat",
  "sectors": [
    { "name": "Agriculture", "percentage": 89.8 },
    { "name": "Domestic", "percentage": 7.2 },
    { "name": "Industrial", "percentage": 3.0 }
  ]
}
\`\`\`

FOR TOP RANKING QUERIES (e.g., "Top 5 over-exploited states"):
\`\`\`json
{
  "dataType": "ranking",
  "category": "Over-Exploited",
  "items": [
    { "name": "Punjab", "stage": 166.0 },
    { "name": "Rajasthan", "stage": 140.0 },
    { "name": "Haryana", "stage": 137.0 }
  ]
}
\`\`\`

IMPORTANT:
1. Use REAL data from your knowledge about Indian groundwater (CGWB data)
2. Include a brief text explanation BEFORE the JSON block
3. Return ONLY the JSON for the data, the chart will be built automatically
`;

  // Conversation history for context retention
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private readonly MAX_HISTORY_LENGTH = 5;

  // Add message to conversation history
  public addToHistory(role: "user" | "assistant", content: string) {
    this.conversationHistory.push({ role, content });
    // Keep only last N messages
    if (this.conversationHistory.length > this.MAX_HISTORY_LENGTH * 2) {
      this.conversationHistory = this.conversationHistory.slice(
        -this.MAX_HISTORY_LENGTH * 2
      );
    }
  }

  // Clear conversation history
  public clearHistory() {
    this.conversationHistory = [];
  }

  // Build context string from history
  private buildContextFromHistory(): string {
    if (this.conversationHistory.length === 0) return "";

    const historyStr = this.conversationHistory
      .map(
        (msg) =>
          `${msg.role.toUpperCase()}: ${msg.content.substring(0, 500)}${
            msg.content.length > 500 ? "..." : ""
          }`
      )
      .join("\n");

    return `\n\nCONVERSATION HISTORY (for context):\n${historyStr}\n`;
  }

  private buildSystemPrompt(
    userPrompt: string,
    task: "general" | "analysis" | "explanation" | "visualization" = "general"
  ) {
    const historyContext = this.buildContextFromHistory();

    const basePrompt = `You are INGRES AI Assistant, an expert AI for analyzing India's groundwater data from the CGWB (Central Ground Water Board) INGRES portal.

${this.DOMAIN_KNOWLEDGE}
${historyContext}

Key capabilities:
- Analyze 6,746 groundwater assessment blocks across India
- Categories: safe, semi_critical, critical, over_exploited, salinity
- Provide data-driven insights with specific numbers
- Understand both English and Hindi queries
- Support multi-turn conversations with context retention

Response guidelines:
- Be concise but comprehensive
- Always cite specific data when available
- Provide actionable recommendations
- Use bullet points for clarity
- For ambiguous queries, ask clarifying questions
- Reference conversation history when relevant

User Query: ${userPrompt}`;

    // Task-specific additions
    if (task === "analysis") {
      return (
        basePrompt +
        `\n\nProvide a detailed technical analysis with:\n1. Key metrics and their implications\n2. Comparison with thresholds\n3. Risk assessment\n4. Specific recommendations`
      );
    } else if (task === "explanation") {
      return (
        basePrompt +
        `\n\nExplain in a clear, educational manner suitable for spoken delivery. Use simple language and natural speech patterns.`
      );
    } else if (task === "visualization") {
      return (
        basePrompt +
        `\n\n${this.DATA_EXTRACTION_SCHEMA}\n\nIMPORTANT: You MUST include a JSON data block in your response for this visualization request.`
      );
    }

    return basePrompt;
  }

  private async postGenerate(
    model: string,
    prompt: string,
    task:
      | "general"
      | "analysis"
      | "explanation"
      | "visualization"
      | "sql" = "general"
  ) {
    const config = this.taskConfigs[task] || this.taskConfigs.general;
    
    // Standard logging
    console.log(`[GEMINI] Generating using model: ${model}`);

    const response = await fetch(`${this.buildUrl(model)}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: this.buildSystemPrompt(
                  prompt,
                  task === "visualization" || task === "sql" ? "general" : task
                ),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: config.temperature,
          topK: config.topK,
          topP: config.topP,
          maxOutputTokens: config.maxOutputTokens,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE",
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // failed to parse
      }

      const message = errorData?.error?.message || errorText || "Unknown error";
      const code = errorData?.error?.code || response.status;
      const status = errorData?.error?.status;
      
      if (code === 429 || status === "RESOURCE_EXHAUSTED") {
        console.warn(`⚠️ Gemini Quota Exceeded for ${model}.`);
      } else {
        console.warn(`⚠️ Gemini API Error (${model}): ${message}`);
      }

      throw Object.assign(
        new Error(
          `Gemini API error (${model}): ${code} ${status || ""} - ${message}`
        ),
        { code, status }
      );
    }

    return response.json();
  }

  private isModelNotFound(err: any) {
    if (!err) return false;
    const msg = String(err.message || "");
    return /NOT_FOUND|not found|404/i.test(msg);
  }

  async generateResponse(
    prompt: string,
    task: "general" | "analysis" | "explanation" | "visualization" = "general"
  ): Promise<GeminiResponse> {
    if (!this.apiKey)
      throw new Error("Gemini API key is required");

    // Clear tried models at the start of each turn
    this.triedModels.clear();

    // Add user message to history
    this.addToHistory("user", prompt);

    let retryWithNewKey = true;
    while (retryWithNewKey) {
      retryWithNewKey = false;
      const modelsToTry = [this.primaryModel, ...this.fallbackModels].filter(
        (m) => !this.triedModels.has(m)
      );
      
      let lastError: any;
      for (const model of modelsToTry) {
        try {
          this.triedModels.add(model);
          const data = await this.postGenerate(model, prompt, task);
          const text =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response text returned.";

          this.addToHistory("assistant", text);
          return { text };
        } catch (err: any) {
          lastError = err;
          
          const isNotFound = this.isModelNotFound(err);
          const isQuotaError = err.code === 429 || err.status === "RESOURCE_EXHAUSTED";
          
          if (isNotFound) {
            console.warn(`[GEMINI] Model ${model} not found. Trying next fallback...`);
            continue; 
          }

          if (isQuotaError) {
            console.warn(`[GEMINI] Model ${model} quota exceeded with current key.`);
            if (this.rotateKey()) {
              console.log("[GEMINI] Rotating API key and retrying turn...");
              this.triedModels.clear(); // Restart model fallback with new key
              retryWithNewKey = true;
              break; // Break the model loop to restart with new key
            }
            continue; // No more keys, try next model with same key if possible
          }

          break; // Other fatal errors
        }
      }

      if (!retryWithNewKey) {
        console.error("Gemini API final error:", lastError);
        throw lastError;
      }
    }
    
    throw new Error("Maximum retries with key rotation exceeded");
  }

  /** Analyze image with Gemini Vision capabilities using predefined groundwater analysis prompt */
  async analyzeImage(
    imageData: string,
    useMapAnalysisPrompt: boolean = true
  ): Promise<string> {
    if (!this.apiKey) throw new Error("Gemini API key is required");

    const modelsToTry = [this.primaryModel, ...this.fallbackModels];
    let lastError: any;

    // Use the comprehensive map analysis prompt or a simple fallback
    const analysisPrompt = useMapAnalysisPrompt
      ? MAP_ANALYSIS_PROMPT +
        "\n\nPlease analyze this INGRES groundwater map image and provide the comprehensive analysis in the specified JSON format."
      : "Analyze this groundwater map image and provide insights about the water levels, extraction rates, and regional conditions.";

    // Extract base64 data from data URL
    const base64Data = imageData.replace(
      /^data:image\/(png|jpg|jpeg);base64,/,
      ""
    );
    const mimeType =
      imageData.match(/^data:image\/(png|jpg|jpeg)/)?.[1] || "png";

    for (const model of modelsToTry) {
      if (this.triedModels.has(model)) continue;

      try {
        console.log(`Trying image analysis with model: ${model}`);
        this.triedModels.add(model);

        const data = await this.postGenerateWithImage(
          model,
          analysisPrompt,
          base64Data,
          `image/${mimeType}`
        );
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response text returned from image analysis.";
        return text;
      } catch (err) {
        lastError = err;
        if (!this.isModelNotFound(err)) {
          // Non model-not-found errors => stop early
          break;
        }
        // else continue to next fallback
      }
    }

    console.error("Gemini Image API final error:", lastError);
    throw lastError;
  }

  private async postGenerateWithImage(
    model: string,
    prompt: string,
    imageData: string,
    mimeType: string
  ) {
    const url = this.buildUrl(model);
    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
    };

    const resp = await fetch(`${url}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => "Unknown error");
      throw new Error(`HTTP ${resp.status}: ${errorText}`);
    }

    return await resp.json();
  }

  /**
   * Classify user query intent using LLM for semantic understanding.
   * Matches the backend's intent classification approach from nlp_service.go
   * Returns one of: SUMMARY | TREND | COMPARE | TOP_RANKING | SECTOR_USAGE | RISK_PROFILE | QUESTION | GREETING
   */
  async classifyIntent(query: string): Promise<string> {
    const classificationPrompt = `You are an intent classifier for a groundwater data assistant.
Classify this query into EXACTLY ONE of these intents:

INTENTS:
- SUMMARY: General status or overview of a location (e.g., "What's the status of Punjab?")
- TREND: Analysis over time, historical data (e.g., "Show trend for Delhi", "How has extraction changed?")
- COMPARE: Comparison between 2+ locations (e.g., "Compare Punjab and Haryana", "Punjab vs Rajasthan")
- TOP_RANKING: Top/bottom N, worst/best, rankings (e.g., "Top 10 over-exploited blocks", "Which states are worst?")
- SECTOR_USAGE: Sector breakdown, usage by sector (e.g., "Sector-wise usage in Gujarat", "How much does agriculture use?")
- RISK_PROFILE: Risk assessment, sustainability, vulnerability (e.g., "What's the risk in Delhi?", "Is Rajasthan sustainable?")
- QUESTION: Definition or explanation (e.g., "What is stage of extraction?", "Define ham")
- GREETING: Hello, hi, welcome messages

Query: "${query}"

Respond with ONLY the intent word (e.g., "COMPARE"). No explanation.`;

    try {
      const url = `https://generativelanguage.googleapis.com/${this.apiVersion}/models/${this.primaryModel}:generateContent`;
      const response = await fetch(`${url}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: classificationPrompt }] }],
          generationConfig: { maxOutputTokens: 10 }, // Very short response
        }),
      });

      if (!response.ok) {
        console.warn("[GEMINI] Intent classification failed, defaulting to SUMMARY");
        return "SUMMARY";
      }

      const data = await response.json();
      const intent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || "SUMMARY";
      
      // Validate intent is one of our known types
      const validIntents = ["SUMMARY", "TREND", "COMPARE", "TOP_RANKING", "SECTOR_USAGE", "RISK_PROFILE", "QUESTION", "GREETING"];
      if (validIntents.includes(intent)) {
        console.log(`[GEMINI] Intent classified: ${intent}`);
        return intent;
      }
      
      console.warn(`[GEMINI] Unknown intent "${intent}", defaulting to SUMMARY`);
      return "SUMMARY";
    } catch (err) {
      console.error("[GEMINI] Intent classification error:", err);
      return "SUMMARY";
    }
  }
}
