import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DistrictData {
  district_name: string;
  state_name: string;
  year: string;
  total_blocks: number;
  safe_blocks: number;
  semi_critical_blocks: number;
  critical_blocks: number;
  over_exploited_blocks: number;
  avg_stage: number;
  total_rainfall: number;
  total_recharge: number;
  total_extraction: number;
}

export default function DistrictOverview() {
  const { districtId } = useParams<{ districtId: string }>();
  const navigate = useNavigate();
  const [districtData, setDistrictData] = useState<DistrictData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistrictData = async () => {
      try {
        setLoading(true);
        // Fetch district data from backend
        const response = await fetch(
          `http://localhost:8080/api/districts/${districtId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch district data");
        }
        const data = await response.json();
        setDistrictData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (districtId) {
      fetchDistrictData();
    }
  }, [districtId]);

  const getCategoryColor = (count: number, total: number) => {
    const percentage = (count / total) * 100;
    if (percentage > 50) return "text-red-600";
    if (percentage > 25) return "text-orange-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !districtData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || "District data not found"}</p>
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
                {districtData.district_name} District
              </h1>
              <p className="text-slate-600">{districtData.state_name}</p>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
              {districtData.total_blocks} Blocks
            </Badge>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Average Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">
                {districtData.avg_stage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Rainfall
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {districtData.total_rainfall.toFixed(0)} mm
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
                {districtData.total_recharge.toFixed(2)} MCM
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
                {districtData.total_extraction.toFixed(2)} MCM
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Block Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Block Distribution by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Safe Blocks</span>
                    <span className="font-semibold text-green-600">
                      {districtData.safe_blocks}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (districtData.safe_blocks /
                            districtData.total_blocks) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Semi-Critical Blocks</span>
                    <span className="font-semibold text-yellow-600">
                      {districtData.semi_critical_blocks}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (districtData.semi_critical_blocks /
                            districtData.total_blocks) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Critical Blocks</span>
                    <span className="font-semibold text-orange-600">
                      {districtData.critical_blocks}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (districtData.critical_blocks /
                            districtData.total_blocks) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">
                      Over-Exploited Blocks
                    </span>
                    <span className="font-semibold text-red-600">
                      {districtData.over_exploited_blocks}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (districtData.over_exploited_blocks /
                            districtData.total_blocks) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Total Blocks</span>
                  <span className="text-xl font-bold text-purple-600">
                    {districtData.total_blocks}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Assessment Year</span>
                  <span className="text-xl font-bold text-slate-700">
                    {districtData.year}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Extraction Rate</span>
                  <span
                    className={`text-xl font-bold ${getCategoryColor(
                      districtData.critical_blocks +
                        districtData.over_exploited_blocks,
                      districtData.total_blocks
                    )}`}
                  >
                    {(
                      (districtData.total_extraction /
                        districtData.total_recharge) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-600 mb-2">
                    Critical/Over-Exploited Ratio
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${
                            ((districtData.critical_blocks +
                              districtData.over_exploited_blocks) /
                              districtData.total_blocks) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(
                        ((districtData.critical_blocks +
                          districtData.over_exploited_blocks) /
                          districtData.total_blocks) *
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
                      input.value = `Show all blocks in ${districtData.district_name}`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                🗺️ List All Blocks
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
                      input.value = `Show critical blocks in ${districtData.district_name}`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                ⚠️ Critical Blocks
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
                      input.value = `Compare ${districtData.district_name} with other districts in ${districtData.state_name}`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                ⚖️ Compare Districts
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
                      input.value = `Show trend for ${districtData.district_name} district`;
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
                      input.value = `${districtData.state_name} state overview`;
                      input.focus();
                    }
                  }, 100);
                }}
              >
                🏛️ State Overview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
