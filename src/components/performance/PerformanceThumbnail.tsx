import React from 'react';
import GeoPattern from 'geopattern';
import { cn } from '@/lib/utils';

interface PerformanceThumbnailProps {
  title: string;
  className?: string;
  fallbackIcon?: boolean;
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
  fallbackIcon = false
}) => {
  // Combine title with random string to enhance randomness
  const patternInput = `${title}-${generateRandomString(8)}`;

  const pattern = GeoPattern.generate(patternInput, {
    baseColor: '#9b87f5'
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