
import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { ChevronRight, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type GuidanceType = 'info' | 'warning' | 'success';

interface NextStepGuidanceProps {
  title: string;
  description?: string;
  type?: GuidanceType;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link';
  };
  children?: ReactNode;
  className?: string;
}

export function NextStepGuidance({
  title,
  description,
  type = 'info',
  icon,
  action,
  secondaryAction,
  children,
  className
}: NextStepGuidanceProps) {
  // Determine icon and styling based on type
  let Icon = icon;
  let bgColor = '';
  let borderColor = '';
  let textColor = '';
  
  switch (type) {
    case 'info':
      Icon = Icon || Info;
      bgColor = 'bg-blue-50';
      borderColor = 'border-blue-200';
      textColor = 'text-blue-800';
      break;
    case 'warning':
      Icon = Icon || AlertTriangle;
      bgColor = 'bg-yellow-50';
      borderColor = 'border-yellow-200';
      textColor = 'text-yellow-800';
      break;
    case 'success':
      Icon = Icon || CheckCircle;
      bgColor = 'bg-green-50';
      borderColor = 'border-green-200';
      textColor = 'text-green-800';
      break;
  }
  
  return (
    <div className={cn(
      'flex flex-col rounded-lg border p-4 animate-in fade-in',
      bgColor,
      borderColor,
      className
    )}>
      <div className="flex items-start">
        <div className={cn('flex-shrink-0 mr-3', textColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className={cn('font-medium', textColor)}>{title}</h3>
          {description && (
            <p className="text-sm mt-1 opacity-90">{description}</p>
          )}
          {children}
          
          {(action || secondaryAction) && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {action && (
                <Button 
                  size="sm" 
                  variant={action.variant || 'default'} 
                  onClick={action.onClick}
                  className="flex items-center"
                >
                  {action.label}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              
              {secondaryAction && (
                <Button 
                  size="sm" 
                  variant={secondaryAction.variant || 'outline'} 
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
