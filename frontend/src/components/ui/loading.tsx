import React from 'react';
import { Loader2, Database, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  className, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-indigo-600', 
        sizeClasses[size], 
        className
      )} 
    />
  );
};

interface LoadingDatabaseProps {
  className?: string;
  message?: string;
  progress?: number;
}

export const LoadingDatabase: React.FC<LoadingDatabaseProps> = ({ 
  className, 
  message = "Connecting to database...",
  progress 
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-200 shadow-lg",
      className
    )}>
      {/* Animated Database Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-pulse"></div>
        <div className="relative p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full">
          <Database className="h-12 w-12 text-indigo-600 animate-bounce" />
        </div>
        {/* Connection Waves */}
        <div className="absolute -inset-4 opacity-30">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-300 animate-ping"></div>
          <div className="absolute inset-2 rounded-full border-2 border-indigo-400 animate-ping animation-delay-75"></div>
          <div className="absolute inset-4 rounded-full border-2 border-indigo-500 animate-ping animation-delay-150"></div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="text-center space-y-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-800">
          Loading Your Data
        </h3>
        <p className="text-sm text-slate-600 animate-pulse">
          {message}
        </p>
      </div>

      {/* Progress Bar (if progress is provided) */}
      {progress !== undefined && (
        <div className="w-full max-w-xs mb-4">
          <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {Math.round(progress)}%
          </p>
        </div>
      )}

      {/* Animated Dots */}
      <div className="flex space-x-1">
        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></div>
        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce animation-delay-75"></div>
        <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce animation-delay-150"></div>
      </div>
    </div>
  );
};

interface LoadingStepsProps {
  steps: Array<{
    title: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    description?: string;
  }>;
  className?: string;
}

export const LoadingSteps: React.FC<LoadingStepsProps> = ({ steps, className }) => {
  return (
    <div className={cn(
      "bg-white rounded-xl border border-slate-200 shadow-lg p-6",
      className
    )}>
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-3">
            {/* Step Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'pending' && (
                <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-slate-100"></div>
              )}
              {step.status === 'loading' && (
                <LoadingSpinner size="sm" className="h-5 w-5" />
              )}
              {step.status === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              {step.status === 'error' && (
                <div className="h-5 w-5 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                </div>
              )}
            </div>
            
            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                step.status === 'completed' ? 'text-green-700' : 
                step.status === 'error' ? 'text-red-700' : 
                step.status === 'loading' ? 'text-indigo-700' : 'text-slate-500'
              )}>
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-slate-500 mt-1">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isVisible, 
  message,
  children,
  className 
}) => {
  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4",
      className
    )}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {children || <LoadingDatabase message={message} />}
      </div>
    </div>
  );
};

interface LoadingCardProps {
  className?: string;
  children?: React.ReactNode;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ className, children }) => {
  return (
    <div className={cn(
      "animate-pulse bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200",
      className
    )}>
      {children || (
        <div className="space-y-3">
          <div className="h-4 bg-slate-300 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-slate-300 rounded"></div>
            <div className="h-3 bg-slate-300 rounded w-5/6"></div>
          </div>
        </div>
      )}
    </div>
  );
};