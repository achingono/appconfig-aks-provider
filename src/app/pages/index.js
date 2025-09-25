import React, { useState } from 'react';
import BooksPage from '../src/pages/BooksPage';
import RatingsPage from '../src/pages/RatingsPage';
import ServerConfigService from '../lib/serverConfigService';

const HomePage = ({ initialConfig }) => {
  const [appConfig, setAppConfig] = useState(initialConfig);
  const [currentPage, setCurrentPage] = useState('books');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-secondary text-white p-5 mb-5">
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
              className="btn btn-primary text-xs"
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
          </div>
        </div>

        <nav className="max-w-7xl mx-auto mt-5 flex gap-2">
          <button
            onClick={() => setCurrentPage('books')}
            className={`px-5 py-2 rounded border border-primary transition-colors ${
              currentPage === 'books' 
                ? 'bg-primary text-white' 
                : 'bg-transparent text-white hover:bg-primary'
            }`}
          >
            Books
          </button>
          {appConfig.features?.enableRatings && (
            <button
              onClick={() => setCurrentPage('ratings')}
              className={`px-5 py-2 rounded border border-primary transition-colors ${
                currentPage === 'ratings' 
                  ? 'bg-primary text-white' 
                  : 'bg-transparent text-white hover:bg-primary'
              }`}
            >
              Ratings
            </button>
          )}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-5">
        {currentPage === 'books' ? (
          <BooksPage appConfig={appConfig} />
        ) : currentPage === 'ratings' ? (
          <RatingsPage appConfig={appConfig} />
        ) : (
          <div className="text-center py-10">Page not found</div>
        )}
      </main>

      <footer className="bg-dark text-white text-center p-5 mt-10">
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
