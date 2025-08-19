import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  TrendingUp, 
  Settings,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from './UserProfile';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">SubManager</h1>
          </div>
          <UserProfile />
        </div>
      </div>
      
      <nav className="px-4 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">STATUS</span>
            <span className="text-xs font-bold text-green-600">ALL OK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;