import React from 'react';
import ServiceIcon from '@/components/ServiceIcon';
import { PREDEFINED_SERVICES } from '@/data/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const IconGallery: React.FC = () => {
  const customExamples = [
    '自定义服务',
    'TestApp',
    'My Service',
    '测试应用',
    'Custom Tool',
    'API Service',
    '开发工具',
    'Database',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>预定义服务商图标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {PREDEFINED_SERVICES.slice(0, 24).map((service) => (
              <div
                key={service.id}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50"
              >
                <ServiceIcon serviceName={service.name} size={40} />
                <span className="text-xs text-center mt-2 text-gray-600">
                  {service.name}
                </span>
                <span className="text-xs text-gray-400">{service.category}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>总共预置了 {PREDEFINED_SERVICES.length} 个热门服务商</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>自动生成首字母图标</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {customExamples.map((serviceName) => (
              <div
                key={serviceName}
                className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50"
              >
                <ServiceIcon serviceName={serviceName} size={40} />
                <span className="text-xs text-center mt-2 text-gray-600">
                  {serviceName}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>如果服务商没有预设图标，系统会自动生成彩色的首字母图标</p>
            <p>颜色根据服务名称确定，确保相同名称总是显示相同颜色</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>不同尺寸示例</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <ServiceIcon serviceName="Netflix" size={24} />
              <p className="text-xs mt-1">24px</p>
            </div>
            <div className="text-center">
              <ServiceIcon serviceName="Spotify" size={32} />
              <p className="text-xs mt-1">32px</p>
            </div>
            <div className="text-center">
              <ServiceIcon serviceName="GitHub" size={48} />
              <p className="text-xs mt-1">48px</p>
            </div>
            <div className="text-center">
              <ServiceIcon serviceName="自定义应用" size={64} />
              <p className="text-xs mt-1">64px</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconGallery;