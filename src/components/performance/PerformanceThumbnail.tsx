
import React from 'react';
import GeoPattern from 'geopattern';
import { Theater } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceThumbnailProps {
  title: string;
  className?: string;
  fallbackIcon?: boolean;
}

export const PerformanceThumbnail: React.FC<PerformanceThumbnailProps> = ({ 
  title, 
  className = "",
  fallbackIcon = true 
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
      
      {fallbackIcon && (
        <Theater className="h-12 w-12 text-muted-foreground/50 absolute" />
      )}
    </div>
  );
};
