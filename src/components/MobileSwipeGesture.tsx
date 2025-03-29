
import React, { useRef, useEffect, useState } from "react";

interface SwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

const MobileSwipeGesture: React.FC<SwipeGestureProps> = ({
  onSwipeLeft,
  onSwipeRight,
  children,
  threshold = 50,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX === null) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      
      if (diff > threshold && onSwipeRight) {
        onSwipeRight();
      } else if (diff < -threshold && onSwipeLeft) {
        onSwipeLeft();
      }
      
      setTouchStartX(null);
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, touchStartX, threshold]);
  
  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default MobileSwipeGesture;
