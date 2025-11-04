import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Recommendation from './pages/Recommendation';
import Insights from './pages/Insights';
import PricePrediction from './pages/PricePrediction';
import GovernmentSchemes from './pages/GovernmentSchemes';
import Marketing from './pages/Marketing';
import Support from './pages/Support';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-green-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading AgriSmart...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'auth':
        return <Auth onNavigate={setCurrentPage} />;
      case 'recommendation':
        return <Recommendation onNavigate={setCurrentPage} />;
      case 'insights':
        return <Insights onNavigate={setCurrentPage} />;
      case 'price-prediction':
        return <PricePrediction onNavigate={setCurrentPage} />;
      case 'government-schemes':
        return <GovernmentSchemes />;
      case 'marketing':
        return <Marketing onNavigate={setCurrentPage} />;
      case 'support':
        return <Support onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen">
      {currentPage !== 'auth' && (
        <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
      )}
      {renderPage()}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
