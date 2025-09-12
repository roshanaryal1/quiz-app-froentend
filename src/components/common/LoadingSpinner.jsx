import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary-600`} />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;