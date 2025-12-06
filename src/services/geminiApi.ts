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
  private apiKey: string;
  private apiVersion = "v1beta"; // keep v1beta for latest 1.5 models
  private primaryModel =
    (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-2.5-flash";
  // Fallback order (will try sequentially on model-not-found)
  private fallbackModels = [
    "gemini-1.5-flash",
    "gemini-2.5-pro-latest",
    "gemini-2.5-pro",
    "gemini-pro",
  ];
  private triedModels = new Set<string>();

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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

  // Domain knowledge for groundwater analysis
  private readonly DOMAIN_KNOWLEDGE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOMAIN KNOWLEDGE FOR GROUNDWATER ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CRITICAL THRESHOLDS:
- Stage of Extraction > 100%: Over-Exploited (RED ALERT)
- Stage 90-100%: Critical (HIGH RISK)  
- Stage 70-90%: Semi-Critical (MODERATE RISK)
- Stage < 70%: Safe (LOW RISK)

INDIA GROUNDWATER STATISTICS (2024-2025):
- Total Assessment Units: 5,796 blocks
- Over-Exploited: ~17% of blocks
- Critical: ~5% of blocks
- Semi-Critical: ~10% of blocks
- Safe: ~65% of blocks
- Total Recharge: ~430 BCM/year
- Total Extraction: ~250 BCM/year
- Net Availability: ~398 BCM/year

STATE-LEVEL INSIGHTS:
- Punjab: Highest extraction, 79% over-exploited blocks, 650mm avg rainfall
- Rajasthan: Water-scarce, 450mm rainfall, high salinity issues
- Haryana: High agricultural demand, 60% critical+over-exploited
- Delhi: Urban stress, limited recharge, 90%+ over-exploited
- Tamil Nadu: Coastal salinity, monsoon dependent
- Gujarat: Mixed status, western areas critical

TYPICAL EXTRACTION BREAKDOWN:
- Agriculture: 85-92% (dominant in rural areas)
- Domestic: 5-10%
- Industrial: 2-5%

RECHARGE SOURCES IMPORTANCE:
1. Rainfall Recharge: 60-70% of total
2. Canal Recharge: 15-25%
3. Irrigation Return Flow: 10-15%
4. Water Conservation: 5-10%

RED FLAGS TO DETECT:
- Extraction > Recharge by 30%+ (unsustainable)
- Rainfall < 400mm with high extraction
- Rapid decline > 0.5m/year
- Stage > 150% (severe over-exploitation)
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
    task: "general" | "analysis" | "explanation" = "general"
  ) {
    const historyContext = this.buildContextFromHistory();

    const basePrompt = `You are INGRES AI Assistant, an expert AI for analyzing India's groundwater data from the CGWB (Central Ground Water Board) INGRES portal.

${this.DOMAIN_KNOWLEDGE}
${historyContext}

Key capabilities:
- Analyze 5,796 groundwater assessment blocks across India
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
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: GeminiApiError;
      };
      const message = errorData?.error?.message || "Unknown error";
      const code = errorData?.error?.code || response.status;
      const status = errorData?.error?.status;
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
    task: "general" | "analysis" | "explanation" = "general"
  ): Promise<GeminiResponse> {
    if (!this.apiKey || this.apiKey.trim() === "")
      throw new Error("Gemini API key is required");

    // Add user message to history
    this.addToHistory("user", prompt);

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

        // Add assistant response to history
        this.addToHistory("assistant", text);

        return { text };
      } catch (err) {
        lastError = err;
        if (!this.isModelNotFound(err)) {
          // Non model-not-found errors => stop early
          break;
        }
        // else continue to next fallback
      }
    }
    console.error("Gemini API final error:", lastError);
    throw lastError;
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
}
