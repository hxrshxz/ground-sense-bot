import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FileText, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DownloadReportProps {
  targetRef: React.RefObject<HTMLElement>;
  fileName?: string;
  className?: string;
}

export const DownloadReport: React.FC<DownloadReportProps> = ({
  targetRef,
  fileName = "ground-sense-report",
  className = "",
}) => {
  const downloadAsPDF = async () => {
    if (!targetRef.current) return;

    try {
      // Show loading indicator
      const element = targetRef.current;

      // Add a class for printing
      element.classList.add("printing");

      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove printing class
      element.classList.remove("printing");

      const imgData = canvas.toDataURL("image/png");

      // Calculate PDF dimensions based on canvas aspect ratio
      const aspectRatio = canvas.width / canvas.height;
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = pdfWidth / aspectRatio;

      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${fileName}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const downloadAsImage = async () => {
    if (!targetRef.current) return;

    try {
      const element = targetRef.current;

      // Add a class for printing
      element.classList.add("printing");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove printing class
      element.classList.remove("printing");

      // Create a download link
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please try again.");
    }
  };

  const shareReport = async () => {
    if (!targetRef.current) return;

    try {
      const element = targetRef.current;

      // Add a class for printing
      element.classList.add("printing");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove printing class
      element.classList.remove("printing");

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error("Failed to create blob");
          return;
        }

        // Check if Web Share API is supported
        if (navigator.share) {
          try {
            const file = new File([blob], `${fileName}.png`, {
              type: "image/png",
            });
            await navigator.share({
              title: "GroundSense Report",
              text: "Check out this groundwater report from GroundSense",
              files: [file],
            });
          } catch (error) {
            console.error("Error sharing:", error);
            // Fallback to download if sharing fails
            downloadAsImage();
          }
        } else {
          // Fallback for browsers that don't support sharing
          downloadAsImage();
        }
      }, "image/png");
    } catch (error) {
      console.error("Error preparing image for sharing:", error);
    }
  };

  return (
    <div className={`download-options ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={downloadAsPDF} className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            <span>Download as PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={downloadAsImage}
            className="cursor-pointer"
          >
            <FileImage className="h-4 w-4 mr-2" />
            <span>Download as Image</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareReport} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2" />
            <span>Share Report</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
