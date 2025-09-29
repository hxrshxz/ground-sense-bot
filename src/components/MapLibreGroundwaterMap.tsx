"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Map, { Marker, Popup, Source, Layer } from "react-map-gl/maplibre";
import type { MapRef, MarkerEvent } from "react-map-gl/maplibre";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { groundwaterDB, BlockData } from "../data/groundWaterData";
import {
  Play,
  Pause,
  Info,
  Layers,
  Settings,
  Mountain,
  Map as MapIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Import MapLibre CSS
import "maplibre-gl/dist/maplibre-gl.css";

interface DistrictData {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  data: BlockData;
  color: string;
  elevation: number;
}

interface GroundwaterMapProps {
  className?: string;
  height?: string;
}

const MapLibreGroundwaterMap: React.FC<GroundwaterMapProps> = ({
  className = "",
  height = "600px",
}) => {
  const mapRef = useRef<MapRef>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(
    null
  );
  const [currentYear, setCurrentYear] = useState(2024);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  const [mapStyle, setMapStyle] = useState("openstreetmap");
  const [showPopup, setShowPopup] = useState(false);

  // Convert groundwater data to map-ready format
  const districtData: DistrictData[] = useMemo(() => {
    const coordinatesMap: { [key: string]: [number, number] } = {
      // Major Indian cities/districts coordinates [longitude, latitude]
      delhi: [77.1025, 28.7041],
      chaksu: [75.9474, 26.6011], // Jaipur district
      ludhiana: [75.8573, 30.901],
      amritsar: [74.8723, 31.634],
      jalandhar: [75.5762, 31.326],
      bhopal: [77.4126, 23.2599],
      indore: [75.8577, 22.7196],
      gwalior: [78.1828, 26.2124],
      jodhpur: [73.0243, 26.2389],
      bikaner: [73.3119, 28.0229],
      udaipur: [73.7125, 24.5854],
      kota: [75.8648, 25.2138],
      nagpur: [79.0882, 21.1458],
      pune: [73.8567, 18.5204],
      mumbai: [72.8777, 19.076],
      ahmedabad: [72.5714, 23.0225],
      surat: [72.8311, 21.1702],
      vadodara: [73.2084, 22.3072],
      rajkot: [70.8022, 22.3039],
    };

    return Object.entries(groundwaterDB)
      .filter(([_, data]) => data.type === "Block")
      .map(([key, data]) => {
        const blockData = data as BlockData;
        const coords = coordinatesMap[key.toLowerCase()] || [77.1025, 28.7041];

        // Color based on category
        const getColor = (category: string) => {
          switch (category) {
            case "Over-Exploited":
              return "#dc2626";
            case "Critical":
              return "#ea580c";
            case "Semi-Critical":
              return "#d97706";
            case "Safe":
              return "#16a34a";
            default:
              return "#6b7280";
          }
        };

        // Elevation for 3D effect based on extraction stage
        const extractionStage = parseInt(
          blockData.stage?.replace("%", "") || "0"
        );
        const elevation = Math.max(0, (extractionStage - 50) * 100);

        return {
          name: `${blockData.block || key} (${blockData.district})`,
          coordinates: coords,
          data: blockData,
          color: getColor(blockData.category || "Safe"),
          elevation,
        };
      });
  }, []);

  // Completely free map styles using open tile servers
  const mapStyles = {
    openstreetmap: {
      version: 8 as const,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm-layer",
          type: "raster",
          source: "osm",
        },
      ],
    } as const,
    satellite: {
      version: 8 as const,
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri",
        },
      },
      layers: [
        {
          id: "esri-satellite-layer",
          type: "raster",
          source: "esri-satellite",
        },
      ],
    } as const,
    terrain: {
      version: 8 as const,
      sources: {
        "esri-terrain": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "© Esri",
        },
      },
      layers: [
        {
          id: "esri-terrain-layer",
          type: "raster",
          source: "esri-terrain",
        },
      ],
    } as const,
    dark: {
      version: 8 as const,
      sources: {
        "carto-dark": {
          type: "raster",
          tiles: [
            "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "© CartoDB © OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "carto-dark-layer",
          type: "raster",
          source: "carto-dark",
        },
      ],
    } as const,
    positron: {
      version: 8 as const,
      sources: {
        "carto-light": {
          type: "raster",
          tiles: [
            "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution: "© CartoDB © OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "carto-light-layer",
          type: "raster",
          source: "carto-light",
        },
      ],
    } as const,
  };

  // Time series animation
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentYear((prev) => {
        if (prev >= 2024) {
          setIsPlaying(false);
          return 2020;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // 3D/2D view toggle
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.easeTo({
        pitch: viewMode === "3d" ? 60 : 0,
        bearing: viewMode === "3d" ? -17.6 : 0,
        duration: 1000,
      });
    }
  }, [viewMode]);

  // Generate GeoJSON for circle layers
  const circleLayerData = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features: districtData.map((district) => ({
        type: "Feature" as const,
        properties: {
          name: district.name,
          category: district.data.category,
          color: district.color,
          extraction: district.data.extraction?.total || 0,
          recharge: district.data.recharge?.total || 0,
          stage: district.data.stage,
          elevation: district.elevation,
        },
        geometry: {
          type: "Point" as const,
          coordinates: district.coordinates,
        },
      })),
    };
  }, [districtData, currentYear]);

  // Chart data generation
  const getChartData = (district: DistrictData) => {
    const trendData =
      district.data.trend?.map((value, index) => ({
        year: 2020 + index,
        stage: value,
        extraction: district.data.extraction?.total || 0,
        recharge: district.data.recharge?.total || 0,
      })) || [];

    const sectorData = [
      {
        name: "Irrigation",
        value: district.data.extraction?.irrigation || 0,
        color: "#3b82f6",
      },
      {
        name: "Domestic",
        value: district.data.extraction?.domestic || 0,
        color: "#10b981",
      },
      {
        name: "Industry",
        value: district.data.extraction?.industry || 0,
        color: "#f59e0b",
      },
    ];

    return { trendData, sectorData };
  };

  const PopupContent = ({ district }: { district: DistrictData }) => {
    const { trendData, sectorData } = getChartData(district);

    return (
      <Card className="w-96 max-h-96 overflow-y-auto">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{district.data.block}</CardTitle>
              <p className="text-sm text-slate-500">
                {district.data.district}, {district.data.state}
              </p>
            </div>
            <Badge
              className={`${
                district.data.category === "Over-Exploited"
                  ? "bg-red-100 text-red-800"
                  : district.data.category === "Critical"
                  ? "bg-orange-100 text-orange-800"
                  : district.data.category === "Semi-Critical"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {district.data.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-xs text-slate-500">Extraction</p>
              <p className="text-sm font-bold">
                {district.data.extraction?.total?.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-xs text-slate-500">Recharge</p>
              <p className="text-sm font-bold">
                {district.data.recharge?.total?.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">5-Year Trend</h4>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={trendData}>
                <XAxis dataKey="year" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="stage"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Usage by Sector</h4>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 78.9629,
            latitude: 23.5937,
            zoom: 4.5,
            pitch: viewMode === "3d" ? 60 : 0,
            bearing: viewMode === "3d" ? -17.6 : 0,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyles[mapStyle as keyof typeof mapStyles] as any}
          terrain={
            viewMode === "3d"
              ? { source: "maplibre-dem", exaggeration: 1.5 }
              : undefined
          }
        >
          {/* Circle Layer for Districts */}
          <Source id="districts" type="geojson" data={circleLayerData}>
            <Layer
              id="districts-circles"
              type="circle"
              paint={{
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["get", "extraction"],
                  0,
                  8,
                  200,
                  25,
                ],
                "circle-color": ["get", "color"],
                "circle-opacity": 0.8,
                "circle-stroke-width": 2,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-opacity": 0.8,
              }}
            />

            {/* 3D Extrusion Layer */}
            {viewMode === "3d" && (
              <Layer
                id="districts-extrusion"
                type="fill-extrusion"
                paint={{
                  "fill-extrusion-color": ["get", "color"],
                  "fill-extrusion-height": [
                    "interpolate",
                    ["linear"],
                    ["get", "elevation"],
                    0,
                    0,
                    5000,
                    5000,
                  ],
                  "fill-extrusion-base": 0,
                  "fill-extrusion-opacity": 0.6,
                }}
              />
            )}
          </Source>

          {/* Individual Markers for Click Events */}
          {districtData.map((district, index) => (
            <Marker
              key={index}
              longitude={district.coordinates[0]}
              latitude={district.coordinates[1]}
              onClick={() => {
                setSelectedDistrict(district);
                setShowPopup(true);
              }}
            >
              <div
                className="w-6 h-6 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: district.color }}
              />
            </Marker>
          ))}
        </Map>
      </div>

      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4 space-y-4">
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === "2d" ? "default" : "outline"}
                onClick={() => setViewMode("2d")}
              >
                <MapIcon className="h-4 w-4 mr-1" />
                2D
              </Button>
              <Button
                size="sm"
                variant={viewMode === "3d" ? "default" : "outline"}
                onClick={() => setViewMode("3d")}
              >
                <Mountain className="h-4 w-4 mr-1" />
                3D
              </Button>
            </div>

            {/* Map Style Selection */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-600">
                Map Style
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {Object.keys(mapStyles).map((style) => (
                  <Button
                    key={style}
                    size="sm"
                    variant={mapStyle === style ? "default" : "outline"}
                    onClick={() => setMapStyle(style)}
                    className="text-xs"
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Series Controls */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-600">
                Time Series
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm font-medium">{currentYear}</span>
              </div>
              <Slider
                value={[currentYear]}
                onValueChange={(value) => setCurrentYear(value[0])}
                min={2020}
                max={2024}
                step={1}
                className="w-32"
              />
            </div>

            {/* Legend */}
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-slate-600">
                Categories
              </h4>
              <div className="space-y-1">
                {["Over-Exploited", "Critical", "Semi-Critical", "Safe"].map(
                  (category) => (
                    <div key={category} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            category === "Over-Exploited"
                              ? "#dc2626"
                              : category === "Critical"
                              ? "#ea580c"
                              : category === "Semi-Critical"
                              ? "#d97706"
                              : "#16a34a",
                        }}
                      />
                      <span className="text-xs">{category}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Panel */}
      <div className="absolute top-4 right-4 z-10">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="bg-white/90 backdrop-blur-sm"
            >
              <Info className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-semibold">
                MapLibre GL JS - Premium Free Map
              </h4>
              <p className="text-sm text-slate-600">
                • WebGL-powered smooth rendering
              </p>
              <p className="text-sm text-slate-600">
                • Vector tiles for crisp visuals
              </p>
              <p className="text-sm text-slate-600">
                • 3D terrain and extrusion support
              </p>
              <p className="text-sm text-slate-600">
                • Click districts for detailed analysis
              </p>
              <p className="text-sm text-slate-600">
                • Multiple free map styles
              </p>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-slate-500">
                  🚀 Powered by MapLibre GL JS - Open Source & Free!
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* District Details Popup */}
      <AnimatePresence>
        {showPopup && selectedDistrict && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-4 left-4 z-20"
          >
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="absolute -top-2 -right-2 z-30 bg-white rounded-full shadow-md h-6 w-6 p-0"
                onClick={() => setShowPopup(false)}
              >
                ×
              </Button>
              <PopupContent district={selectedDistrict} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview */}
      <div className="absolute bottom-4 right-4 z-10">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-500">Total Districts</p>
                <p className="text-sm font-bold">{districtData.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Over-Exploited</p>
                <p className="text-sm font-bold text-red-600">
                  {
                    districtData.filter(
                      (d) => d.data.category === "Over-Exploited"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapLibreGroundwaterMap;
