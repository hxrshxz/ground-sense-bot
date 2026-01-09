import React from "react";

interface ChartDepthWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Simple static wrapper for charts with minimal government theme styling.
 */
export const ChartDepthWrapper: React.FC<ChartDepthWrapperProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="relative rounded border border-slate-200 bg-white overflow-hidden">
        <div className="relative p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartDepthWrapper;
