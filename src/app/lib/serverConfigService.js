import fs from 'fs';
import path from 'path';

// Server-side configuration service that reads from mounted settings.json
class ServerConfigService {
  constructor() {
    this.configPath = '/app/settings.json';
    this.config = null;
  }

  loadConfiguration() {
    try {
      // Read the mounted settings.json file
      console.log(`Server: Attempting to read configuration from ${this.configPath}`);
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf8');
        this.config = JSON.parse(configContent);
        console.log('Server: Configuration loaded from mounted settings.json:', JSON.stringify(this.config, null, 2));
        return this.config;
      } else {
        console.warn(`Server: Settings file not found at ${this.configPath}, using fallback`);
        console.log('Server: Available files in /app:', fs.readdirSync('/app').join(', '));
        return this.getFallbackConfig();
      }
    } catch (error) {
      console.error('Server: Error reading settings.json:', error);
      return this.getFallbackConfig();
    }
  }

  getFallbackConfig() {
    return {
      Settings: {
        ColorScheme: "Blue",
        PageSize: {
          Default: 10,
          Max: 200
        }
      },
      feature_management: {
        feature_flags: [
          {
            id: "DarkMode",
            enabled: false
          },
          {
            id: "Ratings", 
            enabled: true
          }
        ]
      }
    };
  }

  getAppConfiguration() {
    const config = this.config || this.loadConfiguration();
    
    const pageSize = config.Settings?.PageSize || { Default: 10, Max: 200 };
    const featureFlags = config.feature_management?.feature_flags || [];
    
    const features = {};
    featureFlags.forEach(flag => {
      features[flag.id] = flag.enabled === true || flag.enabled === 'true';
    });

    return {
      api: {
        baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5100/api',
        timeout: 10000
      },
      ui: {
        theme: config.Settings?.ColorScheme?.toLowerCase() || 'blue',
        pageSize: pageSize.Default || 10,
        maxPageSize: pageSize.Max || 200
      },
      features: {
        enableRatings: features.Ratings || false,
        enableDarkMode: features.DarkMode || false,
        enableAdvancedSearch: true
      },
      settings: config.Settings || {},
      featureFlags: features
    };
  }
}

export default ServerConfigService;
