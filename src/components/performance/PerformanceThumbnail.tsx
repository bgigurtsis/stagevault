
import React from 'react';
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
  // Generate a simple gradient background based on the title's length
  const getColorFromString = (str: string) => {
    const charSum = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = charSum % 360;
    return `hsl(${hue}, 70%, 65%)`;
  };
  
  const primaryColor = getColorFromString(title);
  const secondaryColor = `hsl(${(parseInt(primaryColor.slice(4, primaryColor.indexOf(','))) + 40) % 360}, 70%, 75%)`;
  
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
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      />
      
      {fallbackIcon && (
        <Theater className="h-12 w-12 text-muted-foreground/50 absolute" />
      )}
    </div>
  );
};
