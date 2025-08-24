import React, { useState, useRef } from 'react';
import { Upload, Globe, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IconUploadProps {
  value?: string;
  onChange: (iconUrl: string) => void;
  disabled?: boolean;
}

const IconUpload: React.FC<IconUploadProps> = ({ value, onChange, disabled }) => {
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setError('');
    setIsLoading(true);

    // Convert to base64 for preview (in real app, upload to cloud storage)
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlFetch = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a website URL');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/fetch-icon?url=${encodeURIComponent(websiteUrl)}`);
      const data = await response.json();
      
      if (data.success) {
        onChange(data.icon_url);
      } else {
        setError('Failed to fetch icon from website');
      }
    } catch (err) {
      console.error('Error fetching icon:', err);
      setError('Failed to fetch icon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearIcon = () => {
    onChange('');
    setWebsiteUrl('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3">
        <Label>Service Icon</Label>
        
        {/* Mode Selection */}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant={uploadMode === 'url' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('url')}
            disabled={disabled}
          >
            <Globe className="h-4 w-4 mr-1" />
            Website URL
          </Button>
          <Button
            type="button"
            variant={uploadMode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('upload')}
            disabled={disabled}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload Image
          </Button>
        </div>

        {/* URL Input Mode */}
        {uploadMode === 'url' && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter website URL (e.g., netflix.com)"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={disabled || isLoading}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleUrlFetch}
                disabled={disabled || isLoading || !websiteUrl.trim()}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Fetch Icon'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* File Upload Mode */}
        {uploadMode === 'upload' && (
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={disabled || isLoading}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PNG, JPG, GIF, SVG (max 2MB)
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {/* Preview */}
        {value && (
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              <img
                src={value}
                alt="Service icon preview"
                className="w-8 h-8 rounded object-cover"
                onError={() => setError('Failed to load icon')}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Icon Preview</p>
              <p className="text-xs text-muted-foreground truncate">
                {value.startsWith('data:') ? 'Uploaded image' : value}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearIcon}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IconUpload;