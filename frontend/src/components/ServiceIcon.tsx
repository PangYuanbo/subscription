import React, { useState } from 'react';
import { findServiceByName, getRandomColor, getContrastColor } from '@/data/services';

interface ServiceIconProps {
  serviceName: string;
  size?: number;
  className?: string;
  fallbackColor?: string;
}

// 简化版本，直接渲染SVG而不使用数据URL
const ServiceIcon: React.FC<ServiceIconProps> = ({ 
  serviceName, 
  size = 32, 
  className = '', 
  fallbackColor 
}) => {
  const [imageError, setImageError] = useState(false);
  const predefinedService = findServiceByName(serviceName);
  
  // 如果有预定义服务且图片未加载失败，显示预定义图标
  if (predefinedService?.icon_url && !imageError) {
    return (
      <img
        src={predefinedService.icon_url}
        alt={serviceName}
        width={size}
        height={size}
        className={`rounded-lg ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }
  
  // 生成首字母图标 (直接渲染SVG)
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

export default ServiceIcon;