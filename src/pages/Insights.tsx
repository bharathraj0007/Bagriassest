import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, MapPin, Leaf, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface InsightsProps {
  onNavigate: (page: string) => void;
}

interface RecommendationData {
  id: string;
  created_at: string;
  soil_type: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  season: string;
  location: string;
  recommended_crops: any;
}

export default function Insights({ onNavigate }: InsightsProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<RecommendationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRecommendations: 0,
    uniqueCrops: 0,
    avgTemperature: 0,
    avgRainfall: 0,
  });

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setHistory(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: RecommendationData[]) => {
    const uniqueCropsSet = new Set<string>();
    let totalTemp = 0;
    let totalRainfall = 0;

    data.forEach((rec) => {
      if (rec.recommended_crops && Array.isArray(rec.recommended_crops)) {
        rec.recommended_crops.forEach((crop: any) => {
          if (crop.name) uniqueCropsSet.add(crop.name);
        });
      }
      totalTemp += rec.temperature || 0;
      totalRainfall += rec.rainfall || 0;
    });

    setStats({
      totalRecommendations: data.length,
      uniqueCrops: uniqueCropsSet.size,
      avgTemperature: data.length > 0 ? totalTemp / data.length : 0,
      avgRainfall: data.length > 0 ? totalRainfall / data.length : 0,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <BarChart3 className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your insights and analytics</p>
          <button
            onClick={() => onNavigate('auth')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <BarChart3 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Insights & Analytics</h1>
          <p className="text-xl text-gray-600">Track your farming data and recommendations</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <Leaf className="h-10 w-10 text-green-600" />
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.totalRecommendations}
                </div>
                <div className="text-sm text-gray-600">Total Recommendations</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="h-10 w-10 text-blue-600" />
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.uniqueCrops}
                </div>
                <div className="text-sm text-gray-600">Unique Crops</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">🌡️</div>
                  <TrendingUp className="h-6 w-6 text-red-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.avgTemperature.toFixed(1)}°C
                </div>
                <div className="text-sm text-gray-600">Avg Temperature</div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">💧</div>
                  <TrendingUp className="h-6 w-6 text-cyan-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stats.avgRainfall.toFixed(0)} mm
                </div>
                <div className="text-sm text-gray-600">Avg Rainfall</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommendation History</h2>

              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Leaf className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No recommendations yet</p>
                  <button
                    onClick={() => onNavigate('recommendation')}
                    className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Get Your First Recommendation
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((rec) => (
                    <div
                      key={rec.id}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <div className="flex items-center space-x-3 mb-2 md:mb-0">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {new Date(rec.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {rec.location && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{rec.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Soil Type:</span>
                            <span className="font-semibold text-gray-900">{rec.soil_type}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Temperature:</span>
                            <span className="font-semibold text-gray-900">{rec.temperature}°C</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Humidity:</span>
                            <span className="font-semibold text-gray-900">{rec.humidity}%</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rainfall:</span>
                            <span className="font-semibold text-gray-900">{rec.rainfall} mm</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Season:</span>
                            <span className="font-semibold text-gray-900">{rec.season}</span>
                          </div>
                        </div>
                      </div>

                      {rec.recommended_crops && Array.isArray(rec.recommended_crops) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            Recommended Crops:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {rec.recommended_crops.slice(0, 5).map((crop: any, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                              >
                                {crop.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}