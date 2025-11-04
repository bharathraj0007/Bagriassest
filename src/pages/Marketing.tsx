import { ShoppingCart, Users, TrendingUp, Package, Globe, DollarSign } from 'lucide-react';

interface MarketingProps {
  onNavigate: (page: string) => void;
}

export default function Marketing({ onNavigate }: MarketingProps) {
  const features = [
    {
      icon: Globe,
      title: 'Direct Market Access',
      description: 'Connect directly with buyers and eliminate middlemen to maximize your profits.',
    },
    {
      icon: Users,
      title: 'Farmer Communities',
      description: 'Join local farmer groups to share knowledge and collaborate on bulk sales.',
    },
    {
      icon: TrendingUp,
      title: 'Market Trends',
      description: 'Stay updated with real-time market prices and demand forecasts.',
    },
    {
      icon: Package,
      title: 'Supply Chain Solutions',
      description: 'Access logistics and transportation services for efficient product delivery.',
    },
  ];

  const marketplaces = [
    {
      name: 'eNAM',
      description: 'National Agriculture Market - Trade agricultural produce online',
      url: 'https://www.enam.gov.in',
      logo: '🌾',
    },
    {
      name: 'Kisan Rath',
      description: 'Transportation of agricultural products during pandemic',
      url: 'https://kisanrath.nic.in',
      logo: '🚚',
    },
    {
      name: 'AgroStar',
      description: 'Agricultural inputs and services marketplace',
      url: 'https://www.agrostar.in',
      logo: '🌱',
    },
    {
      name: 'Ninjacart',
      description: 'Fresh produce supply chain platform',
      url: 'https://www.ninjacart.in',
      logo: '🥬',
    },
  ];

  const tips = [
    {
      icon: DollarSign,
      title: 'Price Negotiation',
      description: 'Know your crop value and negotiate confidently with buyers.',
    },
    {
      icon: Package,
      title: 'Quality Standards',
      description: 'Maintain proper grading and packaging to fetch better prices.',
    },
    {
      icon: TrendingUp,
      title: 'Timing',
      description: 'Understand seasonal demand patterns to maximize returns.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <section className="relative bg-gradient-to-r from-blue-600 to-green-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingCart className="h-16 w-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Agricultural Marketing</h1>
            <p className="text-xl text-green-50 max-w-2xl mx-auto">
              Connect with buyers, access markets, and grow your agricultural business
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Marketing Solutions</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive tools and platforms to help you sell your produce effectively
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-2"
              >
                <div className="inline-block p-3 bg-green-100 rounded-lg mb-4">
                  <Icon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Agricultural Marketplaces</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {marketplaces.map((marketplace, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-4xl">{marketplace.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{marketplace.name}</h3>
                    <p className="text-gray-600 mb-4">{marketplace.description}</p>
                    <a
                      href={marketplace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-semibold"
                    >
                      Visit Platform
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Marketing Tips for Better Returns</h2>
            <p className="text-green-50">Essential strategies to maximize your agricultural income</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {tips.map((tip, index) => {
              const Icon = tip.icon;
              return (
                <div key={index} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6">
                  <Icon className="h-10 w-10 mb-4" />
                  <h3 className="text-xl font-bold mb-2">{tip.title}</h3>
                  <p className="text-green-50">{tip.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How to Get Started</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Check Market Prices
                </h3>
                <p className="text-gray-600">
                  Use our price prediction tool to understand current and future market rates for your crops.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Register on Marketplaces
                </h3>
                <p className="text-gray-600">
                  Create accounts on relevant agricultural marketplaces and complete your seller profile.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  List Your Products
                </h3>
                <p className="text-gray-600">
                  Upload quality photos, accurate descriptions, and competitive prices for your produce.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Connect with Buyers
                </h3>
                <p className="text-gray-600">
                  Respond promptly to inquiries and negotiate fair prices for your products.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('price-prediction')}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Check Price Predictions
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}