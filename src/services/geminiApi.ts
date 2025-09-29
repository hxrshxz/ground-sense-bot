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
 * Centralized Gemini API service with:
 * - Configurable model (via VITE_GEMINI_MODEL)
 * - Automatic fallback models if a 404/model-not-found occurs
 * - Lazy model list fetch (ListModels) for future enhancements
 * - Consistent error normalization
 */
export class GeminiApiService {
  private apiKey: string;
  private apiVersion = "v1beta"; // keep v1beta for latest 1.5 models
  private primaryModel =
    (import.meta.env.VITE_GEMINI_MODEL as string) || "gemini-1.5-flash-latest";
  // Fallback order (will try sequentially on model-not-found)
  private fallbackModels = [
    "gemini-1.5-flash",
    "gemini-1.5-pro-latest",
    "gemini-1.5-pro",
    "gemini-pro",
  ];
  private triedModels = new Set<string>();

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

  private buildSystemPrompt(userPrompt: string) {
    return `You are INGRES AI Assistant, a specialized AI for analyzing India's groundwater data. You help users understand groundwater levels, recharge rates, extraction data, and provide insights about water resource management in India.

Key context:
- You work with groundwater assessment units across India
- Categories: Safe, Semi-Critical, Critical, Over-Exploited
- You can analyze specific blocks, districts, and states
- You provide data-driven insights and recommendations
- You understand both English and Hindi queries

Response guidelines:
- Be concise and technical when appropriate
- Provide specific numbers when available (use realistic Indian groundwater data)
- Offer actionable insights for water management
- If asked about specific blocks like Delhi, provide detailed analysis
- For general queries, guide users to be more specific

User Query: ${userPrompt}`;
  }

  private async postGenerate(model: string, prompt: string) {
    const response = await fetch(`${this.buildUrl(model)}?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: this.buildSystemPrompt(prompt) }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
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

  async generateResponse(prompt: string): Promise<GeminiResponse> {
    if (!this.apiKey || this.apiKey.trim() === "")
      throw new Error("Gemini API key is required");

    const modelsToTry = [this.primaryModel, ...this.fallbackModels].filter(
      (m) => !this.triedModels.has(m)
    );
    let lastError: any;
    for (const model of modelsToTry) {
      try {
        this.triedModels.add(model);
        const data = await this.postGenerate(model, prompt);
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          "No response text returned.";
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
      ? MAP_ANALYSIS_PROMPT + "\n\nPlease analyze this INGRES groundwater map image and provide the comprehensive analysis in the specified JSON format."
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
