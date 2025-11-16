import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendChart, BarChartComponent, PieChartComponent } from './Charts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  CheckCircle,
  Info
} from 'lucide-react';

interface PriceData {
  id: string;
  crop_name: string;
  current_price: number;
  predicted_price: number;
  change_percentage: number;
  confidence_level: number;
  market_location: string;
  prediction_date: string;
  created_at: string;
}

interface MarketStats {
  totalPredictions: number;
  averageAccuracy: number;
  priceIncrease: number;
  priceDecrease: number;
  stable: number;
  avgConfidence: number;
}

const PriceMonitor = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [stats, setStats] = useState<MarketStats>({
    totalPredictions: 0,
    averageAccuracy: 0,
    priceIncrease: 0,
    priceDecrease: 0,
    stable: 0,
    avgConfidence: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPriceData();
  }, []);

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('price_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setPriceData(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching price data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchPriceData();
    setRefreshing(false);
  };

  const calculateStats = (data: PriceData[]) => {
    const total = data.length;
    const increase = data.filter(d => d.change_percentage > 2).length;
    const decrease = data.filter(d => d.change_percentage < -2).length;
    const stable = total - increase - decrease;
    const avgConfidence = data.reduce((sum, d) => sum + d.confidence_level, 0) / total || 0;

    setStats({
      totalPredictions: total,
      averageAccuracy: 87.5, // Mock accuracy
      priceIncrease: increase,
      priceDecrease: decrease,
      stable: stable,
      avgConfidence: avgConfidence
    });
  };

  const filteredData = priceData.filter(item => {
    const cropMatch = selectedCrop === 'all' || item.crop_name === selectedCrop;
    const locationMatch = selectedLocation === 'all' || item.market_location === selectedLocation;
    return cropMatch && locationMatch;
  });

  // Chart data preparation
  const prepareChartData = () => {
    const cropCounts = filteredData.reduce((acc, item) => {
      acc[item.crop_name] = (acc[item.crop_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(cropCounts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const prepareTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayData = filteredData.filter(item =>
        item.created_at.split('T')[0] === date
      );

      return {
        name: date,
        value: dayData.length,
        predictions: dayData.length,
        avgConfidence: dayData.length > 0
          ? dayData.reduce((sum, d) => sum + d.confidence_level, 0) / dayData.length
          : 0
      };
    });
  };

  
  const uniqueCrops = Array.from(new Set(priceData.map(item => item.crop_name)));
  const uniqueLocations = Array.from(new Set(priceData.map(item => item.market_location)));

  const exportPriceData = () => {
    const csvContent = [
      ['Crop', 'Current Price', 'Predicted Price', 'Change %', 'Confidence', 'Location', 'Date'].join(','),
      ...filteredData.map(item => [
        item.crop_name,
        item.current_price,
        item.predicted_price,
        item.change_percentage.toFixed(2),
        item.confidence_level,
        item.market_location,
        item.created_at
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price_predictions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Crops</option>
              {uniqueCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Locations</option>
              {uniqueLocations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportPriceData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPredictions}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{stats.averageAccuracy}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-purple-600">
                {(stats.avgConfidence * 100).toFixed(1)}%
              </p>
            </div>
            <Info className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Price Trends</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stats.priceIncrease}
                </span>
                <span className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  {stats.priceDecrease}
                </span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TrendChart
          data={prepareTrendData()}
          title="Prediction Trends (Last 7 Days)"
          dataKey="predictions"
          color="#10b981"
        />

        <BarChartComponent
          data={prepareChartData()}
          title="Crop Prediction Distribution"
          dataKey="value"
          color="#3b82f6"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <TrendChart
          data={prepareTrendData()}
          title="Average Confidence Level"
          dataKey="avgConfidence"
          color="#8b5cf6"
        />

        <PieChartComponent
          data={[
            { name: 'Price Increase', value: stats.priceIncrease },
            { name: 'Price Decrease', value: stats.priceDecrease },
            { name: 'Stable', value: stats.stable }
          ]}
          title="Price Movement Distribution"
        />
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Predictions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crop
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Predicted Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.slice(0, 10).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.crop_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.market_location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.current_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{item.predicted_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`flex items-center ${
                      item.change_percentage > 0 ? 'text-green-600' :
                      item.change_percentage < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {item.change_percentage > 0 && <TrendingUp className="h-4 w-4 mr-1" />}
                      {item.change_percentage < 0 && <TrendingDown className="h-4 w-4 mr-1" />}
                      {item.change_percentage.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${item.confidence_level * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {(item.confidence_level * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PriceMonitor;