
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
  title = "", // Provide default empty string for title
  className = "",
  performanceId,
  fallbackIcon = false,
  patternType
}) => {
  // Ensure both title and performanceId are strings or empty strings (never undefined)
  const safeTitle = title || "";
  const safePerformanceId = performanceId || "";
  
  // Create a valid pattern seed that will always be a string
  const patternSeed = safePerformanceId 
    ? `${safeTitle}-${safePerformanceId}` 
    : safeTitle || "default-pattern";

  // Select a pattern type to use
  const selectedPatternType = useMemo(() => {
    if (!patternType) {
      return "chevrons"; // Use a specific default
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
    // Define fixed colors to avoid any HSL parsing issues
    const baseOrangeColors = [
      "#f97316", // orange-500
      "#f59e0b", // amber-500
      "#ea580c", // orange-600
      "#d97706", // amber-600
      "#fb923c", // orange-400
      "#fbbf24"  // amber-400
    ];
    
    // Get a hash based on the pattern seed
    const idHash = patternSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use the hash to select a predefined color
    return baseOrangeColors[Math.abs(idHash) % baseOrangeColors.length];
  };
  
  // Generate background with robust error handling
  const backgroundImage = useMemo(() => {
    try {
      // Use explicit color and pattern type
      const color = getColorVariation();
      
      // Make sure we pass valid parameters
      if (!patternSeed || !color || !selectedPatternType) {
        throw new Error("Invalid pattern parameters");
      }
      
      const pattern = GeoPattern.generate(patternSeed, {
        baseColor: color,
        generator: selectedPatternType
      });
      return pattern.toDataUrl();
    } catch (error) {
      console.error('Error generating pattern:', error);
      // Fallback to a simple gradient
      return `linear-gradient(135deg, #f59e0b, #f97316)`;
    }
  }, [patternSeed, selectedPatternType]);
  
  return (
    <div 
      className={cn(
        "aspect-video bg-muted flex items-center justify-center relative overflow-hidden",
        className
      )}
      aria-label={`Thumbnail for ${safeTitle}`}
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
