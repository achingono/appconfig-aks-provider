from server.instance import server
from featuremanagement import FeatureManager
import sys, os, json

# Need to import all resources
from resources.books import *

config_path = os.environ.get('CONFIG_PATH', 'settings.json')
if not os.path.isabs(config_path):
    config_path = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), config_path)

# Load configuration with fallback
try:
    with open(config_path, "r", encoding="utf-8") as f:
        config_data = json.load(f)
    print(f"Loaded configuration from {config_path}")
except Exception as e:
    print(f"Warning: Could not load config from {config_path}: {e}")
    # Fallback configuration
    config_data = {
        "Settings": {
            "ColorScheme": "Green",
            "PageSize": 10
        },
        "feature_management": {
            "feature_flags": [
                {
                    "id": "Ratings",
                    "description": "",
                    "enabled": "true",
                    "conditions": {
                        "client_filters": []
                    }
                }    
            ]
        }
    }

feature_manager = FeatureManager(config_data)

if feature_manager.is_enabled("Ratings"):
    from resources.ratings import *

app = server.app  # Explicitly expose the app for Gunicorn

app.config['APP_SETTINGS'] = config_data.get("Settings", {})

if __name__ == '__main__':
    server.run()