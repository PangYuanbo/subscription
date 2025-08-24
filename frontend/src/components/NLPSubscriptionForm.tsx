import { useState } from 'react';
import { X, MessageSquare, Loader2, CheckCircle, XCircle, Upload } from 'lucide-react';
import { useAuthenticatedApi } from '@/api/auth-client';

interface NLPSubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NLPResponse {
  success: boolean;
  message: string;
  subscription?: any;
  parsed_data?: any;
}

export default function NLPSubscriptionForm({ isOpen, onClose, onSuccess }: NLPSubscriptionFormProps) {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<NLPResponse | null>(null);
  const authenticatedApi = useAuthenticatedApi();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    setIsLoading(true);
    setResponse(null);

    try {
      let nlpResponse;
      if (selectedImage) {
        // Convert image to base64 for multimodal parsing
        const reader = new FileReader();
        const imageBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedImage);
        });
        
        nlpResponse = await authenticatedApi.subscriptions.parseNLPWithImage(inputText || '', imageBase64);
      } else {
        nlpResponse = await authenticatedApi.subscriptions.parseNLP(inputText);
      }
      
      setResponse(nlpResponse);

      if (nlpResponse.success) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error: any) {
      console.error('NLP parsing error:', error);
      setResponse({
        success: false,
        message: error.response?.data?.detail || error.message || 'Failed to parse subscription information',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setSelectedImage(null);
    setImagePreview(null);
    setResponse(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Smart Add Subscription</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe Your Subscription or Upload Image
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="For example: I want to add Netflix subscription, $19.99 per month, next payment is on the 15th, account is family@example.com"
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Describe your subscription or upload a screenshot/image of your subscription details
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image (Optional)
            </label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isLoading}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload an image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG up to 10MB</p>
                </label>
              </div>
            ) : (
              <div className="relative border border-gray-300 rounded-lg p-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 mx-auto rounded"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {response && (
            <div className={`mb-4 p-4 rounded-lg ${
              response.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start space-x-2">
                {response.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    response.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {response.message}
                  </p>
                  {response.parsed_data && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p><strong>Parsing Results:</strong></p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {response.parsed_data.service_name && (
                          <li>Service Name: {response.parsed_data.service_name}</li>
                        )}
                        {response.parsed_data.service_category && (
                          <li>Category: {response.parsed_data.service_category}</li>
                        )}
                        {response.parsed_data.monthly_cost && (
                          <li>Monthly Cost: ${response.parsed_data.monthly_cost}</li>
                        )}
                        {response.parsed_data.account && (
                          <li>Account: {response.parsed_data.account}</li>
                        )}
                        {response.parsed_data.payment_date && (
                          <li>Payment Date: {response.parsed_data.payment_date}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedImage) || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isLoading ? 'Parsing...' : 'Add Subscription'}</span>
            </button>
          </div>
        </form>

        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Example Input:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• "I subscribed to Spotify Premium, $9.99 per month, charged on the 10th"</li>
              <li>• "Add GitHub Pro subscription, account dev@company.com, $7 monthly, payment on 1st"</li>
              <li>• "Netflix Standard subscription, family account, $15.99 per month, payment on 15th"</li>
              <li>• Upload a screenshot of your subscription email or billing page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}