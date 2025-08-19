import React from 'react';
import ServiceIcon from '@/components/ServiceIcon';
import { PREDEFINED_SERVICES } from '@/data/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const IconGallery: React.FC = () => {
  const customExamples = [
    'Custom Service',
    'TestApp',
    'My Service',
    'Test App',
    'Custom Tool',
    'API Service',
    'Dev Tools',
    'Database',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Predefined Service Icons</CardTitle>
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
            <p>Total of {PREDEFINED_SERVICES.length} popular service providers pre-configured</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Generated Initial Icons</CardTitle>
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
            <p>If a service provider doesn't have a preset icon, the system will automatically generate colorful initial icons</p>
            <p>Colors are determined by service name, ensuring the same name always displays the same color</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Different Size Examples</CardTitle>
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
              <ServiceIcon serviceName="Custom App" size={64} />
              <p className="text-xs mt-1">64px</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconGallery;