import { Sprout, TrendingUp, Cloud, Shield, BarChart3, Award } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const features = [
    {
      icon: Sprout,
      title: 'Smart Crop Recommendation',
      description: 'Get personalized crop suggestions based on soil, weather, and location data using advanced ML models.',
      action: 'recommendation',
    },
    {
      icon: TrendingUp,
      title: 'Price Prediction',
      description: 'Forecast crop prices to make informed decisions about when to sell your produce.',
      action: 'price-prediction',
    },
    {
      icon: BarChart3,
      title: 'Insights & Analytics',
      description: 'Visualize trends, track your farming history, and get data-driven insights.',
      action: 'insights',
    },
    {
      icon: Shield,
      title: 'Government Schemes',
      description: 'Access information about agricultural subsidies, loans, and welfare programs.',
      action: 'government-schemes',
    },
  ];

  const stats = [
    { value: '50+', label: 'Crops Supported' },
    { value: '95%', label: 'Accuracy Rate' },
    { value: '24/7', label: 'Support Available' },
    { value: '100+', label: 'Government Schemes' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Smart Agricultural Solutions
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-50 max-w-3xl mx-auto">
              Empowering farmers with AI-driven crop recommendations, price predictions, and data-driven insights for sustainable farming
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('recommendation')}
                className="px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition shadow-lg transform hover:scale-105"
              >
                Get Crop Recommendation
              </button>
              <button
                onClick={() => onNavigate('insights')}
                className="px-8 py-4 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition shadow-lg transform hover:scale-105"
              >
                View Insights
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(240 253 244)"/>
          </svg>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="transform hover:scale-110 transition">
                <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Agricultural Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to make informed farming decisions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition transform hover:-translate-y-2"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Icon className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{feature.description}</p>
                      <button
                        onClick={() => onNavigate(feature.action)}
                        className="text-green-600 font-semibold hover:text-green-700 transition"
                      >
                        Learn more →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Cloud className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Weather-Based Insights
            </h2>
            <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
              Our system analyzes real-time weather data, soil conditions, and historical patterns to provide accurate recommendations
            </p>
            <button
              onClick={() => onNavigate('recommendation')}
              className="px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition shadow-lg"
            >
              Try Now
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                <Award className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Certified & Trusted</h3>
              <p className="text-gray-600">
                Backed by agricultural research and trusted by thousands of farmers
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <Sprout className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sustainable Farming</h3>
              <p className="text-gray-600">
                Promote eco-friendly practices and maximize yield sustainably
              </p>
            </div>
            <div className="text-center p-6">
              <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
                <TrendingUp className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Increased Profits</h3>
              <p className="text-gray-600">
                Make data-driven decisions to boost your agricultural income
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}