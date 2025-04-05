
import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  circle?: boolean;
}

export function LoadingSkeleton({ 
  className, 
  count = 1, 
  circle = false 
}: LoadingSkeletonProps) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div
            key={index}
            className={cn(
              "animate-pulse bg-muted rounded",
              circle ? "rounded-full" : "rounded-md",
              className
            )}
          />
        ))}
    </>
  );
}
