
import React, { useMemo } from 'react';
import GeoPattern, { GeneratorType } from 'geopattern';
import { cn } from '@/lib/utils';

interface PerformanceThumbnailProps {
  title: string;
  className?: string;
  fallbackIcon?: boolean;
  patternType?: GeneratorType | GeneratorType[];
}

export const PerformanceThumbnail: React.FC<PerformanceThumbnailProps> = ({ 
  title, 
  className = "",
  fallbackIcon = false,
  patternType
}) => {
  // Use consistent seed for pattern generation to ensure it doesn't change on refresh
  // We'll use just the title as the seed so it stays consistent
  const patternSeed = title;

  // Select a pattern type to use
  const selectedPatternType = useMemo(() => {
    if (!patternType) {
      return undefined; // Let GeoPattern choose a default
    }
    
    if (Array.isArray(patternType)) {
      // If it's an array, use a deterministic selection based on the title
      const titleHash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return patternType[titleHash % patternType.length];
    }
    
    // If it's a single pattern type, use it
    return patternType;
  }, [patternType, title]);

  // Generate pattern using just the title as seed, instead of random elements
  const pattern = GeoPattern.generate(patternSeed, {
    baseColor: '#9b87f5',
    generator: selectedPatternType
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
