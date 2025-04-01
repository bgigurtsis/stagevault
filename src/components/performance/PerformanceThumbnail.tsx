
import React, { useMemo } from 'react';
import GeoPattern, { GeneratorType } from 'geopattern';
import { cn } from '@/lib/utils';

interface PerformanceThumbnailProps {
  title: string;
  className?: string;
  performanceId?: string;
  fallbackIcon?: boolean;
  patternType?: GeneratorType | GeneratorType[];
}

export const PerformanceThumbnail: React.FC<PerformanceThumbnailProps> = ({ 
  title, 
  className = "",
  performanceId,
  fallbackIcon = false,
  patternType
}) => {
  // Use consistent seed for pattern generation with both title and performanceId
  // This ensures the pattern remains consistent but unique to each performance
  const patternSeed = performanceId ? `${title}-${performanceId}` : title;

  // Select a pattern type to use
  const selectedPatternType = useMemo(() => {
    if (!patternType) {
      return undefined; // Let GeoPattern choose a default
    }
    
    if (Array.isArray(patternType)) {
      // If it's an array, use a deterministic selection based on patternSeed
      const combinedHash = patternSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return patternType[combinedHash % patternType.length];
    }
    
    // If it's a single pattern type, use it
    return patternType;
  }, [patternType, patternSeed]);

  // Generate a slightly different hue based on performanceId or title if no id is provided
  const getColorVariation = () => {
    // Use patternSeed which is safe since we made sure it's either title-performanceId or just title
    const idHash = patternSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Use the hash to create small variations in the orange base color
    // This keeps it in the orange family but with subtle differences
    const hueShift = (idHash % 40) - 20; // -20 to +19 shift
    return `hsl(${30 + hueShift}, 85%, 65%)`; // Base is around 30 (orange)
  };
  
  const pattern = GeoPattern.generate(patternSeed, {
    baseColor: getColorVariation(),
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
