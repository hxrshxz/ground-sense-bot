import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import the legacy types
import { AIResponse, ComponentData } from "@/types/ai-response";

// Component to render individual legacy AI components based on their type
const ComponentRenderer: React.FC<{ component: ComponentData }> = ({
  component,
}) => {
  // Since we don't have proper renderers for the legacy types, we'll create a placeholder
  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>{component.type}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(component, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

// Main layout for the AI Response
const AIResponseRenderer: React.FC<{ response: AIResponse }> = ({
  response,
}) => {
  const { title, components, aiSummary, displayType } = response;

  return (
    <div className="w-full">
      <Card className="w-full overflow-hidden bg-white border border-gray-200">
        <CardHeader className="bg-slate-50 border-b border-gray-200">
          <CardTitle className="text-xl text-gray-800">
            {title || "Groundwater Analysis"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {components.map((component, index) => (
              <div key={index}>
                <ComponentRenderer component={component} />
              </div>
            ))}
          </div>

          {aiSummary && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Card className="bg-gray-50 border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-800">{aiSummary}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIResponseRenderer;
