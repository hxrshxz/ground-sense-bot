import { useState, useCallback } from "react";
import {
  mapAutomationService,
  type MapAutomationResult,
} from "../services/mapAutomationService";

export interface MapAnalysisState {
  isAutomating: boolean;
  isUploading: boolean;
  automationResult: MapAutomationResult | null;
  uploadedImage: string | null;
  error: string | null;
}

export const useMapAnalysis = () => {
  const [state, setState] = useState<MapAnalysisState>({
    isAutomating: false,
    isUploading: false,
    automationResult: null,
    uploadedImage: null,
    error: null,
  });

  const runAutomation = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isAutomating: true,
      error: null,
      automationResult: null,
    }));

    try {
      console.log("Starting map automation...");
      const result = await mapAutomationService.runMapAutomation();

      setState((prev) => ({
        ...prev,
        isAutomating: false,
        automationResult: result,
        error: result.success ? null : result.error || "Automation failed",
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setState((prev) => ({
        ...prev,
        isAutomating: false,
        error: errorMessage,
      }));

      return { success: false, error: errorMessage };
    }
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    setState((prev) => ({ ...prev, isUploading: true, error: null }));

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadedImage: result,
        }));
        resolve(result);
      };

      reader.onerror = () => {
        const error = "Failed to read image file";
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error,
        }));
        reject(new Error(error));
      };

      reader.readAsDataURL(file);
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      isAutomating: false,
      isUploading: false,
      automationResult: null,
      uploadedImage: null,
      error: null,
    });
  }, []);

  const cleanup = useCallback(async () => {
    await mapAutomationService.cleanup();
  }, []);

  return {
    ...state,
    runAutomation,
    handleImageUpload,
    reset,
    cleanup,
  };
};
