import { useState } from 'react';
import { Menu, X, Leaf, User, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export default function Navbar({ onNavigate, currentPage }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Recommendation', id: 'recommendation' },
    { name: 'Insights', id: 'insights' },
    { name: 'Price Prediction', id: 'price-prediction' },
    { name: 'Government Schemes', id: 'government-schemes' },
    { name: 'Marketing', id: 'marketing' },
    { name: 'Support', id: 'support' },
    { name: 'Admin', id: 'admin-login', icon: Settings, adminOnly: true },
  ];

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition"
            >
              <Leaf className="h-8 w-8" />
              <span className="font-bold text-xl">AgriSmart</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              // Hide admin-only items if not logged in or not admin
              if (item.adminOnly && !user) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                    currentPage === item.id
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.name}
                </button>
              );
            })}
            {user ? (
              <div className="flex items-center space-x-3 border-l pl-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <span className="text-sm text-gray-700">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Sign In
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-green-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === item.id
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                {item.name}
              </button>
            ))}
            {user ? (
              <div className="border-t pt-2">
                <div className="px-3 py-2 text-sm text-gray-600">{user.email}</div>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onNavigate('auth');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}