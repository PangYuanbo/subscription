import { useState } from 'react';
import { X, MessageSquare, Loader2, CheckCircle, XCircle } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<NLPResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiUrl}/subscriptions/nlp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      setResponse(data);

      if (data.success) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (error) {
      setResponse({
        success: false,
        message: '网络连接失败，请检查后端服务是否运行',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputText('');
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
            <h2 className="text-xl font-semibold text-gray-900">智能添加订阅</h2>
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
              描述您的订阅
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例如：我想添加Netflix的订阅，每月19.99美元，下次付款是15号，账户是family@example.com"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              请尽可能详细地描述服务名称、费用、付款日期和账户信息
            </p>
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
                      <p><strong>解析结果:</strong></p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {response.parsed_data.service_name && (
                          <li>服务名称: {response.parsed_data.service_name}</li>
                        )}
                        {response.parsed_data.service_category && (
                          <li>分类: {response.parsed_data.service_category}</li>
                        )}
                        {response.parsed_data.monthly_cost && (
                          <li>月费用: ${response.parsed_data.monthly_cost}</li>
                        )}
                        {response.parsed_data.account && (
                          <li>账户: {response.parsed_data.account}</li>
                        )}
                        {response.parsed_data.payment_date && (
                          <li>付款日期: {response.parsed_data.payment_date}</li>
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
              取消
            </button>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isLoading ? '解析中...' : '添加订阅'}</span>
            </button>
          </div>
        </form>

        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">示例输入:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• "我订阅了Spotify Premium，每月9.99美元，每月10号扣费"</li>
              <li>• "添加GitHub Pro订阅，账户dev@company.com，月费7美元，1号付款"</li>
              <li>• "Netflix标准版订阅，家庭账户，每月15.99美元，15号付款"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}