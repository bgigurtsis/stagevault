import React, { useMemo } from 'react';
import GeoPattern, { GeneratorType } from 'geopattern';
import { cn } from '@/lib/utils';

interface PerformanceThumbnailProps {
  title: string;
  className?: string;
  fallbackIcon?: boolean;
  patternType?: GeneratorType | GeneratorType[];
}

const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const PerformanceThumbnail: React.FC<PerformanceThumbnailProps> = ({ 
  title, 
  className = "",
  fallbackIcon = false,
  patternType
}) => {
  // Select a pattern type to use
  const selectedPatternType = useMemo(() => {
    if (!patternType) {
      return undefined; // Let GeoPattern choose a default
    }
    
    if (Array.isArray(patternType)) {
      // If it's an array, randomly select one pattern type
      return patternType[Math.floor(Math.random() * patternType.length)];
    }
    
    // If it's a single pattern type, use it
    return patternType;
  }, [patternType]);

  // Combine title with random string to enhance randomness
  const patternInput = `${title}-${generateRandomString(8)}`;

  const pattern = GeoPattern.generate(patternInput, {
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