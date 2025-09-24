export interface GeminiResponse {
  text: string;
}

export class GeminiApiService {
  private apiKey: string;
  private baseUrl =
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(prompt: string): Promise<GeminiResponse> {
    if (!this.apiKey || this.apiKey.trim() === "") {
      throw new Error("Gemini API key is required");
    }

    const systemPrompt = `You are INGRES AI Assistant, a specialized AI for analyzing India's groundwater data. You help users understand groundwater levels, recharge rates, extraction data, and provide insights about water resource management in India.

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
- If asked about specific blocks like Delhi , provide detailed analysis
- For general queries, guide users to be more specific

User Query: ${prompt}`;

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: systemPrompt,
                },
              ],
            },
          ],
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${response.status} - ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error("Invalid response format from Gemini API");
      }

      const text = data.candidates[0].content.parts[0].text;
      return { text };
    } catch (error) {
      console.error("Gemini API error:", error);
      throw error;
    }
  }
}
