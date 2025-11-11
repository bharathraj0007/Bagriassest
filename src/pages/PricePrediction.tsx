import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PricePredictionProps {
  onNavigate: (page: string) => void;
}

interface PredictionResult {
  crop_name: string;
  current_price: number;
  predicted_price: number;
  change_percentage: number;
  prediction_date: string;
}

export default function PricePrediction({ onNavigate }: PricePredictionProps) {
  const { user } = useAuth();
  const [cropName, setCropName] = useState('');
  const [marketLocation, setMarketLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [crops, setCrops] = useState<string[]>([]);

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('name')
        .order('name');

      if (error) throw error;
      if (data) {
        setCrops(data.map((c) => c.name));
      }
    } catch (error) {
      console.error('Error fetching crops:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to get price predictions');
      onNavigate('auth');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/price-prediction`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crop_name: cropName,
          market_location: marketLocation,
        }),
      });

      const result = await response.json();

      if (result.prediction) {
        setPrediction(result.prediction);

        const { error } = await supabase.from('price_predictions').insert({
          user_id: user.id,
          crop_name: cropName,
          current_price: result.prediction.current_price,
          predicted_price: result.prediction.predicted_price,
          prediction_date: result.prediction.prediction_date,
          market_location: marketLocation,
        });
        if (error) {
          console.error('Error saving prediction:', error);
          alert('Error saving prediction. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error getting price prediction:', error);
      alert('Error getting price prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <TrendingUp className="h-20 w-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access price predictions</p>
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <TrendingUp className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Crop Price Prediction</h1>
          <p className="text-xl text-gray-600">
            Forecast future crop prices to make informed selling decisions
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Enter Crop Details</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Crop
              </label>
              <select
                required
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Choose a crop</option>
                {crops.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-5 w-5 mr-2 text-red-600" />
                Market Location
              </label>
              <input
                type="text"
                required
                value={marketLocation}
                onChange={(e) => setMarketLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., Mumbai, Delhi, Bangalore"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Predicting...' : 'Get Price Prediction'}
            </button>
          </form>
        </div>

        {prediction && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Prediction Results</h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-blue-50 rounded-xl">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Crop</div>
                  <div className="text-2xl font-bold text-gray-900">{prediction.crop_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Market</div>
                  <div className="text-lg font-semibold text-gray-900">{marketLocation}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="text-sm text-gray-600">Current Price</div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    ₹{prediction.current_price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">per quintal</div>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                    <div className="text-sm text-gray-600">Predicted Price</div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900">
                    ₹{prediction.predicted_price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">per quintal</div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Expected Change</div>
                    <div
                      className={`text-3xl font-bold ${
                        prediction.change_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {prediction.change_percentage >= 0 ? '+' : ''}
                      {prediction.change_percentage.toFixed(2)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-5 w-5" />
                      <div className="text-sm">
                        Forecast for
                        <div className="font-semibold text-gray-900">
                          {new Date(prediction.prediction_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">Recommendation</h3>
                <p className="text-gray-700">
                  {prediction.change_percentage >= 5
                    ? 'Market conditions are favorable. Consider holding your crop for better returns.'
                    : prediction.change_percentage >= 0
                    ? 'Slight price increase expected. Monitor market conditions closely.'
                    : prediction.change_percentage >= -5
                    ? 'Minor price decline expected. Consider selling soon if current prices are satisfactory.'
                    : 'Significant price decline predicted. Consider selling at current market rates.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}