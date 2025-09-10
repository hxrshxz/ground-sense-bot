import React from "react";
import { getAIResponse } from "@/services/aiResponseService";
import AIResponseRenderer from "@/components/ai-components/AIResponseRenderer";
import { AIResponse, DisplayType } from "@/types/ai-response-v2";

interface AIResponseIntegrationProps {
  query: string;
  onFallback: () => void;
}

// This component checks if we have a structured response for the given query
// If yes, it renders our enhanced component; if not, it calls the fallback
const AIResponseIntegration: React.FC<AIResponseIntegrationProps> = ({
  query,
  onFallback,
}) => {
  // Get structured response (if available)
  const rawResponse = getAIResponse(query);

  // Convert rawResponse to AIResponse from ai-response-v2 if necessary
  const response: AIResponse | null = rawResponse
    ? {
        ...rawResponse,
        // Ensure displayType matches the v2 type
        displayType: rawResponse.displayType as DisplayType,
        // Map components from v1 to v2 if necessary
        components: rawResponse.components.map((component: any) => {
          // Example mapping logic, adjust as needed for your types
          if (
            component.type === "TEXT" ||
            component.type === "AIComponentType.TEXT"
          ) {
            return {
              type: "ComponentType.CARD", // or the correct v2 type
              content: component.content,
              // Add other necessary mappings here
            };
          }
          // Add more mappings for other component types if needed
          return component;
        }),
      }
    : null;

  // If we have a structured response, render it with our enhanced renderer
  if (response) {
    return <AIResponseRenderer response={response} />;
  }

  // Otherwise, call the fallback handler (which should use Gemini or other processing)
  React.useEffect(() => {
    onFallback();
  }, [onFallback]);

  return null; // Nothing to render as we're calling the fallback
};

export default AIResponseIntegration;
