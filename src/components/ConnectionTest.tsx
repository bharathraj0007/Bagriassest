import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Database,
  Activity,
  Globe
} from 'lucide-react';

interface ConnectionStatus {
  database: 'checking' | 'connected' | 'error';
  tables: Record<string, 'checking' | 'connected' | 'error'>;
  functions: Record<string, 'checking' | 'connected' | 'error'>;
}

export default function ConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    database: 'checking',
    tables: {},
    functions: {}
  });

  const [isTestRunning, setIsTestRunning] = useState(false);

  const requiredTables = [
    'profiles',
    'crops',
    'recommendations',
    'price_predictions',
    'government_schemes',
    'support_tickets'
  ];

  const enhancedTables = [
    'price_history',
    'weather_cache',
    'system_logs',
    'market_data'
  ];

  const requiredFunctions = [
    'crop-recommendation',
    'price-prediction',
    'weather-data'
  ];

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    setIsTestRunning(true);

    // Initialize all statuses
    const initialStatus: ConnectionStatus = {
      database: 'checking',
      tables: {},
      functions: {}
    };

    requiredTables.forEach(table => {
      initialStatus.tables[table] = 'checking';
    });

    enhancedTables.forEach(table => {
      initialStatus.tables[table] = 'checking';
    });

    requiredFunctions.forEach(func => {
      initialStatus.functions[func] = 'checking';
    });

    setStatus(initialStatus);

    // Test database connection
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) {
        setStatus(prev => ({ ...prev, database: 'error' }));
      } else {
        setStatus(prev => ({ ...prev, database: 'connected' }));
      }
    } catch (err) {
      setStatus(prev => ({ ...prev, database: 'error' }));
    }

    // Test required tables
    for (const table of [...requiredTables, ...enhancedTables]) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1);
        setStatus(prev => ({
          ...prev,
          tables: {
            ...prev.tables,
            [table]: error ? 'error' : 'connected'
          }
        }));
      } catch (err) {
        setStatus(prev => ({
          ...prev,
          tables: {
            ...prev.tables,
            [table]: 'error'
          }
        }));
      }
    }

    // Test functions
    for (const func of requiredFunctions) {
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${func}`, {
          method: 'OPTIONS'
        });
        setStatus(prev => ({
          ...prev,
          functions: {
            ...prev.functions,
            [func]: response.ok ? 'connected' : 'error'
          }
        }));
      } catch (err) {
        setStatus(prev => ({
          ...prev,
          functions: {
            ...prev.functions,
            [func]: 'error'
          }
        }));
      }
    }

    setIsTestRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'checking':
      default:
        return <RefreshCw className="h-5 w-5 text-gray-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 bg-green-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'checking':
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const allConnected = status.database === 'connected' &&
    Object.values(status.tables).every(t => t === 'connected') &&
    Object.values(status.functions).every(f => f === 'connected');

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Connection Status</h2>
        <button
          onClick={runTests}
          disabled={isTestRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isTestRunning ? 'animate-spin' : ''}`} />
          {isTestRunning ? 'Testing...' : 'Test Again'}
        </button>
      </div>

      {/* Database Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Database Connection</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status.database)}`}>
            {status.database.charAt(0).toUpperCase() + status.database.slice(1)}
          </div>
        </div>
      </div>

      {/* Tables Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Database Tables</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(status.tables).map(([table, tableStatus]) => (
            <div
              key={table}
              className={`p-4 border rounded-lg ${tableStatus === 'connected' ? 'border-green-200 bg-green-50' :
                tableStatus === 'error' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{table}</span>
                {getStatusIcon(tableStatus)}
              </div>
              {tableStatus === 'connected' ? (
                <span className="text-xs text-green-600">✓ Ready</span>
              ) : tableStatus === 'error' ? (
                <span className="text-xs text-red-600">✗ Error</span>
              ) : (
                <span className="text-xs text-gray-600">Checking...</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Functions Status */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Edge Functions</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(status.functions).map(([func, funcStatus]) => (
            <div
              key={func}
              className={`p-4 border rounded-lg ${funcStatus === 'connected' ? 'border-green-200 bg-green-50' :
                funcStatus === 'error' ? 'border-red-200 bg-red-50' :
                'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{func}</span>
                {getStatusIcon(funcStatus)}
              </div>
              {funcStatus === 'connected' ? (
                <span className="text-xs text-green-600">✓ Deployed</span>
              ) : funcStatus === 'error' ? (
                <span className="text-xs text-red-600">✗ Error</span>
              ) : (
                <span className="text-xs text-gray-600">Checking...</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Overall Status */}
      <div className="mt-8 p-6 rounded-lg border-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${allConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {allConnected ? 'All Systems Operational' : 'Connection Issues Detected'}
            </h3>
          </div>
          {allConnected ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-red-600" />
          )}
        </div>

        {allConnected ? (
          <p className="text-sm text-gray-600 mt-2">
            ✅ Your AgriSmart application is fully connected to Supabase. All features should be working correctly.
          </p>
        ) : (
          <div className="text-sm text-red-600 mt-2">
            <p>❌ Some components are not connected. Please check the following:</p>
            <ul className="mt-2 ml-4 list-disc list-inside space-y-1">
              {status.database === 'error' && (
                <li>Database connection - Check your environment variables</li>
              )}
              {Object.entries(status.tables).filter(([_, status]) => status === 'error').length > 0 && (
                <li>Missing database tables - Run the SQL migrations in Supabase Dashboard</li>
              )}
              {Object.entries(status.functions).filter(([_, status]) => status === 'error').length > 0 && (
                <li>Edge functions not deployed - Run the deployment script</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Open Supabase Dashboard
          </button>
          <button
            onClick={() => window.open('/admin-login', '_blank')}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            Admin Dashboard
          </button>
          <button
            onClick={() => window.open('SUPABASE_SETUP.md', '_blank')}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Setup Guide
          </button>
        </div>
      </div>
    </div>
  );
}