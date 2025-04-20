
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
  title = "", 
  className = "",
  performanceId = "",
  fallbackIcon = false,
  patternType
}) => {
  // Ensure safe strings for all inputs
  const safeTitle = (typeof title === 'string') ? title : "";
  const safePerformanceId = (typeof performanceId === 'string') ? performanceId : "";
  
  // Create a valid pattern seed that will always be a string
  const patternSeed = useMemo(() => {
    try {
      if (safePerformanceId.length > 0) {
        return `${safeTitle}-${safePerformanceId}`;
      }
      return safeTitle.length > 0 ? safeTitle : "default-pattern";
    } catch (error) {
      console.error("Error creating pattern seed:", error);
      return "default-pattern";
    }
  }, [safeTitle, safePerformanceId]);

  // Select a pattern type to use
  const selectedPatternType = useMemo(() => {
    try {
      if (!patternType) {
        return "chevrons"; // Use a specific default
      }
      
      if (Array.isArray(patternType)) {
        // If it's an array, use a deterministic selection based on patternSeed
        if (patternType.length === 0) return "chevrons";
        
        const combinedHash = Array.from(patternSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return patternType[Math.abs(combinedHash) % patternType.length];
      }
      
      // If it's a single pattern type, use it
      return patternType;
    } catch (error) {
      console.error("Error selecting pattern type:", error);
      return "chevrons";
    }
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
    
    try {
      // Get a hash based on the pattern seed
      if (!patternSeed || typeof patternSeed !== 'string' || patternSeed.length === 0) {
        return baseOrangeColors[0];
      }
      
      const idHash = Array.from(patternSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
      
      // Use the hash to select a predefined color
      return baseOrangeColors[Math.abs(idHash) % baseOrangeColors.length];
    } catch (error) {
      console.error('Error getting color variation:', error);
      // Return a default color if anything goes wrong
      return "#f97316";
    }
  };
  
  // Generate background with robust error handling
  const backgroundImage = useMemo(() => {
    try {
      // Use explicit color and pattern type
      const color = getColorVariation();
      
      // Make sure we have valid parameters
      if (!patternSeed || !color || !selectedPatternType) {
        throw new Error("Invalid pattern parameters");
      }
      
      // Double-check that all inputs are strings
      if (typeof patternSeed !== 'string' || typeof color !== 'string' || 
          typeof selectedPatternType !== 'string') {
        throw new Error("Pattern parameters must be strings");
      }
      
      try {
        const pattern = GeoPattern.generate(patternSeed, {
          baseColor: color,
          generator: selectedPatternType
        });
        return pattern.toDataUrl();
      } catch (geoError) {
        console.error('GeoPattern generation error:', geoError);
        throw geoError;
      }
    } catch (error) {
      console.error('Error generating pattern:', error);
      // Fallback to a simple gradient that won't fail
      return `linear-gradient(135deg, #f59e0b, #f97316)`;
    }
  }, [patternSeed, selectedPatternType]);
  
  // Render with defensive coding to prevent any undefined values
  try {
    return (
      <div 
        className={cn(
          "aspect-video bg-muted flex items-center justify-center relative overflow-hidden",
          className
        )}
        aria-label={`Thumbnail for ${safeTitle || "performance"}`}
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
  } catch (renderError) {
    console.error("Error rendering PerformanceThumbnail:", renderError);
    // Ultimate fallback - just render a colored div if everything else fails
    return (
      <div 
        className={cn(
          "aspect-video bg-orange-500 flex items-center justify-center relative overflow-hidden",
          className
        )}
        aria-label="Performance thumbnail (fallback)"
      />
    );
  }
};
