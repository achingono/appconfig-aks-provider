# Azure App Configuration Emulator Demo

This project provides a comprehensive demonstration of running the [Azure App Configuration Kubernetes Provider](https://mcr.microsoft.com/artifact/mar/azure-app-configuration/kubernetes-provider/about) connected to the [Azure App Configuration emulator](https://learn.microsoft.com/en-us/azure/azure-app-configuration/emulator-overview) in a local minikube cluster.

## Overview

This demo showcases how to:
- Deploy Azure App Configuration emulator in a Kubernetes cluster
- Configure the Azure App Configuration Kubernetes Provider to work with the emulator
- Set up TLS/SSL certificates for secure communication
- Use Ingress for external access to the configuration endpoints
- Automatically sync configuration data into Kubernetes ConfigMaps

## Architecture

The deployment consists of three main components:

1. **Azure App Configuration Emulator**: A containerized version of Azure App Configuration running locally
2. **Azure App Configuration Kubernetes Provider**: Syncs configuration data from the emulator to Kubernetes resources
3. **Ingress Controller**: Provides external HTTPS access to the emulator with proper TLS termination

## Prerequisites

Before running this demo, ensure you have the following tools installed:

- [minikube](https://minikube.sigs.k8s.io/docs/start/) - Local Kubernetes cluster
- [kubectl](https://kubernetes.io/docs/tasks/tools/) - Kubernetes command-line tool
- [Helm](https://helm.sh/docs/intro/install/) - Kubernetes package manager
- [OpenSSL](https://www.openssl.org/) - For generating TLS certificates
- **Linux OS** - The automatic certificate trust feature requires Linux

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd appconfig-aks-provider
   ```

2. **Run the deployment script**:
   ```bash
   ./deploy.sh
   ```

3. **Access the emulator**:
   - The emulator will be accessible at `https://config.demo.local`
   - Add `127.0.0.1 config.demo.local` to your `/etc/hosts` file if needed

## Configuration Options

The deployment can be customized using environment variables or a `.env` file:

### Environment Variables

- `DEPLOYMENT`: Name of the Helm release (default: "poc")
- `NAMESPACE`: Kubernetes namespace for deployment (default: "demo")  
- `LOCAL_DOMAIN`: Domain for local development (default: "demo.local")

### Command Line Options

The `deploy.sh` script supports several flags to customize the deployment:

- `--skip-provider`: Skip installing the Azure App Configuration provider
- `--skip-ingress`: Skip enabling the minikube ingress addon
- `--skip-emulator`: Skip deploying the emulator (useful for connecting to real Azure App Configuration)
- `--help` or `-h`: Show usage information

### Example Usage

```bash
# Deploy without ingress (NodePort only)
./deploy.sh --skip-ingress

# Deploy only the provider (connect to external Azure App Configuration)
./deploy.sh --skip-emulator --skip-ingress

# Custom deployment with environment variables
DEPLOYMENT=myapp NAMESPACE=staging ./deploy.sh
```

## Project Structure

```
.
├── deploy.sh                    # Main deployment script
├── README.md                   # This documentation
├── tls.crt                     # Generated TLS certificate
├── tls.key                     # Generated TLS private key
├── helm/                       # Helm chart for the demo
│   ├── Chart.yaml             # Helm chart metadata
│   ├── values.yaml           # Default configuration values
│   └── templates/            # Kubernetes resource templates
│       ├── emulator/         # Azure App Configuration emulator resources
│       │   ├── deployment.yaml
│       │   └── service.yaml
│       ├── ingress/         # Ingress and TLS resources
│       │   ├── certificates.yaml
│       │   ├── ingress.yaml
│       │   └── secret.yaml
│       └── provider/        # Azure App Configuration provider resources
│           ├── certificate-trust.yaml
│           ├── configMap.yaml
│           ├── post-install-hook.yaml
│           ├── provider.yaml
│           └── secret.yaml
└── scripts/
    └── functions.sh           # Utility functions for deployment
```

## Helm Chart Details

### Values Configuration

The `helm/values.yaml` file contains the default configuration. Key sections include:

#### Ingress Configuration
```yaml
ingress:
  enabled: true
  className: "nginx"
  domain: "demo.local"
  hosts:
    - host: config
      paths:
        - path: /
          pathType: Prefix
          service: config
```

#### Provider Configuration  
```yaml
provider:
  enabled: true
  certificateTrust:
    enabled: true
  refreshInterval: "30s"
  selectors:
    - keyFilter: "*"
      labelFilter: "demo"
```

#### Emulator Configuration
```yaml
emulator:
  enabled: true
  image:
    repository: mcr.microsoft.com/azure-app-configuration/app-configuration-emulator
    tag: 1.0.0-preview
  accessKey:
    id: "emulator"
    name: "emulator" 
    secret: "emulator"
```

### Template Overview

#### Emulator Resources
- **Deployment** (`emulator/deployment.yaml`): Runs the Azure App Configuration emulator container
- **Service** (`emulator/service.yaml`): Exposes the emulator internally in the cluster

#### Provider Resources
- **AzureAppConfigurationProvider** (`provider/provider.yaml`): Custom resource that configures the provider
- **Secret** (`provider/secret.yaml`): Contains the connection string for the emulator
- **ConfigMap** (`provider/configMap.yaml`): Stores TLS certificate for provider trust
- **Certificate Trust** (`provider/certificate-trust.yaml`): Patches the provider to trust self-signed certificates
- **Post-Install Hook** (`provider/post-install-hook.yaml`): Job that configures the provider after installation

#### Ingress Resources
- **Ingress** (`ingress/ingress.yaml`): Routes external traffic to the emulator
- **Certificates** (`ingress/certificates.yaml`): Manages TLS certificates
- **Secret** (`ingress/secret.yaml`): Stores TLS certificate and key

## Script Functions

### deploy.sh

The main deployment script orchestrates the entire setup process:

1. **Environment Setup**: Loads configuration from `.env` file or environment variables
2. **Minikube Management**: Ensures minikube is running
3. **Certificate Generation**: Creates self-signed TLS certificates for HTTPS
4. **Provider Installation**: Installs the Azure App Configuration Kubernetes Provider
5. **Ingress Setup**: Enables and configures the nginx ingress controller
6. **Deployment**: Uses Helm to deploy all components with proper overrides

### scripts/functions.sh

Contains utility functions used by the deployment script:

#### Key Functions

- `ensure_minikube_running()`: Starts minikube if not already running
- `generate_local_certificates()`: Creates self-signed TLS certificates with proper SANs
- `install_appconfig_provider()`: Installs the Azure App Configuration provider via Helm
- `enable_minikube_ingress()`: Enables and configures the ingress addon
- `create_minikube_overrides()`: Generates environment-specific Helm values
- `deploy_with_helm()`: Executes the Helm deployment with error handling
- `cleanup_temp_files()`: Removes temporary files after deployment

## TLS Certificate Management

The project automatically generates self-signed certificates for local development:

### Certificate Features
- **Common Name**: `*.demo.local` (wildcard for subdomains)
- **Subject Alternative Names**: 
  - `*.demo.local`
  - `demo.local`
  - `127.0.0.1`
- **Validity**: 365 days
- **Key Size**: 2048-bit RSA

### Certificate Trust

On Linux systems, the certificate is automatically trusted by:
1. Copying to `/usr/local/share/ca-certificates/`
2. Running `update-ca-certificates`
3. Configuring the Azure App Configuration provider to trust the certificate

## Troubleshooting

### Common Issues

1. **Certificate Trust Issues**
   - Ensure you're running on a Linux system for automatic trust
   - Manually trust the `tls.crt` file in your browser if needed
   - Check that the certificate is properly mounted in the provider pod

2. **Ingress Not Working**
   - Verify minikube ingress addon is enabled: `minikube addons list`
   - Check ingress controller status: `kubectl get pods -n ingress-nginx`
   - Ensure `/etc/hosts` contains the domain mapping

3. **Provider Connection Issues**
   - Check the connection string in the secret: `kubectl get secret app-config-connection -o yaml`
   - Verify emulator pod is running: `kubectl get pods -l app=demo-emulator`
   - Check provider logs: `kubectl logs -n azappconfig-system deployment/az-appconfig-k8s-provider`

4. **Deployment Failures**
   - The deployment script includes comprehensive error reporting
   - Check pod status and logs as shown in the script output
   - Verify all prerequisites are installed and accessible

### Debug Commands

```bash
# Check all pods status
kubectl get pods -A

# Check provider status
kubectl get azureappconfigurationprovider -n demo

# Check generated ConfigMap
kubectl get configmap app-config -n demo -o yaml

# View provider logs  
kubectl logs -n azappconfig-system deployment/az-appconfig-k8s-provider

# Check ingress status
kubectl get ingress -n demo

# Test emulator connectivity
curl -k https://config.demo.local
```

## Customization

### Using with Real Azure App Configuration

To connect to a real Azure App Configuration instance instead of the emulator:

1. Deploy without the emulator:
   ```bash
   ./deploy.sh --skip-emulator
   ```

2. Create a `.env` file with your connection string:
   ```env
   PROVIDER_CONNECTION_STRING="Endpoint=https://your-appconfig.azconfig.io;Id=your-id;Secret=your-secret"
   ```

### Custom Configuration Data

To modify the configuration data synced by the provider, update the `selectors` in `helm/values.yaml`:

```yaml
provider:
  selectors:
    - keyFilter: "app/*"
      labelFilter: "production"
    - keyFilter: "feature/*"  
      labelFilter: "demo"
```

### Resource Requirements

Adjust resource limits in `helm/values.yaml`:

```yaml
emulator:
  resources:
    limits:
      memory: "1Gi"
      cpu: "500m"
    requests:
      memory: "512Mi"
      cpu: "250m"
```

## Security Considerations

- **Self-Signed Certificates**: Only suitable for development/demo purposes
- **Default Access Keys**: The emulator uses default credentials - change for production use
- **Network Security**: The setup assumes a trusted local network environment
- **RBAC**: The post-install hook requires cluster-level permissions to patch the provider deployment

## Contributing

When contributing to this project:

1. Test changes with a clean minikube environment
2. Ensure the deployment script handles errors gracefully
3. Update documentation for any new configuration options
4. Verify certificate trust works on different Linux distributions

## License

This project is provided as-is for demonstration purposes. Please refer to the individual component licenses:
- [Azure App Configuration Emulator](https://learn.microsoft.com/en-us/azure/azure-app-configuration/emulator-overview)
- [Azure App Configuration Kubernetes Provider](https://github.com/Azure/AppConfiguration-KubernetesProvider) 