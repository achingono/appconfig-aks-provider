import React, { useState } from 'react';
import BooksPage from '../src/pages/BooksPage';
import RatingsPage from '../src/pages/RatingsPage';
import ServerConfigService from '../lib/serverConfigService';

const HomePage = ({ initialConfig }) => {
  const [appConfig, setAppConfig] = useState(initialConfig);
  const [currentPage, setCurrentPage] = useState('books');
  const [ratingsBookFilter, setRatingsBookFilter] = useState(null);

  const refreshConfiguration = async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        setAppConfig(config);
        console.log('Configuration refreshed:', config);
      }
    } catch (error) {
      console.error('Failed to refresh configuration:', error);
    }
  };

  const handleViewRatings = (bookId, bookTitle) => {
    setRatingsBookFilter({ bookId, bookTitle });
    setCurrentPage('ratings');
  };

  const handleNavigateToRatings = () => {
    setRatingsBookFilter(null); // Clear any book filter
    setCurrentPage('ratings');
  };

  // Determine theme classes and colors
  const isDarkMode = appConfig.features?.enableDarkMode;
  const colorScheme = appConfig.ui?.theme || 'blue';
  const themeClasses = `${isDarkMode ? 'dark' : ''}`.trim();

  // Define color schemes with inline styles
  const colors = {
    blue: {
      primary: '#3498db',
      secondary: '#2c3e50',
      primaryHover: '#2980b9',
      secondaryHover: '#34495e',
    },
    green: {
      primary: '#27ae60',
      secondary: '#1e3a2e',
      primaryHover: '#219a52',
      secondaryHover: '#2c5530',
    }
  };

  const currentColors = colors[colorScheme] || colors.blue;

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors ${themeClasses}`}>
      <header 
        className="text-white p-5 mb-5 transition-colors"
        style={{ backgroundColor: currentColors.secondary }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-5">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Book Management System
            </h1>
            <div className="text-sm opacity-80">
              Powered by Server-Side Configuration
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={refreshConfiguration}
              className="px-3 py-2 rounded transition-colors text-xs font-medium"
              style={{ backgroundColor: currentColors.primary }}
              onMouseEnter={(e) => e.target.style.backgroundColor = currentColors.primaryHover}
              onMouseLeave={(e) => e.target.style.backgroundColor = currentColors.primary}
            >
              Refresh Config
            </button>
            <div className="text-xs bg-white bg-opacity-10 px-3 py-2 rounded">
              Theme: {appConfig.ui?.theme || 'default'} | 
              PageSize: {appConfig.ui?.pageSize || 10}
            </div>
            <div className="text-xs bg-white bg-opacity-10 px-3 py-2 rounded">
              API: {appConfig.api?.baseUrl || 'Default'}
            </div>
            {isDarkMode && (
              <div className="text-xs bg-white bg-opacity-10 px-3 py-2 rounded">
                🌙 Dark Mode
              </div>
            )}
          </div>
        </div>

        <nav className="max-w-7xl mx-auto mt-5 flex gap-2">
          <button
            onClick={() => setCurrentPage('books')}
            className="px-5 py-2 rounded transition-colors text-white font-medium"
            style={{
              backgroundColor: currentPage === 'books' ? currentColors.primary : 'transparent',
              border: `1px solid ${currentColors.primary}`,
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 'books') {
                e.target.style.backgroundColor = currentColors.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 'books') {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            Books
          </button>
          {appConfig.features?.enableRatings && (
            <button
              onClick={handleNavigateToRatings}
              className="px-5 py-2 rounded transition-colors text-white font-medium"
              style={{
                backgroundColor: currentPage === 'ratings' ? currentColors.primary : 'transparent',
                border: `1px solid ${currentColors.primary}`,
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 'ratings') {
                  e.target.style.backgroundColor = currentColors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'ratings') {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              Ratings
            </button>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-5 pb-10">
        {currentPage === 'books' && (
          <BooksPage 
            onViewRatings={handleViewRatings} 
            currentColors={currentColors}
          />
        )}
        {currentPage === 'ratings' && (
          <RatingsPage 
            bookFilter={ratingsBookFilter} 
            currentColors={currentColors}
          />
        )}
      </main>

      <footer 
        className="text-white text-center p-5 mt-10 transition-colors"
        style={{ backgroundColor: currentColors.secondary }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-sm mb-2">
            Configuration Status: {appConfig.settings ? 'Loaded from mounted settings.json' : 'Using Defaults'}
          </div>
          <div className="text-xs opacity-70">
            Features: DarkMode {appConfig.features?.enableDarkMode ? '✓' : '✗'} | 
            Ratings {appConfig.features?.enableRatings ? '✓' : '✗'} | 
            Color Scheme: {appConfig.ui?.theme || 'default'}
          </div>
          <div className="text-xs opacity-70 mt-1">
            Book Management System • Server-Side Rendered Configuration
          </div>
        </div>
      </footer>
    </div>
  );
};

// Server-side rendering function to load configuration from mounted settings.json
export async function getServerSideProps() {
  const configService = new ServerConfigService();
  const initialConfig = configService.getAppConfiguration();

  return {
    props: {
      initialConfig,
    },
  };
}

export default HomePage;
