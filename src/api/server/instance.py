from flask import Flask
from flask_restx import Api, Resource, fields
from flask_cors import CORS
from environment.instance import environment_config
import os

class Server(object):
    def __init__(self):
        self.app = Flask(__name__)
        
        # Get CORS origins from environment variable or use default
        cors_origins = os.environ.get('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
        origins_list = [origin.strip() for origin in cors_origins.split(',')]
        
        # Enable CORS for all routes
        CORS(self.app, resources={
            r"/*": {
                "origins": origins_list,
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        })
        
        print(f"CORS enabled for origins: {origins_list}")
        
        self.api = Api(self.app, 
            version='1.0', 
            title='Sample Book API',
            description='A simple Book API', 
            doc = environment_config["swagger-url"]
        )

    def run(self):
        self.app.run(
                debug = environment_config["debug"], 
                port = environment_config["port"],
                host = "0.0.0.0"
            )

server = Server()