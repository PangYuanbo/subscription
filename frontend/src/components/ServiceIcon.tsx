import React, { useState, useEffect } from 'react';
import { findServiceByName, getRandomColor, getContrastColor } from '@/data/services';

interface ServiceIconProps {
  serviceName: string;
  size?: number;
  className?: string;
  fallbackColor?: string;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ 
  serviceName, 
  size = 32, 
  className = '', 
  fallbackColor 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const predefinedService = findServiceByName(serviceName);
  
  // 重置状态当服务名称改变时
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [serviceName]);
  
  // 生成首字母图标的函数
  const renderInitialIcon = () => {
    const initial = serviceName.charAt(0).toUpperCase();
    const bgColor = predefinedService?.color || fallbackColor || getRandomColor(serviceName);
    const textColor = getContrastColor(bgColor);
    
    return (
      <svg 
        width={size} 
        height={size} 
        className={`rounded-lg ${className}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} rx="6" fill={bgColor}/>
        <text 
          x={size/2} 
          y={size/2 + size/8} 
          fontFamily="Arial, sans-serif" 
          fontSize={size/2.2} 
          fontWeight="bold" 
          textAnchor="middle" 
          fill={textColor}
        >
          {initial}
        </text>
      </svg>
    );
  };
  
  // 如果有预定义服务且图片未加载失败，显示预定义图标
  if (predefinedService?.icon_url && !imageError) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        {imageLoading && (
          <div 
            className={`absolute inset-0 bg-gray-200 rounded-lg animate-pulse ${className}`}
            style={{ width: size, height: size }}
          />
        )}
        <img
          src={predefinedService.icon_url}
          alt={serviceName}
          width={size}
          height={size}
          className={`rounded-lg ${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
          style={{ 
            width: size, 
            height: size,
            position: imageLoading ? 'absolute' : 'static'
          }}
        />
      </div>
    );
  }
  
  // 生成首字母图标
  return renderInitialIcon();
};

export default ServiceIcon;