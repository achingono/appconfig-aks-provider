// Simple client-side configuration service for Next.js
// Configuration is loaded server-side and passed as props
class AppConfigService {
  constructor() {
    this.settings = {};
    this.featureFlags = {};
    this.initialized = false;
  }

  // For Next.js, we don't need complex initialization
  // Configuration comes from server-side props
  async initialize() {
    this.initialized = true;
    return Promise.resolve();
  }

  // Simple getter methods for backward compatibility
  getSetting(key, defaultValue = null) {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  isFeatureEnabled(featureName) {
    return this.featureFlags[featureName] === true;
  }

  getPageSize() {
    const pageSizeConfig = this.getSetting('PageSize', { Default: 10 });
    if (typeof pageSizeConfig === 'object' && pageSizeConfig.Default) {
      return pageSizeConfig.Default;
    }
    return typeof pageSizeConfig === 'number' ? pageSizeConfig : 10;
  }

  getColorScheme() {
    return this.getSetting('ColorScheme', 'Blue');
  }

  // For Next.js, configuration refresh is handled by API calls
  async refreshConfiguration() {
    console.log('Configuration refresh handled by server-side API');
  }

  // Backward compatibility method
  async getConfiguration() {
    return {
      api: {
        baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5100/api',
        timeout: 10000
      },
      ui: {
        theme: this.getColorScheme().toLowerCase(),
        pageSize: this.getPageSize()
      },
      features: {
        enableRatings: this.isFeatureEnabled('Ratings'),
        enableDarkMode: this.isFeatureEnabled('DarkMode'),
        enableAdvancedSearch: true
      }
    };
  }
}

// Create singleton instance
const appConfigService = new AppConfigService();

export default appConfigService;
