
import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative w-8 h-8 mr-2">
        <div className="absolute inset-0 bg-white rounded-full border-2 border-pokemon-red transform -translate-y-1/2"></div>
        <div className="absolute inset-0 bg-pokemon-red rounded-full border-2 border-pokemon-red transform translate-y-1/2"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full border-2 border-pokemon-red"></div>
        </div>
      </div>
      <span className="font-bold text-lg">Poké Tournament</span>
    </div>
  );
}
