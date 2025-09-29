import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  mapAutomationClient,
  AutomationProgress,
} from "@/services/mapAutomationClient";
import {
  Play,
  Upload,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Image as ImageIcon,
  Download,
} from "lucide-react";

interface MapAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageAnalysis: (imageData: string) => void;
}

export const MapAnalysisDialog: React.FC<MapAnalysisDialogProps> = ({
  isOpen,
  onClose,
  onImageAnalysis,
}) => {
  const [currentStep, setCurrentStep] = useState<
    "initial" | "automating" | "completed" | "upload"
  >("initial");
  const [isAutomating, setIsAutomating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [automationResult, setAutomationResult] = useState<any>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartAutomation = async () => {
    setCurrentStep("automating");
    setIsAutomating(true);
    setError(null);
    setProgressMessages([]);

    const result = await mapAutomationClient.runAutomation(
      (progress: AutomationProgress) => {
        if (progress.type === "progress" && progress.message) {
          setProgressMessages((prev) => [...prev, progress.message!]);
        } else if (progress.type === "error" && progress.message) {
          setProgressMessages((prev) => [...prev, `❌ ${progress.message!}`]);
        }
      }
    );

    setIsAutomating(false);
    setAutomationResult(result);

    if (result.success) {
      // Check if we have base64 image data from Vercel
      if (result.downloadedImage || result.screenshot) {
        // Use the downloaded image if available, otherwise use screenshot
        const imageData = result.downloadedImage
          ? `data:image/png;base64,${result.downloadedImage}`
          : `data:image/png;base64,${result.screenshot}`;

        // Automatically trigger image analysis
        setProgressMessages((prev) => [
          ...prev,
          "📊 Analyzing image with AI...",
        ]);
        onImageAnalysis(imageData);

        // Close the dialog since analysis is done
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Traditional flow - show completed state for manual upload
        setCurrentStep("completed");
      }
    } else {
      setCurrentStep("initial");
    }
  };

  const handleProceedToUpload = () => {
    setCurrentStep("upload");
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUploadedImage(result);
          resolve(result);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const imageData = await handleImageUpload(file);
      onImageAnalysis(imageData);
      handleClose();
    } catch (error) {
      console.error("Image upload failed:", error);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setIsAutomating(false);
    setIsUploading(false);
    setAutomationResult(null);
    setUploadedImage(null);
    setError(null);
    setProgressMessages([]);
  };

  const handleClose = () => {
    reset();
    setCurrentStep("initial");
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "initial":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-100">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                INGRES Map Analysis
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                This will automatically navigate to the INGRES groundwater map,
                interact with the visualization, and download the current view
                for analysis.
              </p>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleStartAutomation}
                disabled={isAutomating}
                className="flex items-center gap-2"
              >
                {isAutomating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isAutomating ? "Starting..." : "Start Automation"}
              </Button>

              <Button
                variant="outline"
                onClick={handleProceedToUpload}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Skip to Upload
              </Button>
            </div>
          </motion.div>
        );

      case "automating":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Automating Map Interaction
              </h3>
              <p className="text-sm text-slate-600">
                Please wait while we navigate and interact with the INGRES
                map...
              </p>
            </div>

            <div className="space-y-3">
              <Progress value={isAutomating ? 65 : 100} className="w-full" />

              {progressMessages.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="text-xs text-slate-600 space-y-1">
                    {progressMessages.map((message, index) => (
                      <div key={index} className="font-mono">
                        {message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-xs text-slate-500 space-y-1">
                <div>✓ Opening INGRES portal</div>
                <div>✓ Loading map visualization</div>
                <div
                  className={isAutomating ? "text-blue-600" : "text-slate-500"}
                >
                  {isAutomating
                    ? "⟳ Interacting with map..."
                    : "✓ Map interaction complete"}
                </div>
                <div
                  className={isAutomating ? "text-slate-400" : "text-slate-500"}
                >
                  {isAutomating
                    ? "◦ Downloading image..."
                    : "✓ Image downloaded"}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case "completed":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Automation Completed!
              </h3>
              <p className="text-sm text-slate-600">
                Successfully captured the INGRES map data. You can now proceed
                to upload an image for analysis.
              </p>
            </div>

            {automationResult?.screenshot && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Preview of captured map:
                </p>
                <div className="max-w-sm mx-auto rounded-lg overflow-hidden border">
                  <img
                    src={automationResult.screenshot}
                    alt="Captured map"
                    className="w-full h-32 object-cover"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleProceedToUpload}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Proceed to Image Upload
            </Button>
          </motion.div>
        );

      case "upload":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-purple-100">
                <ImageIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Upload Map Image
              </h3>
              <p className="text-sm text-slate-600">
                Upload a groundwater map image for AI-powered analysis and
                insights.
              </p>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-purple-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-3">
                <div className="flex justify-center">
                  {isUploading ? (
                    <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
                  ) : (
                    <Upload className="h-12 w-12 text-slate-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {isUploading
                      ? "Processing image..."
                      : "Click to upload image"}
                  </p>
                  <p className="text-xs text-slate-500">
                    PNG, JPG, JPEG up to 10MB
                  </p>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />

            {uploadedImage && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">Uploaded image:</p>
                <div className="max-w-sm mx-auto rounded-lg overflow-hidden border">
                  <img
                    src={uploadedImage}
                    alt="Uploaded map"
                    className="w-full h-32 object-cover"
                  />
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Map Analysis</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <div key={currentStep} className="py-4">
            {renderStepContent()}
          </div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
