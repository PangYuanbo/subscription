import React, { useState, useRef } from 'react';
import { Upload, Globe, X, Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IconUploadProps {
  value?: string;
  sourceUrl?: string;
  onChange: (iconUrl: string, sourceUrl?: string) => void;
  disabled?: boolean;
}

const IconUpload: React.FC<IconUploadProps> = ({ value, sourceUrl, onChange, disabled }) => {
  const [uploadMode, setUploadMode] = useState<'url' | 'upload' | 'link'>('url');
  const [websiteUrl, setWebsiteUrl] = useState(sourceUrl || '');
  const [directIconUrl, setDirectIconUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [storageMethod, setStorageMethod] = useState<'url' | 'base64'>('url');
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

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onChange(result, undefined);
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
      // Determine whether to get URL only or base64 data
      const returnUrlOnly = storageMethod === 'url';
      const response = await fetch(
        `http://localhost:8000/fetch-icon?url=${encodeURIComponent(websiteUrl)}&return_url_only=${returnUrlOnly}`
      );
      const data = await response.json();
      
      if (data.success) {
        onChange(data.icon_url, data.icon_source_url || websiteUrl);
        setWebsiteUrl(data.icon_source_url || websiteUrl);
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

  const handleDirectUrlSet = () => {
    if (!directIconUrl.trim()) {
      setError('Please enter an icon URL');
      return;
    }

    // Validate URL format
    try {
      new URL(directIconUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setError('');
    onChange(directIconUrl, undefined);
  };

  const clearIcon = () => {
    onChange('', '');
    setWebsiteUrl('');
    setDirectIconUrl('');
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
            Website
          </Button>
          <Button
            type="button"
            variant={uploadMode === 'link' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('link')}
            disabled={disabled}
          >
            <Link2 className="h-4 w-4 mr-1" />
            Direct URL
          </Button>
          <Button
            type="button"
            variant={uploadMode === 'upload' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUploadMode('upload')}
            disabled={disabled}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>

        {/* URL Input Mode */}
        {uploadMode === 'url' && (
          <div className="space-y-3">
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
                  'Fetch'
                )}
              </Button>
            </div>
            
            {/* Storage Method Selection */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="storage-method" className="text-sm">Storage:</Label>
              <Select
                value={storageMethod}
                onValueChange={(value: 'url' | 'base64') => setStorageMethod(value)}
                disabled={disabled || isLoading}
              >
                <SelectTrigger id="storage-method" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">
                    <div className="flex flex-col">
                      <span>URL Only</span>
                      <span className="text-xs text-muted-foreground">Smaller, dynamic</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="base64">
                    <div className="flex flex-col">
                      <span>Base64 Data</span>
                      <span className="text-xs text-muted-foreground">Larger, cached</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-muted-foreground">
              URL storage fetches icons dynamically, Base64 stores icon data directly
            </p>
          </div>
        )}

        {/* Direct Icon URL Mode */}
        {uploadMode === 'link' && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Enter direct icon URL (e.g., https://example.com/icon.png)"
                value={directIconUrl}
                onChange={(e) => setDirectIconUrl(e.target.value)}
                disabled={disabled}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleDirectUrlSet}
                disabled={disabled || !directIconUrl.trim()}
                size="sm"
              >
                Set Icon
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use a direct link to an image file (PNG, JPG, SVG, etc.)
            </p>
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
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  // If it's a URL and fails to load, try fetching it dynamically
                  if (!value.startsWith('data:') && sourceUrl) {
                    setError('Icon failed to load, try fetching again');
                  } else {
                    setError('Failed to load icon');
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Icon Preview</p>
              <p className="text-xs text-muted-foreground truncate">
                {value.startsWith('data:') ? 'Base64 encoded image' : 
                 value.startsWith('http') ? 'External URL' : 
                 'Uploaded image'}
              </p>
              {sourceUrl && (
                <p className="text-xs text-muted-foreground truncate">
                  Source: {sourceUrl}
                </p>
              )}
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