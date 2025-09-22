/**
 * API Status Banner - Shows which backend API is currently active
 */
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/services/api';
import { checkHealth } from '@/services/health';
import { Cloud, Database, Wifi, WifiOff } from 'lucide-react';

export function ApiStatusBanner() {
  const [isNewApi, setIsNewApi] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check API status
    const checkApiStatus = async () => {
      const usingNewApi = apiClient.isUsingNewApi();
      setIsNewApi(usingNewApi);

      // Only show banner in development or if explicitly enabled
      const shouldShow = import.meta.env.DEV || import.meta.env.VITE_SHOW_API_STATUS === 'true';
      setShowBanner(shouldShow);

      if (shouldShow) {
        try {
          const health = await checkHealth();
          setHealthStatus(health.data?.status === 'healthy' ? 'healthy' : 'unhealthy');
        } catch {
          setHealthStatus('unhealthy');
        }
      }
    };

    checkApiStatus();
  }, []);

  if (!showBanner) {
    return null;
  }

  const getStatusColor = () => {
    if (healthStatus === 'checking') return 'secondary';
    if (healthStatus === 'healthy') return 'default';
    return 'destructive';
  };

  const getStatusIcon = () => {
    if (healthStatus === 'checking') return <Wifi className="h-4 w-4" />;
    if (healthStatus === 'healthy') return isNewApi ? <Cloud className="h-4 w-4" /> : <Database className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (healthStatus === 'checking') return 'Checking API status...';
    if (healthStatus === 'unhealthy') return `API Unhealthy (${isNewApi ? 'Cloud Run' : 'Supabase'})`;
    return `Connected to ${isNewApi ? 'Cloud Run FastAPI' : 'Supabase'} backend`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Alert className={`rounded-none border-0 border-b bg-opacity-95 backdrop-blur-sm ${
        healthStatus === 'healthy' ? 'bg-green-50 border-green-200' :
        healthStatus === 'unhealthy' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <AlertDescription className="text-sm font-medium">
              {getStatusText()}
            </AlertDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor()} className="text-xs">
              {isNewApi ? 'NEW API' : 'LEGACY'}
            </Badge>
            {import.meta.env.DEV && (
              <button
                onClick={() => setShowBanner(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Add top padding to main content when banner is visible
 */
export function useApiStatusPadding(): string {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const shouldShow = import.meta.env.DEV || import.meta.env.VITE_SHOW_API_STATUS === 'true';
    setShowBanner(shouldShow);
  }, []);

  return showBanner ? 'pt-16' : 'pt-0';
}