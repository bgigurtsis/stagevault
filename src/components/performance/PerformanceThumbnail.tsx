
import React from 'react';
import GeoPattern from 'geopattern';
import { cn } from '@/lib/utils';

interface PerformanceThumbnailProps {
  title: string;
  className?: string;
  fallbackIcon?: boolean;
}

export const PerformanceThumbnail: React.FC<PerformanceThumbnailProps> = ({ 
  title, 
  className = "",
  fallbackIcon = false // Changed default to false
}) => {
  // Generate pattern based on the performance title
  const pattern = GeoPattern.generate(title, {
    baseColor: '#9b87f5' // Using a purple base color that matches the app theme
  });
  
  return (
    <div 
      className={cn(
        "aspect-video bg-muted flex items-center justify-center relative overflow-hidden",
        className
      )}
      aria-label={`Thumbnail for ${title}`}
    >
      <div 
        className="absolute inset-0 w-full h-full"
        style={{ 
          backgroundImage: pattern.toDataUrl(),
          backgroundSize: 'cover'
        }}
      />
    </div>
  );
};
