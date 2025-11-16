import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Crop {
  id: string;
  name: string;
  scientific_name: string;
  description: string;
  season: string;
  optimal_ph_min: number;
  optimal_ph_max: number;
  optimal_temp_min: number;
  optimal_temp_max: number;
  optimal_humidity_min: number;
  optimal_humidity_max: number;
  optimal_rainfall_min: number;
  optimal_rainfall_max: number;
  suitable_soil_types: string[];
  growth_duration_days: number;
  created_at: string;
}

const CropManager = () => {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeason, setFilterSeason] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [formData, setFormData] = useState<Partial<Crop>>({});

  useEffect(() => {
    fetchCrops();
  }, []);

  const fetchCrops = async () => {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .order('name');

      if (error) throw error;
      setCrops(data || []);
    } catch (error) {
      console.error('Error fetching crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCrops = crops.filter(crop => {
    const matchesSearch = crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         crop.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeason = filterSeason === 'all' || crop.season === filterSeason;
    return matchesSearch && matchesSeason;
  });

  const handleAddCrop = async () => {
    try {
      const { error } = await supabase
        .from('crops')
        .insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({});
      fetchCrops();
    } catch (error) {
      console.error('Error adding crop:', error);
      alert('Error adding crop. Please try again.');
    }
  };

  const handleEditCrop = async () => {
    if (!selectedCrop) return;

    try {
      const { error } = await supabase
        .from('crops')
        .update(formData)
        .eq('id', selectedCrop.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedCrop(null);
      setFormData({});
      fetchCrops();
    } catch (error) {
      console.error('Error updating crop:', error);
      alert('Error updating crop. Please try again.');
    }
  };

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm('Are you sure you want to delete this crop?')) return;

    try {
      const { error } = await supabase
        .from('crops')
        .delete()
        .eq('id', cropId);

      if (error) throw error;
      fetchCrops();
    } catch (error) {
      console.error('Error deleting crop:', error);
      alert('Error deleting crop. Please try again.');
    }
  };

  const openEditModal = (crop: Crop) => {
    setSelectedCrop(crop);
    setFormData(crop);
    setShowEditModal(true);
  };

  const exportCrops = () => {
    const csvContent = [
      ['Name', 'Scientific Name', 'Season', 'pH Range', 'Temp Range', 'Rainfall Range', 'Growth Duration'].join(','),
      ...filteredCrops.map(crop => [
        crop.name,
        crop.scientific_name,
        crop.season,
        `${crop.optimal_ph_min}-${crop.optimal_ph_max}`,
        `${crop.optimal_temp_min}-${crop.optimal_temp_max}`,
        `${crop.optimal_rainfall_min}-${crop.optimal_rainfall_max}`,
        crop.growth_duration_days
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crops.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const seasons = ['all', 'Kharif', 'Rabi', 'Summer', 'Winter', 'Monsoon', 'Year-round'];

  return (
    <div>
      {/* Header Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search crops..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={filterSeason}
              onChange={(e) => setFilterSeason(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {seasons.map(season => (
                <option key={season} value={season}>
                  {season === 'all' ? 'All Seasons' : season}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Crop
            </button>

            <button
              onClick={exportCrops}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Crops Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crop Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scientific Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Season
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    pH Range
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature (°C)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rainfall (mm)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCrops.map((crop) => (
                  <tr key={crop.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{crop.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {crop.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <em>{crop.scientific_name}</em>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {crop.season}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {crop.optimal_ph_min} - {crop.optimal_ph_max}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {crop.optimal_temp_min} - {crop.optimal_temp_max}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {crop.optimal_rainfall_min} - {crop.optimal_rainfall_max}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {crop.growth_duration_days} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(crop)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCrop(crop.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showAddModal ? 'Add New Crop' : 'Edit Crop'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scientific Name
                  </label>
                  <input
                    type="text"
                    value={formData.scientific_name || ''}
                    onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season *
                  </label>
                  <select
                    value={formData.season || ''}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Season</option>
                    {seasons.filter(s => s !== 'all').map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Growth Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={formData.growth_duration_days || ''}
                    onChange={(e) => setFormData({ ...formData, growth_duration_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    pH Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Min"
                      value={formData.optimal_ph_min || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_ph_min: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Max"
                      value={formData.optimal_ph_max || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_ph_max: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature Range (°C)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.optimal_temp_min || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_temp_min: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.optimal_temp_max || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_temp_max: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Humidity Range (%)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.optimal_humidity_min || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_humidity_min: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.optimal_humidity_max || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_humidity_max: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rainfall Range (mm)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.optimal_rainfall_min || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_rainfall_min: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.optimal_rainfall_max || ''}
                      onChange={(e) => setFormData({ ...formData, optimal_rainfall_max: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter crop description..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setFormData({});
                  setSelectedCrop(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={showAddModal ? handleAddCrop : handleEditCrop}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {showAddModal ? 'Add Crop' : 'Update Crop'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropManager;