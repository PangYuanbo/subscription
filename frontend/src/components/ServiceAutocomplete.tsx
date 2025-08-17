import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import ServiceIcon from '@/components/ServiceIcon';
import { PREDEFINED_SERVICES } from '@/data/services';
import type { ServiceData } from '@/data/services';

interface ServiceAutocompleteProps {
  value: string;
  onServiceSelect: (service: ServiceData | null, customName?: string) => void;
  placeholder?: string;
  required?: boolean;
}

const ServiceAutocomplete: React.FC<ServiceAutocompleteProps> = ({
  value,
  onServiceSelect,
  placeholder = "输入服务商名称...",
  required = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredServices, setFilteredServices] = useState<ServiceData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 根据选中的服务设置输入框的值
    if (value) {
      const selectedService = PREDEFINED_SERVICES.find(s => s.id === value);
      if (selectedService) {
        setInputValue(selectedService.name);
      } else if (value === 'custom') {
        // 如果是自定义服务，保持当前输入值
        // inputValue 已经包含用户输入的自定义名称
      }
    } else {
      setInputValue('');
    }
  }, [value]);

  const filterServices = (query: string) => {
    if (!query.trim()) {
      setFilteredServices([]);
      return;
    }

    const filtered = PREDEFINED_SERVICES.filter(service =>
      service.name.toLowerCase().includes(query.toLowerCase()) ||
      service.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // 限制显示最多8个结果

    setFilteredServices(filtered);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    filterServices(newValue);

    // 如果用户正在输入，但还没选择任何预定义服务，则作为自定义服务处理
    if (newValue.trim()) {
      const exactMatch = PREDEFINED_SERVICES.find(s => 
        s.name.toLowerCase() === newValue.toLowerCase()
      );
      if (!exactMatch) {
        onServiceSelect(null, newValue);
      }
    } else {
      onServiceSelect(null);
    }
  };

  const handleServiceSelect = (service: ServiceData) => {
    setInputValue(service.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onServiceSelect(service);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredServices.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredServices.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredServices.length) {
          handleServiceSelect(filteredServices[selectedIndex]);
        } else if (inputValue.trim()) {
          // 如果没有选中任何项目但有输入内容，作为自定义服务
          setIsOpen(false);
          onServiceSelect(null, inputValue.trim());
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (inputValue.trim()) {
      filterServices(inputValue);
      setIsOpen(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // 延迟关闭下拉列表，以便处理点击选项的情况
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  // 点击外部关闭下拉列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className="w-full"
      />
      
      {isOpen && filteredServices.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
        >
          {filteredServices.map((service, index) => (
            <div
              key={service.id}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleServiceSelect(service)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <ServiceIcon serviceName={service.name} size={20} />
              <div className="flex-1">
                <div className="text-sm font-medium">{service.name}</div>
                <div className="text-xs text-gray-500">{service.category}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 显示当前选择或将创建的服务信息 */}
      {inputValue.trim() && (
        <div className="mt-2">
          {(() => {
            const exactMatch = PREDEFINED_SERVICES.find(s => 
              s.name.toLowerCase() === inputValue.toLowerCase()
            );
            if (exactMatch) {
              return (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                  <ServiceIcon serviceName={exactMatch.name} size={20} />
                  <span className="text-sm text-blue-800">
                    已选择: {exactMatch.name} ({exactMatch.category})
                  </span>
                </div>
              );
            } else {
              return (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-md">
                  <ServiceIcon serviceName={inputValue} size={20} />
                  <span className="text-sm text-amber-800">
                    将创建自定义服务: {inputValue}
                  </span>
                </div>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default ServiceAutocomplete;