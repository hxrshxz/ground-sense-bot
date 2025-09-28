import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title
);

// Helper function to generate colors
const generateColors = (count: number, alpha = 1) => {
  const colors = [
    `rgba(255, 99, 132, ${alpha})`,
    `rgba(54, 162, 235, ${alpha})`,
    `rgba(255, 206, 86, ${alpha})`,
    `rgba(75, 192, 192, ${alpha})`,
    `rgba(153, 102, 255, ${alpha})`,
    `rgba(255, 159, 64, ${alpha})`,
    `rgba(199, 199, 199, ${alpha})`,
    `rgba(83, 102, 255, ${alpha})`,
    `rgba(78, 129, 139, ${alpha})`,
    `rgba(220, 76, 100, ${alpha})`,
  ];

  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

export const KeyStatsRenderer: React.FC<any> = ({ data }) => {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value], index) => (
            <div key={index} className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-500">{key}</p>
              <p className="text-xl font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const KeyMetricsBadgesRenderer: React.FC<any> = ({
  data,
}) => {
  const getVariantClasses = (variant?: string) => {
    switch (variant) {
      case "alert":
        return "bg-red-100 text-red-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 items-center">
          {data.map((metric, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${getVariantClasses(metric.variant)}`}
            >
              <span className="block text-xs">{metric.label}</span>
              <span className="text-lg font-bold">{metric.value}</span>
              {metric.change && (
                <span className="ml-1 text-xs">{metric.change}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const PieChartRenderer: React.FC<any> = ({
  title,
  data,
}) => {
  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: generateColors(data.length, 0.6),
        borderColor: generateColors(data.length),
        borderWidth: 1,
      },
    ],
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <Pie
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const LineChartRenderer: React.FC<any> = ({
  title,
  labels,
  data,
  yAxisLabel,
}) => {
  const datasets = Object.entries(data).map(([label, values], index) => {
    const color = generateColors(1, 0.6)[0];
    const borderColor = color.replace(/[^,]+(?=\))/, "1");

    return {
      label,
      data: values,
      borderColor,
      backgroundColor: color,
      tension: 0.3,
      fill: true,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  title: {
                    display: true,
                    text: yAxisLabel,
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const BarChartRenderer: React.FC<any> = ({
  title,
  labels,
  data,
  yAxisLabel,
}) => {
  const datasets = Object.entries(data).map(([label, values], index) => {
    return {
      label,
      data: values,
      backgroundColor: generateColors(labels.length, 0.6),
      borderColor: generateColors(labels.length),
      borderWidth: 1,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  title: {
                    display: true,
                    text: yAxisLabel,
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const TableRenderer: React.FC<any> = ({ headers, rows }) => {
  return (
    <Card className="w-full mb-4">
      <CardContent className="pt-4">
        <div className="overflow-x-auto">
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
      </CardContent>
    </Card>
  );
};

export const DualLineChartRenderer: React.FC<any> = ({
  title,
  labels,
  data,
  yAxisLabel,
}) => {
  // Similar to LineChartRenderer but with special handling for historical vs predicted data
  const datasets = Object.entries(data).map(([label, values], index) => {
    const colors = ["rgba(59, 130, 246, 0.6)", "rgba(239, 68, 68, 0.6)"];
    const borderColors = ["rgba(59, 130, 246, 1)", "rgba(239, 68, 68, 1)"];

    return {
      label,
      data: values,
      borderColor: borderColors[index % 2],
      backgroundColor: colors[index % 2],
      tension: 0.3,
      fill: false,
      pointRadius: label.includes("Predicted") ? 6 : 3,
      pointBackgroundColor: borderColors[index % 2],
      pointBorderColor: "white",
      pointBorderWidth: 2,
      borderWidth: label.includes("Predicted") ? 3 : 2,
      borderDash: label.includes("Predicted") ? [5, 5] : undefined,
    };
  });

  const chartData = {
    labels,
    datasets,
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  title: {
                    display: true,
                    text: yAxisLabel,
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const PredictionCardRenderer: React.FC<any> = ({
  data,
}) => {
  return (
    <Card className="w-full mb-4 border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-500" />
          Prediction Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value], index) => (
            <div
              key={index}
              className={`${
                index % 2 === 0 ? "bg-slate-50" : ""
              } p-2 rounded-md`}
            >
              <p className="text-sm text-slate-500">{key}</p>
              <p className="text-md font-semibold">{String(value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const DualAxisChartRenderer: React.FC<any> = ({
  title,
  labels,
  series,
}) => {
  // This is more complex and would typically need a more advanced charting library
  // For now, we'll use a simplified version
  const lineDatasets = series
    .filter((s) => s.type === "line")
    .map((s, i) => ({
      label: s.name,
      data: s.data,
      borderColor: "rgba(54, 162, 235, 1)",
      backgroundColor: "rgba(54, 162, 235, 0.2)",
      yAxisID: "y1",
      tension: 0.3,
      fill: false,
    }));

  const barDatasets = series
    .filter((s) => s.type === "bar")
    .map((s, i) => ({
      label: s.name,
      data: s.data,
      backgroundColor: "rgba(255, 99, 132, 0.6)",
      borderColor: "rgba(255, 99, 132, 1)",
      yAxisID: "y",
      borderWidth: 1,
    }));

  const chartData = {
    labels,
    datasets: [...barDatasets, ...lineDatasets],
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-60">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  type: "linear",
                  display: true,
                  position: "left",
                  title: {
                    display: true,
                    text: series.find((s) => s.yAxis === "left")?.name || "",
                  },
                },
                y1: {
                  type: "linear",
                  display: true,
                  position: "right",
                  grid: {
                    drawOnChartArea: false,
                  },
                  title: {
                    display: true,
                    text: series.find((s) => s.yAxis === "right")?.name || "",
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export const InsightCardRenderer: React.FC<any> = ({
  data,
}) => {
  return (
    <Card className="w-full mb-4 border-l-4 border-l-purple-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-purple-500" />
          Key Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value], index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700">{key}</p>
              <p className="text-md mt-1">{String(value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const CropListRenderer: React.FC<any> = ({
  title,
  data,
}) => {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((crop, index) => (
            <div
              key={index}
              className="bg-slate-50 p-3 rounded-lg border border-slate-200"
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-lg">{crop.name}</h4>
                <Badge
                  variant={
                    crop.waterRequirement.includes("Low")
                      ? "secondary"
                      : "default"
                  }
                >
                  {crop.waterRequirement}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">{crop.benefit}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const HotspotListRenderer: React.FC<any> = ({
  title,
  data,
}) => {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((hotspot, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 border-b border-slate-100"
            >
              <div className="font-medium">{hotspot.district}</div>
              <Badge variant="destructive">{hotspot.stage}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const AlertCardRenderer: React.FC<any> = ({ data }) => {
  return (
    <Card className="w-full mb-4 border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            {data.status}
          </CardTitle>
          <Badge variant="destructive">{data.status}</Badge>
        </div>
        <CardDescription className="mt-2 text-base font-medium">
          {data.message}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">{data.details}</p>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-amber-700">
                Recommended Action
              </span>
            </div>
            <p className="text-sm text-amber-700 mt-1">{data.action}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
