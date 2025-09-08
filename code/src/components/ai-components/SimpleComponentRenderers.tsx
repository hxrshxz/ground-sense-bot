import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { BlockAssessmentCard } from "@/components/BlockAssessmentCardV2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AnimatedAIContent, AnimatedAIText } from "./AnimatedAIContent";
import {
  AIComponent,
  TextComponent,
  MarkdownComponent,
  TableComponent,
  LineChartComponent,
  BarChartComponent,
  PieChartComponent,
  AlertComponent,
  ButtonComponent,
  AssessmentCardComponent,
  CardComponent,
  CollapsibleComponent,
  ComponentType,
} from "@/types/ai-response-v2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Simple Component Renderers for testing
export const SimpleTextRenderer = ({
  content,
  title,
}: {
  content: string;
  title?: string;
}) => (
  <div>
    {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
    <AnimatedAIText text={content} />
  </div>
);

export const SimpleMarkdownRenderer = ({
  content,
  title,
}: {
  content: string;
  title?: string;
}) => (
  <div>
    {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
    <AnimatedAIContent content={content} />
  </div>
);

export const SimpleTableRenderer = ({
  headers,
  rows,
  title,
}: {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}) => (
  <div>
    {title && <h3 className="text-xl font-semibold mb-2">{title}</h3>}
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <TableCell key={cellIndex}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export const SimpleLineChartRenderer = ({
  labels,
  datasets,
  title,
}: {
  labels: string[];
  datasets: any[];
  title?: string;
}) => (
  <div className="w-full">
    {title && <h3 className="text-xl font-semibold mb-3">{title}</h3>}
    <div className="h-[400px] p-4 bg-white/80 rounded-xl shadow-md border border-gray-100">
      <Line
        data={{
          labels,
          datasets: datasets.map((dataset) => ({
            ...dataset,
            fill: true,
            pointBackgroundColor:
              dataset.borderColor || "rgba(59, 130, 246, 1)",
            pointBorderColor: "#fff",
            pointHoverRadius: 6,
            pointHoverBackgroundColor:
              dataset.borderColor || "rgba(59, 130, 246, 1)",
            pointHoverBorderColor: "#fff",
            pointHoverBorderWidth: 2,
            tension: 0.4,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            tooltip: {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              titleColor: "#111827",
              bodyColor: "#374151",
              borderColor: "rgba(210, 210, 210, 0.5)",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                weight: "bold",
                size: 14,
              },
              bodyFont: {
                size: 13,
              },
              displayColors: true,
              boxPadding: 4,
            },
          },
          scales: {
            x: {
              grid: {
                color: "rgba(226, 232, 240, 0.6)",
              },
              border: {
                display: false,
              },
              ticks: {
                padding: 10,
                font: {
                  size: 11,
                },
              },
            },
            y: {
              grid: {
                color: "rgba(226, 232, 240, 0.6)",
              },
              border: {
                display: false,
              },
              ticks: {
                padding: 10,
                font: {
                  size: 11,
                },
              },
            },
          },
        }}
      />
    </div>
  </div>
);

export const SimpleBarChartRenderer = ({
  labels,
  datasets,
  title,
}: {
  labels: string[];
  datasets: any[];
  title?: string;
}) => (
  <div className="w-full">
    {title && <h3 className="text-xl font-semibold mb-3">{title}</h3>}
    <div className="h-[400px] p-4 bg-white/80 rounded-xl shadow-md border border-gray-100">
      <Bar
        data={{
          labels,
          datasets: datasets.map((dataset) => ({
            ...dataset,
            borderWidth: 2,
            borderRadius: 6,
            hoverBorderWidth: 3,
            hoverBorderColor: dataset.borderColor || dataset.backgroundColor,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            tooltip: {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              titleColor: "#111827",
              bodyColor: "#374151",
              borderColor: "rgba(210, 210, 210, 0.5)",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                weight: "bold",
                size: 14,
              },
              bodyFont: {
                size: 13,
              },
              displayColors: true,
              boxPadding: 4,
            },
          },
          scales: {
            x: {
              grid: {
                color: "rgba(226, 232, 240, 0.6)",
              },
              border: {
                display: false,
              },
              ticks: {
                padding: 10,
                font: {
                  size: 11,
                },
              },
            },
            y: {
              grid: {
                color: "rgba(226, 232, 240, 0.6)",
              },
              border: {
                display: false,
              },
              ticks: {
                padding: 10,
                font: {
                  size: 11,
                },
              },
            },
          },
        }}
      />
    </div>
  </div>
);

export const SimplePieChartRenderer = ({
  labels,
  datasets,
  title,
}: {
  labels: string[];
  datasets: any[];
  title?: string;
}) => (
  <div className="w-full">
    {title && <h3 className="text-xl font-semibold mb-3">{title}</h3>}
    <div className="h-[400px] p-4 bg-white/80 rounded-xl shadow-md border border-gray-100">
      <Pie
        data={{
          labels,
          datasets: datasets.map((dataset) => ({
            ...dataset,
            borderWidth: 2,
            hoverBorderWidth: 4,
            hoverBorderColor: "#ffffff",
            hoverOffset: 10,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: "bold",
                },
              },
            },
            tooltip: {
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              titleColor: "#111827",
              bodyColor: "#374151",
              borderColor: "rgba(210, 210, 210, 0.5)",
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                weight: "bold",
                size: 14,
              },
              bodyFont: {
                size: 13,
              },
              displayColors: true,
              boxPadding: 4,
              callbacks: {
                label: function (context) {
                  const label = context.label || "";
                  const value = context.raw || 0;
                  return ` ${label}: ${value}%`;
                },
              },
            },
          },
        }}
      />
    </div>
  </div>
);

export const SimpleAlertRenderer = ({
  content,
  alertType,
  title,
}: {
  content: string;
  alertType: "info" | "warning" | "success" | "error";
  title?: string;
}) => (
  <Alert variant={alertType as any}>
    {title && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription>
      <AnimatedAIText text={content} />
    </AlertDescription>
  </Alert>
);

export const SimpleButtonRenderer = ({
  label,
  action,
  actionData,
}: {
  label: string;
  action: string;
  actionData?: string;
}) => (
  <Button
    onClick={() => console.log(`Button clicked: ${action}, ${actionData}`)}
  >
    {label}
  </Button>
);

export const SimpleCardRenderer = ({
  content,
  title,
}: {
  content: AIComponent[];
  title?: string;
}) => (
  <Card>
    {title && (
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
    )}
    <CardContent>
      {content.map((component) => (
        <SimpleComponentRenderer key={component.id} component={component} />
      ))}
    </CardContent>
  </Card>
);

// Main component renderer that selects the appropriate renderer based on component type
export const SimpleComponentRenderer = ({
  component,
}: {
  component: AIComponent;
}) => {
  switch (component.type) {
    case ComponentType.TEXT:
      return (
        <SimpleTextRenderer
          content={(component as TextComponent).content}
          title={component.title}
        />
      );
    case ComponentType.MARKDOWN:
      return (
        <SimpleMarkdownRenderer
          content={(component as MarkdownComponent).content}
          title={component.title}
        />
      );
    case ComponentType.TABLE:
      return (
        <SimpleTableRenderer
          headers={(component as TableComponent).headers}
          rows={(component as TableComponent).rows}
          title={component.title}
        />
      );
    case ComponentType.LINE_CHART:
      return (
        <SimpleLineChartRenderer
          labels={(component as LineChartComponent).labels}
          datasets={(component as LineChartComponent).datasets}
          title={component.title}
        />
      );
    case ComponentType.BAR_CHART:
      return (
        <SimpleBarChartRenderer
          labels={(component as BarChartComponent).labels}
          datasets={(component as BarChartComponent).datasets}
          title={component.title}
        />
      );
    case ComponentType.PIE_CHART:
      return (
        <SimplePieChartRenderer
          labels={(component as PieChartComponent).labels}
          datasets={(component as PieChartComponent).datasets}
          title={component.title}
        />
      );
    case ComponentType.ALERT:
      return (
        <SimpleAlertRenderer
          content={(component as AlertComponent).content}
          alertType={(component as AlertComponent).alertType}
          title={component.title}
        />
      );
    case ComponentType.BUTTON:
      return (
        <SimpleButtonRenderer
          label={(component as ButtonComponent).label}
          action={(component as ButtonComponent).action}
          actionData={(component as ButtonComponent).actionData}
        />
      );
    case ComponentType.CARD:
      return (
        <SimpleCardRenderer
          content={(component as CardComponent).content}
          title={component.title}
        />
      );
    case ComponentType.ASSESSMENT_CARD:
      return (
        <BlockAssessmentCard
          title={component.title || ""}
          score={(component as AssessmentCardComponent).score}
          maxScore={(component as AssessmentCardComponent).maxScore}
          label={(component as AssessmentCardComponent).label}
          details={(component as AssessmentCardComponent).details}
        />
      );
    default:
      return <div>Unsupported component type: {component.type}</div>;
  }
};
