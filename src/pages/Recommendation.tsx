import { useState, useEffect } from 'react';
import { MapPin, Droplets, Thermometer, Wind, Gauge, Beaker, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RecommendationProps {
  onNavigate: (page: string) => void;
}

interface FormData {
  soilPh: string;
  soilType: string;
  temperature: string;
  humidity: string;
  airQuality: string;
  rainfall: string;
  season: string;
  location: string;
  latitude: string;
  longitude: string;
}

interface CropRecommendation {
  name: string;
  confidence: number;
  reason: string;
}

export default function Recommendation({ onNavigate }: RecommendationProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [recommendations, setRecommendations] = useState<CropRecommendation[]>([]);
  const [formData, setFormData] = useState<FormData>({
    soilPh: '',
    soilType: '',
    temperature: '',
    humidity: '',
    airQuality: '',
    rainfall: '',
    season: '',
    location: '',
    latitude: '',
    longitude: '',
  });

  const soilTypes = ['Clay', 'Sandy', 'Loamy', 'Black', 'Alluvial', 'Sandy Loam'];
  const seasons = ['Kharif', 'Rabi', 'Zaid', 'Year-round'];

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const locationName = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setFormData((prev) => ({
            ...prev,
            location: locationName,
          }));
        } catch (error) {
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          }));
        }
        setFetchingLocation(false);
      },
      (error) => {
        alert('Unable to retrieve location: ' + error.message);
        setFetchingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to get recommendations');
      onNavigate('auth');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crop-recommendation`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          soil_ph: parseFloat(formData.soilPh),
          soil_type: formData.soilType,
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          air_quality: parseFloat(formData.airQuality),
          rainfall: parseFloat(formData.rainfall),
          season: formData.season,
        }),
      });

      const result = await response.json();

      if (result.recommendations) {
        setRecommendations(result.recommendations);

        await supabase.from('recommendations').insert({
          user_id: user.id,
          soil_ph: parseFloat(formData.soilPh),
          soil_type: formData.soilType,
          temperature: parseFloat(formData.temperature),
          humidity: parseFloat(formData.humidity),
          air_quality: parseFloat(formData.airQuality),
          rainfall: parseFloat(formData.rainfall),
          location: formData.location,
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null,
          season: formData.season,
          recommended_crops: result.recommendations,
          confidence_score: result.recommendations[0]?.confidence || 0,
        });
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
      alert('Error getting recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Leaf className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Crop Recommendation System</h1>
          <p className="text-xl text-gray-600">
            Enter your soil and weather data to get personalized crop recommendations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Input Parameters</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Beaker className="h-5 w-5 mr-2 text-blue-600" />
                  Soil pH (0-14)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="14"
                  required
                  value={formData.soilPh}
                  onChange={(e) => handleInputChange('soilPh', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., 6.5"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Gauge className="h-5 w-5 mr-2 text-amber-600" />
                  Soil Type
                </label>
                <select
                  required
                  value={formData.soilType}
                  onChange={(e) => handleInputChange('soilType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select soil type</option>
                  {soilTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Thermometer className="h-5 w-5 mr-2 text-red-600" />
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="°C"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Droplets className="h-5 w-5 mr-2 text-blue-600" />
                    Humidity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.humidity}
                    onChange={(e) => handleInputChange('humidity', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="%"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Wind className="h-5 w-5 mr-2 text-gray-600" />
                    Air Quality (AQI)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="500"
                    required
                    value={formData.airQuality}
                    onChange={(e) => handleInputChange('airQuality', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0-500"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Droplets className="h-5 w-5 mr-2 text-cyan-600" />
                    Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={formData.rainfall}
                    onChange={(e) => handleInputChange('rainfall', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="mm"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Leaf className="h-5 w-5 mr-2 text-green-600" />
                  Season
                </label>
                <select
                  required
                  value={formData.season}
                  onChange={(e) => handleInputChange('season', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select season</option>
                  {seasons.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-5 w-5 mr-2 text-red-600" />
                  Location
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter location or use GPS"
                  />
                  <button
                    type="button"
                    onClick={fetchLocation}
                    disabled={fetchingLocation}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {fetchingLocation ? 'Fetching...' : 'GPS'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Processing...' : 'Get Recommendations'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommended Crops</h2>

            {recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Leaf className="h-20 w-20 mb-4" />
                <p className="text-lg">Enter your data to get crop recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((crop, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full text-green-600 font-bold">
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{crop.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(crop.confidence)}%
                        </div>
                        <div className="text-xs text-gray-500">Confidence</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${crop.confidence}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-600 text-sm">{crop.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}