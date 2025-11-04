import { useEffect, useState } from 'react';
import { Building2, ExternalLink, Search, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Scheme {
  id: string;
  title: string;
  description: string | null;
  eligibility: string | null;
  benefits: string | null;
  application_link: string | null;
  state: string | null;
  category: string | null;
}

export default function GovernmentSchemes() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filteredSchemes, setFilteredSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    fetchSchemes();
  }, []);

  useEffect(() => {
    filterSchemes();
  }, [searchTerm, selectedCategory, schemes]);

  const fetchSchemes = async () => {
    try {
      const { data, error } = await supabase
        .from('government_schemes')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;

      if (data) {
        setSchemes(data);
        setFilteredSchemes(data);

        const uniqueCategories = [
          'All',
          ...Array.from(new Set(data.map((s) => s.category).filter(Boolean))),
        ];
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSchemes = () => {
    let filtered = schemes;

    if (searchTerm) {
      filtered = filtered.filter(
        (scheme) =>
          scheme.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (scheme.description && scheme.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((scheme) => scheme.category === selectedCategory);
    }

    setFilteredSchemes(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Building2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Government Schemes</h1>
          <p className="text-xl text-gray-600">
            Explore agricultural subsidies, loans, and welfare programs available for farmers
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schemes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="h-20 w-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">No schemes found matching your criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredSchemes.map((scheme) => (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 flex-1">{scheme.title}</h3>
                  {scheme.category && (
                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                      {scheme.category}
                    </span>
                  )}
                </div>

                {scheme.description && (
                  <p className="text-gray-700 mb-4 leading-relaxed">{scheme.description}</p>
                )}

                {scheme.eligibility && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Eligibility:</h4>
                    <p className="text-gray-600 text-sm">{scheme.eligibility}</p>
                  </div>
                )}

                {scheme.benefits && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Benefits:</h4>
                    <p className="text-gray-600 text-sm">{scheme.benefits}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  {scheme.state && (
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">State:</span> {scheme.state}
                    </div>
                  )}
                  {scheme.application_link && (
                    <a
                      href={scheme.application_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-semibold transition"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}