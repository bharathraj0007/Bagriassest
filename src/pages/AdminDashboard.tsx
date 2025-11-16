import { useState, useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { supabase } from '../lib/supabase';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Crop,
  Settings,
  LogOut,
  Menu,
  X,
  Database,
  BarChart3,
  Globe,
  HeadphonesIcon,
  Shield,
  Calendar,
  Package,
  Activity
} from 'lucide-react';
import CropManager from '../components/admin/CropManager';
import PriceMonitor from '../components/admin/PriceMonitor';

interface DashboardStats {
  totalUsers: number;
  activeRecommendations: number;
  priceQueries: number;
  supportTickets: number;
  systemHealth: number;
  totalRevenue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_id?: string;
}

interface SystemHealth {
  api_status: 'healthy' | 'degraded' | 'down';
  database_status: 'healthy' | 'degraded' | 'down';
  response_time: number;
  error_rate: number;
  uptime: number;
}

const AdminDashboard = ({ onNavigate }: { onNavigate: (page: string) => void }) => {
  const { admin, signOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeRecommendations: 0,
    priceQueries: 0,
    supportTickets: 0,
    systemHealth: 0,
    totalRevenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api_status: 'healthy',
    database_status: 'healthy',
    response_time: 0,
    error_rate: 0,
    uptime: 100
  });

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic stats
      const [
        { count: totalUsers },
        { count: activeRecommendations },
        { count: priceQueries },
        { count: supportTickets },
        { data: logs }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('recommendations').select('*', { count: 'exact', head: true }),
        supabase.from('price_predictions').select('*', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('*', { count: 'exact', head: true }),
        supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(10)
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        activeRecommendations: activeRecommendations || 0,
        priceQueries: priceQueries || 0,
        supportTickets: supportTickets || 0,
        systemHealth: calculateSystemHealth(),
        totalRevenue: calculateTotalRevenue()
      });

      // Process recent activity from logs
      const activity: RecentActivity[] = logs?.map(log => ({
        id: log.id,
        type: log.log_level,
        description: log.message,
        timestamp: log.created_at,
        user_id: log.user_id
      })) || [];

      setRecentActivity(activity);

      // Check system health
      await checkSystemHealth();

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Check database health
      const { error } = await supabase.from('profiles').select('id').limit(1);

      // Check API health (simplified check)
      const apiHealthy = !error;

      setSystemHealth(prev => ({
        ...prev,
        api_status: apiHealthy ? 'healthy' : 'degraded',
        database_status: apiHealthy ? 'healthy' : 'degraded',
        response_time: Math.random() * 200 + 50, // Mock response time
        error_rate: Math.random() * 5 // Mock error rate
      }));
    } catch (error) {
      setSystemHealth(prev => ({
        ...prev,
        api_status: 'down',
        database_status: 'down',
        error_rate: 100
      }));
    }
  };

  const calculateSystemHealth = (): number => {
    // Simplified health calculation
    return 85 + Math.random() * 10; // Mock health score
  };

  const calculateTotalRevenue = (): number => {
    // Mock revenue calculation
    return Math.floor(Math.random() * 100000 + 50000);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'crops', label: 'Crop Management', icon: Crop },
    { id: 'pricing', label: 'Price Monitoring', icon: DollarSign },
    { id: 'schemes', label: 'Government Schemes', icon: Shield },
    { id: 'support', label: 'Support Tickets', icon: HeadphonesIcon },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'system', label: 'System', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab stats={stats} health={systemHealth} activity={recentActivity} />;
      case 'users':
        return <UsersTab />;
      case 'crops':
        return <CropsTab />;
      case 'pricing':
        return <PricingTab />;
      case 'schemes':
        return <SchemesTab />;
      case 'support':
        return <SupportTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'system':
        return <SystemTab health={systemHealth} />;
      default:
        return <OverviewTab stats={stats} health={systemHealth} activity={recentActivity} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {admin?.full_name}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor('healthy')}`}>
                {admin?.role}
              </span>
              <button
                onClick={() => onNavigate('home')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                title="Back to App"
              >
                <Globe className="h-5 w-5" />
              </button>
              <button
                onClick={signOut}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white shadow-lg overflow-hidden`}>
          <nav className="mt-5 px-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mb-1 transition-colors ${
                    activeTab === item.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, health, activity }: {
  stats: DashboardStats;
  health: SystemHealth;
  activity: RecentActivity[];
}) => {
  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Recommendations',
      value: stats.activeRecommendations.toLocaleString(),
      icon: Crop,
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Price Queries',
      value: stats.priceQueries.toLocaleString(),
      icon: DollarSign,
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Support Tickets',
      value: stats.supportTickets.toLocaleString(),
      icon: AlertTriangle,
      change: '-5%',
      changeType: 'positive'
    },
    {
      title: 'System Health',
      value: `${Math.round(stats.systemHealth)}%`,
      icon: Activity,
      change: '+2%',
      changeType: 'positive'
    },
    {
      title: 'Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      change: '+18%',
      changeType: 'positive'
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className={`text-green-600 font-medium`}>{stat.change}</span>
                <span className="text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">API Status</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                health.api_status === 'healthy' ? 'bg-green-100 text-green-800' :
                health.api_status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {health.api_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Database</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                health.database_status === 'healthy' ? 'bg-green-100 text-green-800' :
                health.database_status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {health.database_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Response Time</span>
              <span className="text-sm text-gray-600">{Math.round(health.response_time)}ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Error Rate</span>
              <span className="text-sm text-gray-600">{health.error_rate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Uptime</span>
              <span className="text-sm text-green-600">{health.uptime}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activity.slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  item.type === 'ERROR' ? 'bg-red-500' :
                  item.type === 'WARN' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {activity.length === 0 && (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Placeholder components for other tabs
const UsersTab = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">User Management</h2>
    <p className="text-gray-600">User management interface will be implemented here.</p>
  </div>
);

const CropsTab = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">Crop Management</h2>
    <p className="text-gray-600">Crop management interface will be implemented here.</p>
  </div>
);

const PricingTab = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">Price Monitoring</h2>
    <p className="text-gray-600">Price monitoring interface will be implemented here.</p>
  </div>
);

const SchemesTab = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">Government Schemes</h2>
    <p className="text-gray-600">Government schemes management will be implemented here.</p>
  </div>
);

const SupportTab = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">Support Tickets</h2>
    <p className="text-gray-600">Support ticket management will be implemented here.</p>
  </div>
);

const AnalyticsTab = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">Analytics</h2>
    <p className="text-gray-600">Analytics and reporting will be implemented here.</p>
  </div>
);

const SystemTab = ({ health }: { health: SystemHealth }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">System Settings</h2>
    <p className="text-gray-600">System configuration and settings will be implemented here.</p>
  </div>
);

export default AdminDashboard;