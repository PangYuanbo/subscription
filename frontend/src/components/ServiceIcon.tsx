import React, { useState } from 'react';
import { getServiceIcon } from '@/data/services';

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
  const iconUrl = getServiceIcon(serviceName, fallbackColor);
  
  // 如果是数据URL（生成的SVG），直接显示
  if (iconUrl.startsWith('data:')) {
    return (
      <img
        src={iconUrl}
        alt={serviceName}
        width={size}
        height={size}
        className={`rounded-lg ${className}`}
      />
    );
  }
  
  // 如果是外部URL，处理加载错误
  if (imageError) {
    // 如果外部图片加载失败，使用生成的首字母图标
    const fallbackIcon = getServiceIcon(serviceName, fallbackColor);
    return (
      <img
        src={fallbackIcon}
        alt={serviceName}
        width={size}
        height={size}
        className={`rounded-lg ${className}`}
      />
    );
  }
  
  return (
    <img
      src={iconUrl}
      alt={serviceName}
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      onError={() => setImageError(true)}
    />
  );
};

export default ServiceIcon;