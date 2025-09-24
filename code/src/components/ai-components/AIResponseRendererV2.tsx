import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Import both the legacy types and the v2 types
import {
  AIResponse,
  DisplayType,
  AIComponent,
  ComponentType,
} from "@/types/ai-response-v2";

// Import animation components
import { AnimatedAIText } from "./AnimatedAIContent";

// Import simple component renderer
import { SimpleComponentRenderer } from "./SimpleComponentRenderers";

// Import download component
import { DownloadReport } from "../DownloadReport";

// Component to render individual AI components based on their type
const ComponentRenderer = ({ component }: { component: AIComponent }) => {
  return <SimpleComponentRenderer component={component} />;
};

// Default Layout
const DefaultLayout: React.FC<{ response: AIResponse }> = ({ response }) => {
  return (
    <div className="space-y-6">
      {response.title && (
        <h2 className="text-2xl font-bold">{response.title}</h2>
      )}
      {response.components.map((component) => (
        <motion.div
          key={component.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4"
        >
          <ComponentRenderer component={component} />
        </motion.div>
      ))}
      {response.aiSummary && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
          <AnimatedAIText text={response.aiSummary} />
        </div>
      )}
    </div>
  );
};

// Grid Layout
const GridLayout: React.FC<{ response: AIResponse }> = ({ response }) => {
  return (
    <div className="space-y-6">
      {response.title && (
        <h2 className="text-2xl font-bold">{response.title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {response.components.map((component) => (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ComponentRenderer component={component} />
          </motion.div>
        ))}
      </div>
      {response.aiSummary && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
          <AnimatedAIText text={response.aiSummary} />
        </div>
      )}
    </div>
  );
};

// Tabs Layout
const TabsLayout: React.FC<{ response: AIResponse }> = ({ response }) => {
  return (
    <div className="space-y-6">
      {response.title && (
        <h2 className="text-2xl font-bold">{response.title}</h2>
      )}
      <Tabs defaultValue={response.components[0]?.id} className="w-full">
        <TabsList className="mb-4">
          {response.components.map((component) => (
            <TabsTrigger key={component.id} value={component.id}>
              {component.title || `Tab ${component.id}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {response.components.map((component) => (
          <TabsContent key={component.id} value={component.id} className="pt-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ComponentRenderer component={component} />
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
      {response.aiSummary && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
          <AnimatedAIText text={response.aiSummary} />
        </div>
      )}
    </div>
  );
};

// Accordion Layout
const AccordionLayout: React.FC<{ response: AIResponse }> = ({ response }) => {
  return (
    <div className="space-y-6">
      {response.title && (
        <h2 className="text-2xl font-bold">{response.title}</h2>
      )}
      <Accordion type="single" collapsible className="w-full">
        {response.components.map((component, index) => (
          <AccordionItem key={component.id} value={component.id}>
            <AccordionTrigger>
              {component.title || `Section ${index + 1}`}
            </AccordionTrigger>
            <AccordionContent>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="py-2"
              >
                <ComponentRenderer component={component} />
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {response.aiSummary && (
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
          <AnimatedAIText text={response.aiSummary} />
        </div>
      )}
    </div>
  );
};

// Main AIResponseRenderer Component
const AIResponseRenderer: React.FC<{ response: AIResponse }> = ({
  response,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  return (
    <Card className="w-full overflow-hidden bg-white shadow-lg">
      <CardContent className="p-6" ref={reportRef}>
        {(() => {
          switch (response.displayType) {
            case DisplayType.GRID:
              return <GridLayout response={response} />;
            case DisplayType.TABS:
              return <TabsLayout response={response} />;
            case DisplayType.ACCORDION:
              return <AccordionLayout response={response} />;
            case DisplayType.SINGLE:
            case DisplayType.DEFAULT:
            default:
              return <DefaultLayout response={response} />;
          }
        })()}
      </CardContent>
      <div className="flex justify-end p-4 border-t border-gray-100">
        <DownloadReport
          targetRef={reportRef}
          fileName={`groundsense-${
            response.title?.toLowerCase().replace(/\s+/g, "-") || "report"
          }`}
        />
      </div>
    </Card>
  );
};

export default AIResponseRenderer;
