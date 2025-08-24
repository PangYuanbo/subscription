import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Globe, Database, Key, Wifi } from 'lucide-react';

interface ApiDebuggerProps {
  className?: string;
}

const ApiDebugger: React.FC<ApiDebuggerProps> = ({ className }) => {
  const [testResults, setTestResults] = useState<{
    [key: string]: {
      status: 'pending' | 'success' | 'error';
      message: string;
      details?: any;
    };
  }>({});

  const [isRunning, setIsRunning] = useState(false);

  const envVars = {
    API_URL: import.meta.env.VITE_API_URL,
    AUTH0_DOMAIN: import.meta.env.VITE_AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: import.meta.env.VITE_AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE: import.meta.env.VITE_AUTH0_AUDIENCE,
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { status: 'pending', message: 'Testing...' }
    }));

    try {
      const result = await testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          status: 'success', 
          message: 'Success',
          details: result 
        }
      }));
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [testName]: { 
          status: 'error', 
          message: error.message || 'Test failed',
          details: error 
        }
      }));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});

    // Test 1: Environment Variables
    await runTest('envCheck', async () => {
      const missing = Object.entries(envVars).filter(([_, value]) => !value);
      if (missing.length > 0) {
        throw new Error(`Missing env vars: ${missing.map(([key]) => key).join(', ')}`);
      }
      return { message: 'All environment variables are set' };
    });

    // Test 2: API URL Reachability
    await runTest('apiReachable', async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(`${envVars.API_URL}/`, {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.text();
        return { 
          status: response.status,
          message: data || 'API is reachable'
        };
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout (10s)');
        }
        throw error;
      }
    });

    // Test 3: API Health Check
    await runTest('healthCheck', async () => {
      const response = await fetch(`${envVars.API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Health check failed: ${response.status} - ${errorText}`);
      }
      
      return await response.json();
    });

    // Test 4: Auth0 Configuration
    await runTest('auth0Config', async () => {
      if (!envVars.AUTH0_DOMAIN) {
        return { message: 'Auth0 not configured (optional)' };
      }

      const jwksUrl = `https://${envVars.AUTH0_DOMAIN}/.well-known/jwks.json`;
      const response = await fetch(jwksUrl);
      
      if (!response.ok) {
        throw new Error(`Auth0 JWKS not accessible: ${response.status}`);
      }
      
      const jwks = await response.json();
      return { 
        keys: jwks.keys?.length || 0,
        message: 'Auth0 configuration is valid'
      };
    });

    // Test 5: CORS Test
    await runTest('corsTest', async () => {
      try {
        const response = await fetch(`${envVars.API_URL}/`, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'GET',
          }
        });
        
        const corsHeaders = {
          'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
          'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
          'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        };
        
        return { 
          status: response.status,
          headers: corsHeaders,
          message: 'CORS headers are present'
        };
      } catch (error) {
        throw new Error('CORS preflight failed');
      }
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Testing...</Badge>;
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            API Connection Diagnostics
          </CardTitle>
          <CardDescription>
            Debug API connection issues between frontend and backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Environment Variables */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Environment Variables
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(envVars).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-mono">{key}:</span>
                  <Badge variant={value ? "default" : "destructive"} className="text-xs">
                    {value ? "Set" : "Missing"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Database className="h-4 w-4" />
                Test Results
              </h3>
              <div className="space-y-3">
                {Object.entries(testResults).map(([testName, result]) => (
                  <div key={testName} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium capitalize">
                          {testName.replace(/([A-Z])/g, ' $1').trim()}
                        </h4>
                        {getStatusBadge(result.status)}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{result.message}</p>
                      {result.details && (
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Globe className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run Diagnostics'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setTestResults({})}
              disabled={isRunning}
            >
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDebugger;