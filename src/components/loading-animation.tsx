'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  text?: string;
  className?: string;
}

export function LoadingAnimation({ text = "Loading...", className }: LoadingAnimationProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
       <div className="loading-wave h-10 flex items-center">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
       </div>
       {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );
}
