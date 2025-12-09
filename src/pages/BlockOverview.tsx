import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlockData {
  block_name: string;
  district_name: string;
  state_name: string;
  year: string;
  category: string;
  stage: number;
  rainfall: number;
  total_recharge: number;
  total_extraction: number;
  total_extractable: number;
  total_discharge: number;
  availability: number;
}

export default function BlockOverview() {
  const { blockId } = useParams<{ blockId: string }>();
  const navigate = useNavigate();
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        setLoading(true);
        // Fetch block data from backend
        const response = await fetch(
          `http://localhost:8080/api/blocks/${blockId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch block data");
        }
        const data = await response.json();
        setBlockData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (blockId) {
      fetchBlockData();
    }
  }, [blockId]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Over-Exploited":
        return "bg-red-100 text-red-800 border-red-300";
      case "Critical":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Semi-Critical":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Safe":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !blockData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || "Block data not found"}</p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {blockData.block_name}
              </h1>
              <p className="text-slate-600">
                {blockData.district_name}, {blockData.state_name}
              </p>
            </div>
            <Badge className={getCategoryColor(blockData.category)}>
              {blockData.category}
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Stage of Extraction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {blockData.stage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Rainfall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {blockData.rainfall.toFixed(0)} mm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Recharge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {blockData.total_recharge.toFixed(2)} MCM
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Extraction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {blockData.total_extraction.toFixed(2)} MCM
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Additional Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Extractable</span>
                  <span className="font-semibold">
                    {blockData.total_extractable.toFixed(2)} MCM
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Total Discharge</span>
                  <span className="font-semibold">
                    {blockData.total_discharge.toFixed(2)} MCM
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Availability</span>
                  <span className="font-semibold">
                    {blockData.availability.toFixed(2)} MCM
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Assessment Year</span>
                  <span className="font-semibold">{blockData.year}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Category</p>
                  <Badge className={getCategoryColor(blockData.category)}>
                    {blockData.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">
                    Extraction vs Recharge
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(
                            (blockData.total_extraction /
                              blockData.total_recharge) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(
                        (blockData.total_extraction /
                          blockData.total_recharge) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Follow-up Queries */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">🔍 Explore More</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    const input = document.querySelector(
                      'textarea[placeholder*="Ask"]'
                    ) as HTMLTextAreaElement;
                    if (input) {
                      input.value = `Show trend for ${blockData.block_name} over the years`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                📈 View Trends
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    const input = document.querySelector(
                      'textarea[placeholder*="Ask"]'
                    ) as HTMLTextAreaElement;
                    if (input) {
                      input.value = `Compare ${blockData.block_name} with other blocks in ${blockData.district_name}`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                ⚖️ Compare with Others
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    const input = document.querySelector(
                      'textarea[placeholder*="Ask"]'
                    ) as HTMLTextAreaElement;
                    if (input) {
                      input.value = `Show all blocks in ${blockData.district_name} district`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                🗺️ All District Blocks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    const input = document.querySelector(
                      'textarea[placeholder*="Ask"]'
                    ) as HTMLTextAreaElement;
                    if (input) {
                      input.value = `Show ${blockData.category.toLowerCase()} blocks in ${
                        blockData.state_name
                      }`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                📊 Similar Category Blocks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    const input = document.querySelector(
                      'textarea[placeholder*="Ask"]'
                    ) as HTMLTextAreaElement;
                    if (input) {
                      input.value = `${blockData.district_name} district overview`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                🏘️ District Overview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
