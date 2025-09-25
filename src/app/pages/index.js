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
    <div className="app">
      <header style={{ 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>
              Book Management System
            </h1>
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              Powered by Server-Side Configuration
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={refreshConfiguration}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Refresh Config
            </button>
            <div style={{ 
              fontSize: '12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '8px 12px',
              borderRadius: '4px'
            }}>
              Theme: {appConfig.ui?.theme || 'default'} | 
              PageSize: {appConfig.ui?.pageSize || 10}
            </div>
            <div style={{ 
              fontSize: '12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: '8px 12px',
              borderRadius: '4px'
            }}>
              API: {appConfig.api?.baseUrl || 'Default'}
            </div>
          </div>
        </div>

        <nav style={{ 
          maxWidth: '1200px', 
          margin: '20px auto 0',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setCurrentPage('books')}
            style={{
              backgroundColor: currentPage === 'books' ? '#3498db' : 'transparent',
              color: 'white',
              border: '1px solid #3498db',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Books
          </button>
          {appConfig.features?.enableRatings && (
            <button
              onClick={() => setCurrentPage('ratings')}
              style={{
                backgroundColor: currentPage === 'ratings' ? '#3498db' : 'transparent',
                color: 'white',
                border: '1px solid #3498db',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Ratings
            </button>
          )}
        </nav>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {currentPage === 'books' ? (
          <BooksPage appConfig={appConfig} />
        ) : currentPage === 'ratings' ? (
          <RatingsPage appConfig={appConfig} />
        ) : (
          <div>Page not found</div>
        )}
      </main>

      <footer style={{ 
        backgroundColor: '#34495e',
        color: 'white',
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '14px', marginBottom: '10px' }}>
            Configuration Status: {appConfig.settings ? 'Loaded from mounted settings.json' : 'Using Defaults'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Features: DarkMode {appConfig.features?.enableDarkMode ? '✓' : '✗'} | 
            Ratings {appConfig.features?.enableRatings ? '✓' : '✗'} | 
            Color Scheme: {appConfig.ui?.theme || 'default'}
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
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
