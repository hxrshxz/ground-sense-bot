import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import the legacy types
import { AIResponse, ComponentData } from '@/types/ai-response';

// Component to render individual legacy AI components based on their type
const ComponentRenderer: React.FC<{ component: ComponentData }> = ({ component }) => {
  // Since we don't have proper renderers for the legacy types, we'll create a placeholder
  return (
    <div className="mb-4">
      <Card>
        <CardHeader>
          <CardTitle>{component.type}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">{JSON.stringify(component, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
};

// Main layout for the AI Response
const AIResponseRenderer: React.FC<{ response: AIResponse }> = ({ response }) => {
  const { title, components, aiSummary, displayType } = response;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full overflow-hidden bg-white shadow-lg">
        <CardHeader className="bg-gradient-to-r from-sky-50 to-indigo-50 border-b border-gray-100">
          <CardTitle className="text-xl text-gray-800">{title || 'Groundwater Analysis'}</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {components.map((component, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <ComponentRenderer component={component} />
              </motion.div>
            ))}
          </div>

          {aiSummary && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">AI Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-800">{aiSummary}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIResponseRenderer;
