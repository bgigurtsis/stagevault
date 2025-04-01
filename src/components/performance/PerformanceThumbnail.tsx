
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
  // Make sure we have a valid string for patternSeed
  // Always prioritize using performanceId when available
  const patternSeed = performanceId ? `${title}-${performanceId}` : title || "default-pattern";

  // Select a pattern type to use
  const selectedPatternType = useMemo(() => {
    if (!patternType) {
      return "chevrons"; // Use a specific default instead of undefined
    }
    
    if (Array.isArray(patternType)) {
      // If it's an array, use a deterministic selection based on patternSeed
      const combinedHash = patternSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return patternType[combinedHash % patternType.length];
    }
    
    // If it's a single pattern type, use it
    return patternType;
  }, [patternType, patternSeed]);

  // Generate a fixed color with variations based on the seed
  const getColorVariation = () => {
    // Use a default string if patternSeed is somehow empty
    const seed = patternSeed || "default-seed";
    const idHash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use predefined color values instead of dynamic HSL to avoid color parsing issues
    const baseOrangeColors = [
      "#f97316", // orange-500
      "#f59e0b", // amber-500
      "#ea580c", // orange-600
      "#d97706", // amber-600
      "#fb923c", // orange-400
      "#fbbf24"  // amber-400
    ];
    
    // Use the hash to select a predefined color
    return baseOrangeColors[idHash % baseOrangeColors.length];
  };
  
  // Generate background with strong error handling
  const backgroundImage = useMemo(() => {
    try {
      // Use explicit color and pattern type to avoid issues
      const color = getColorVariation();
      const pattern = GeoPattern.generate(patternSeed, {
        baseColor: color,
        generator: selectedPatternType
      });
      return pattern.toDataUrl();
    } catch (error) {
      console.error('Error generating pattern:', error);
      // Fallback to a simple gradient that doesn't rely on the library
      return `linear-gradient(135deg, #f59e0b, #f97316)`;
    }
  }, [patternSeed, selectedPatternType]);
  
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
