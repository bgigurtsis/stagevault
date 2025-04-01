
import React, { useRef, useEffect, useState } from "react";

interface SwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

const MobileSwipeGesture: React.FC<SwipeGestureProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  threshold = 50,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX === null || touchStartY === null) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      
      // Determine if the swipe is more horizontal or vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (diffX > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (diffX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (diffY > threshold && onSwipeDown) {
          onSwipeDown();
        } else if (diffY < -threshold && onSwipeUp) {
          onSwipeUp();
        }
      }
      
      setTouchStartX(null);
      setTouchStartY(null);
    };
    
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, touchStartX, touchStartY, threshold]);
  
  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default MobileSwipeGesture;
