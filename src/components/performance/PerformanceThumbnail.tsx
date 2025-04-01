
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
  // Make sure we have a string for patternSeed
  // Always prioritize using performanceId when available
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

  // Generate a slightly different hue based on performanceId or title
  const getColorVariation = () => {
    // Make sure we use patternSeed which is guaranteed to be a string
    const idHash = patternSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    // Use the hash to create small variations in the orange base color
    // This keeps it in the orange family but with subtle differences
    const hueShift = (idHash % 40) - 20; // -20 to +19 shift
    return `hsl(${30 + hueShift}, 85%, 65%)`; // Base is around 30 (orange)
  };
  
  // Try-catch block to handle any issues with pattern generation
  let backgroundImage = '';
  try {
    const pattern = GeoPattern.generate(patternSeed, {
      baseColor: getColorVariation(),
      generator: selectedPatternType
    });
    backgroundImage = pattern.toDataUrl();
  } catch (error) {
    console.error('Error generating pattern:', error);
    // Fallback to a simple gradient if pattern generation fails
    backgroundImage = `linear-gradient(135deg, #f59e0b, #f97316)`;
  }
  
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
          backgroundImage,
          backgroundSize: 'cover'
        }}
      />
    </div>
  );
};
