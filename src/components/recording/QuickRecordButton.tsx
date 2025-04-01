
import { useNavigate } from 'react-router-dom';
import { Video, Plus } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRecordingContext } from '@/hooks/useRecordingContext';

interface QuickRecordButtonProps extends Omit<ButtonProps, 'onClick'> {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  showTooltip?: boolean;
  tooltipContent?: string;
  showDropdown?: boolean;
  performanceId?: string;
  rehearsalId?: string;
  className?: string;
}

export function QuickRecordButton({
  size = 'default',
  variant = 'default',
  showTooltip = true,
  tooltipContent = 'Start recording',
  showDropdown = false,
  performanceId,
  rehearsalId,
  className,
  ...props
}: QuickRecordButtonProps) {
  const navigate = useNavigate();
  const { performances } = useRecordingContext();
  
  const handleQuickRecord = () => {
    let url = '/record';
    const params = new URLSearchParams();
    
    if (performanceId) {
      params.append('performanceId', performanceId);
    }
    
    if (rehearsalId) {
      params.append('rehearsalId', rehearsalId);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    navigate(url);
  };
  
  const buttonContent = (
    <>
      <Video className={cn("h-4 w-4", size === 'lg' ? 'h-5 w-5 mr-2' : 'mr-2')} />
      Record
    </>
  );
  
  // If we're showing a dropdown with context selection
  if (showDropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size}
            className={className}
            {...props}
          >
            {buttonContent}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => navigate('/record')}>
            <Video className="h-4 w-4 mr-2" />
            <span>Quick Record</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {performances.length > 0 ? (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Record for Performance
              </div>
              {performances.slice(0, 5).map(performance => (
                <DropdownMenuItem 
                  key={performance.id}
                  onClick={() => navigate(`/record?performanceId=${performance.id}`)}
                >
                  {performance.title}
                </DropdownMenuItem>
              ))}
              {performances.length > 5 && (
                <DropdownMenuItem onClick={() => navigate('/performances')}>
                  View all performances...
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <DropdownMenuItem 
              onClick={() => navigate('/performances/new')}
              className="text-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Create new performance</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  // Simple button with optional tooltip
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={variant} 
              size={size}
              onClick={handleQuickRecord}
              className={className}
              {...props}
            >
              {buttonContent}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Simple button without tooltip
  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={handleQuickRecord}
      className={className}
      {...props}
    >
      {buttonContent}
    </Button>
  );
}
