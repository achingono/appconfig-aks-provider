#!/bin/bash

# Function to show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy the application to minikube with optional configurations."
    echo ""
    echo "Options:"
    echo "  --skip-provider    Skip Azure App Configuration provider installation"
    echo "  --skip-ingress     Skip minikube ingress addon enablement"
    echo "  --skip-emulator    Skip Azure App Configuration emulator deployment"
    echo "  --skip-build       Skip Docker image build and load"
    echo "  --skip-data       Skip data setup (download, extract, mount)"
    echo "  --help, -h         Show this help message"
    echo ""
    echo "The script will automatically:"
    echo "  - Download the Kaggle amazon-books-reviews dataset if not present"
    echo "  - Extract the dataset to the data folder"
    echo "  - Mount the data folder into the minikube cluster"
    echo "  - Deploy the API with access to the mounted data"
    echo ""
    echo "Environment variables:"
    echo "  DEPLOYMENT         Deployment name (default: poc)"
    echo "  NAMESPACE          Kubernetes namespace (default: demo)"
    echo "  LOCAL_DOMAIN       Local domain for ingress (default: demo.local)"
    echo "  IMAGE_TAG          Docker image tag (default: auto-generated)"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    if ! command -v docker &> /dev/null; then
        echo "Error: docker is not installed or not in PATH"
        exit 1
    fi

    if ! command -v minikube &> /dev/null; then
        echo "Error: minikube is not installed or not in PATH"
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        echo "Error: helm is not installed or not in PATH"
        exit 1
    fi

    if ! command -v kubectl &> /dev/null; then
        echo "Error: kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check for download tools (at least one should be available)
    if ! command -v wget &> /dev/null && ! command -v curl &> /dev/null; then
        echo "Error: Neither wget nor curl is available for downloading datasets"
        echo "Please install wget or curl"
        exit 1
    fi

    if ! command -v unzip &> /dev/null; then
        echo "Error: unzip is not installed or not in PATH"
        echo "Please install unzip to extract dataset files"
        exit 1
    fi
}

# Function to ensure minikube is running
ensure_minikube_running() {
    if ! minikube status &> /dev/null; then
        if [[ "$SKIP_DATA" == false ]]; then
            echo "Minikube is not running. Starting with 'minikube start --driver=docker --mount --mount-string=${DATA_DIR}:${MOUNT_DIR}'"
            minikube start --driver=docker --mount --mount-string="${DATA_DIR}:${MOUNT_DIR}"
        else
            echo "Minikube is not running. Starting with 'minikube start --driver=docker '"
            minikube start --driver=docker 
        fi
    fi
}

# Function to generate self-signed certificates for local development
generate_local_certificates() {
    echo "Generating self-signed certificates for local development..."
    
    # Generate private key
    openssl genrsa -out tls.key 2048
    
    # Generate certificate with multiple SANs for both ingress and emulator
    cat > tls.conf <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = *.${LOCAL_DOMAIN}
O = LocalDev

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.${LOCAL_DOMAIN}
DNS.2 = ${LOCAL_DOMAIN}
IP.1 = 127.0.0.1
EOF

    # Generate certificate signing request
    openssl req -new -key tls.key -out tls.csr -config tls.conf
    
    # Generate the certificate
    openssl x509 -req -in tls.csr -signkey tls.key \
        -out tls.crt -days 365 -extensions v3_req -extfile tls.conf

    rm -f tls.csr
    
    # Encode cert and key in base64 for Helm values
    crt=$(cat tls.crt | base64 | tr -d '\n')
    key=$(cat tls.key | base64 | tr -d '\n')

    # Trust the certificate on the host machine (Linux)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "Trusting the self-signed certificate on the host machine..."
        sudo cp tls.crt /usr/local/share/ca-certificates/${LOCAL_DOMAIN}.crt
        sudo update-ca-certificates
        echo "✓ Certificate trusted on host machine"
    else
        echo "⚠ Warning: Automatic certificate trust is only implemented for Linux hosts."
        echo "  Please manually trust 'tls.crt' on your host machine if needed."
        echo "  On windows, you can import it into the Trusted Root Certification Authorities store."
        echo "  using the PowerShell command:"
        echo "  Import-Certificate -FilePath .\tls.crt -CertStoreLocation Cert:\LocalMachine\Root"
    fi
    
    echo "✓ Local development certificates generated and deployed successfully"
}

# Function to install Azure App Configuration provider
install_appconfig_provider() {
    echo "Checking for Azure App Configuration Kubernetes Provider..."
    if ! kubectl get crd azureappconfigurationproviders.azconfig.io &> /dev/null; then
        echo "Installing Azure App Configuration Kubernetes Provider using Helm..."
        helm install azureappconfiguration-kubernetesprovider \
            oci://mcr.microsoft.com/azure-app-configuration/helmchart/kubernetes-provider \
            --namespace azappconfig-system \
            --create-namespace \
            --wait \
            --timeout=300s
        
        # Configure the provider to trust our self-signed certificates for emulator
        if [[ "$SKIP_EMULATOR" == "false" ]]; then
            echo "Azure App Configuration Provider will be configured for certificate trust after deployment..."
        fi
        
        echo "✓ Azure App Configuration Kubernetes Provider installed successfully"
    else
        echo "✓ Azure App Configuration Kubernetes Provider is already installed"
        
        # Still configure certificate trust if using emulator
        if [[ "$SKIP_EMULATOR" == "false" ]]; then
            echo "Azure App Configuration Provider will be configured for certificate trust after deployment..."
        fi
    fi
}

# Function to enable minikube ingress
enable_minikube_ingress() {
    echo "Attempting to enable minikube ingress addon..."
    if timeout 40s minikube addons enable ingress; then
        echo "✓ Ingress addon enabled successfully"
        
        # Configure NGINX controller for proper forwarded headers handling
        echo "Configuring NGINX controller for forwarded headers..."
        kubectl patch configmap ingress-nginx-controller -n ingress-nginx --patch='{"data":{"use-forwarded-headers":"true","compute-full-forwarded-for":"true","hsts":"false"}}' || echo "⚠ Warning: Could not configure NGINX forwarded headers"
        
        # Restart NGINX controller to apply configuration
        echo "Restarting NGINX controller to apply configuration..."
        kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx || echo "⚠ Warning: Could not restart NGINX controller"
        kubectl rollout status deployment/ingress-nginx-controller -n ingress-nginx --timeout=60s || echo "⚠ Warning: NGINX controller restart timed out"
        
        return 0
    else
        echo "⚠ Warning: Failed to enable ingress addon (likely due to network connectivity)"
        echo "  Continuing with NodePort services only..."
        return 1
    fi
}

# Helper function to create minikube-specific values that override defaults
create_minikube_overrides() {
    echo "Creating minikube-specific value overrides..."
    
    # Handle TLS certificate for ingress
    local crt=""
    local key=""
    local conf=""

    if [[ -f "tls.crt" && -f "tls.key" ]]; then
        crt=$(cat tls.crt | base64 | tr -d '\n')
        key=$(cat tls.key | base64 | tr -d '\n')
    else
        generate_local_certificates
        crt=$(cat tls.crt | base64 | tr -d '\n')
        key=$(cat tls.key | base64 | tr -d '\n')
    fi

    if [[ -f "tls.conf" ]]; then
        conf=$(cat tls.conf | base64 | tr -d '\n')
    else
        raw=$(cat <<EOF
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = *.${LOCAL_DOMAIN}
O = LocalDev

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = *.${LOCAL_DOMAIN}
DNS.2 = ${LOCAL_DOMAIN}
IP.1 = 127.0.0.1
EOF
        )
        conf=$(echo "$raw" | base64 | tr -d '\n')
    fi

    # Get ingress IP
    local INGRESS_IP=""
    if minikube addons list | grep -q "ingress.*enabled"; then
        if minikube status &>/dev/null; then
            # Try to get the ingress controller service ClusterIP first
            INGRESS_IP=$(kubectl get service ingress-nginx-controller -n ingress-nginx -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")
            # Fallback to minikube IP if service not found
            if [[ -z "$INGRESS_IP" ]]; then
                INGRESS_IP=$(minikube ip 2>/dev/null || echo "127.0.0.1")
            fi
        else
            INGRESS_IP="127.0.0.1"
        fi
    fi

    # Create minikube-specific overrides
    cat <<EOF > overrides.yaml
ingress:
  enabled: "$([[ "${SKIP_INGRESS:-false}" == "false" ]] && echo "true" || echo "false")"
  controllerIP: "$INGRESS_IP"
  domain: "$LOCAL_DOMAIN"
provider:
  enabled: "$([[ "${SKIP_PROVIDER:-false}" == "false" ]] && echo "true" || echo "false")"
  connectionString: "${PROVIDER_CONNECTION_STRING:-}"
emulator:
  enabled: "$([[ "${SKIP_EMULATOR:-false}" == "false" ]] && echo "true" || echo "false")"
certificates:
  selfSigned:
    enabled: true
    commonName: "*.${LOCAL_DOMAIN}"
    subjectAltNames:
      - "*.${LOCAL_DOMAIN}"
      - "${LOCAL_DOMAIN}"
      - "127.0.0.1"
  data:
    crt: "$crt"
    key: "$key"
    conf: "$conf"
volume:
  hostPath:
    path: "${MOUNT_DIR}"
    type: DirectoryOrCreate
  verification:
    enabled: true
app:
  image:
    repository: "${APP_IMAGE_NAME}"
    tag: "${IMAGE_TAG}"
api:
  image:
    repository: "${API_IMAGE_NAME}"
    tag: "${IMAGE_TAG}"
EOF

    echo "✓ Created overrides.yaml with environment-specific overrides"
}

# Function to build Docker images
build_docker_images() {
    echo "Building Docker images..."

    echo "  Building $APP_IMAGE_NAME:$IMAGE_TAG ..."
    docker build -t $APP_IMAGE_NAME:$IMAGE_TAG ./src/app

    echo "  Building $API_IMAGE_NAME:$IMAGE_TAG ..."
    docker build -t $API_IMAGE_NAME:$IMAGE_TAG ./src/api

    echo "Docker images built successfully!"
}

# Function to load images into minikube
load_images_to_minikube() {
    echo "Loading Docker images into minikube..."
    minikube image load $APP_IMAGE_NAME:$IMAGE_TAG 
    minikube image load $API_IMAGE_NAME:$IMAGE_TAG 

    echo "Images loaded into minikube successfully!"
}

# Function to deploy with Helm
deploy_with_helm() {
    echo "Deploying to minikube with Helm..."
    echo "Note: This may take several minutes as pods start and the Azure App Configuration provider initializes..."

    if ! helm upgrade --install $DEPLOYMENT ./helm \
      --values ./helm/values.yaml \
      --values overrides.yaml \
      --namespace $NAMESPACE \
      --create-namespace \
      --timeout=15m \
      --debug; then
        echo ""
        echo "❌ Helm deployment failed. Gathering debug information..."
        echo ""
        echo "=== Pod Status ==="
        kubectl get pods -n $NAMESPACE -o wide
        echo ""
        echo "=== Pod Logs (if any pods exist) ==="
        for pod in $(kubectl get pods -n $NAMESPACE -o name 2>/dev/null); do
            echo "--- Logs for $pod ---"
            kubectl logs $pod -n $NAMESPACE --tail=50 || echo "No logs available"
        done
        echo ""
        echo "=== Events ==="
        kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20
        echo ""
        echo "=== ConfigProvider Status ==="
        kubectl get azureappconfigurationprovider -n $NAMESPACE -o yaml 2>/dev/null || echo "No ConfigProvider found"
        echo ""
        echo "=== Secret Status ==="
        kubectl get secrets -n $NAMESPACE
        echo ""
        echo "=== ConfigMap Status ==="
        kubectl get configmaps -n $NAMESPACE
        echo ""
        exit 1
    fi
}

# Function to download Kaggle dataset if not exists
download_kaggle_dataset() {
    local kaggle_url="https://www.kaggle.com/api/v1/datasets/download/mohamedbakhet/amazon-books-reviews"
    
    echo "Checking for Kaggle dataset..."
    
    # Create data directory if it doesn't exist
    mkdir -p "$DATA_DIR"

    # Check if zip file already exists
    if [[ -f "$ZIP_FILE" ]]; then
        echo "✓ Kaggle dataset already exists at $ZIP_FILE"
        return 0
    fi
    
    echo "Downloading Kaggle dataset from $kaggle_url..."
    
    # Check if wget or curl is available
    if command -v wget &> /dev/null; then
        wget -O "$ZIP_FILE" "$kaggle_url"
    elif command -v curl &> /dev/null; then
        curl -L -o "$ZIP_FILE" "$kaggle_url"
    else
        echo "Error: Neither wget nor curl is available for downloading the dataset"
        echo "Please install wget or curl, or manually download the file from:"
        echo "$kaggle_url"
        echo "and save it as: $ZIP_FILE"
        exit 1
    fi
    
    # Verify the download
    if [[ -f "$ZIP_FILE" && -s "$ZIP_FILE" ]]; then
        echo "✓ Successfully downloaded Kaggle dataset to $ZIP_FILE"
    else
        echo "❌ Failed to download Kaggle dataset"
        exit 1
    fi
}

# Function to extract Kaggle dataset
extract_kaggle_dataset() {  
    echo "Extracting Kaggle dataset..."
    
    # Check if zip file exists
    if [[ ! -f "$ZIP_FILE" ]]; then
        echo "Error: Zip file not found at $ZIP_FILE"
        exit 1
    fi
    
    # Check if unzip is available
    if ! command -v unzip &> /dev/null; then
        echo "Error: unzip is not installed or not in PATH"
        echo "Please install unzip to extract the dataset"
        exit 1
    fi
    
    # Extract the zip file
    echo "Extracting $ZIP_FILE to $DATA_DIR..."
    unzip -o "$ZIP_FILE" -d "$DATA_DIR"

    # List extracted files
    echo "✓ Dataset extracted successfully. Contents:"
    ls -la "$DATA_DIR"
}

# Function to mount data folder to minikube
mount_data_to_minikube() {
    local mount_path="/mnt/data"
    
    echo "Setting up data volume for minikube..."
    
    # Check if data directory exists
    if [[ ! -d "$DATA_DIR" ]]; then
        echo "Error: Data directory not found at $DATA_DIR"
        exit 1
    fi
    
    # Check if minikube is running
    if ! minikube status &> /dev/null; then
        echo "Error: Minikube is not running"
        exit 1
    fi
    
    # Copy data to minikube node (this approach works for all minikube drivers)
    echo "Copying data to minikube node..."
    
    # Create the mount directory in minikube
    minikube ssh "sudo mkdir -p $mount_path" || true
    
    # Copy files to minikube
    for file in "$DATA_DIR"/*.csv; do
        if [[ -f "$file" ]]; then
            filename=$(basename "$file")
            echo "  Copying $filename to minikube..."
            cat "$file" | minikube ssh "sudo tee $mount_path/$filename > /dev/null"
        fi
    done
    
    echo "✓ Data files mounted to minikube at $mount_path"
}

# Function to display useful commands
display_useful_info() {
    echo ""
    echo "Deployment completed successfully!"
    echo ""
    echo "Useful commands:"
    echo "  - To check pod status: kubectl get pods -n $NAMESPACE"
    echo "  - To view pod logs: "
    echo "      Config provider: kubectl logs -f deployment/az-appconfig-k8s-provider -n azappconfig-system"
    echo "      Emulator:      kubectl logs -f deployment/demo-emulator -n $NAMESPACE"
    echo "      User app:      kubectl logs -f deployment/demo-app -n $NAMESPACE"
    echo "      API:           kubectl logs -f deployment/demo-api -n $NAMESPACE"
    echo "      Verification:  kubectl logs job/${DEPLOYMENT}-volume-verification -n $NAMESPACE"
    echo "  - To check volume verification: kubectl get job ${DEPLOYMENT}-volume-verification -n $NAMESPACE"
    echo "  - To access the application:"
    
    if [[ "${SKIP_INGRESS:-false}" == "false" ]]; then
        echo "    Run: minikube tunnel (in a separate terminal) to access via LoadBalancer services"
        echo "      https://config.${LOCAL_DOMAIN}"
        echo "      https://api.${LOCAL_DOMAIN}/swagger"
        echo "      https://app.${LOCAL_DOMAIN}"
        echo ""
        echo "    Make sure to add the following entry to your /etc/hosts file if not already present:"
        echo "      ${INGRESS_IP}  *.${LOCAL_DOMAIN} ${LOCAL_DOMAIN}"
        echo ""
    else
        echo "    Access the services via NodePort:"
        echo "      App: http://${INGRESS_IP}:$(kubectl get svc app -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')"
        echo "      API: http://${INGRESS_IP}:$(kubectl get svc api -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')/swagger"
        echo "      Config: http://${INGRESS_IP}:$(kubectl get svc config -n $NAMESPACE -o jsonpath='{.spec.ports[0].nodePort}')"
        echo ""    
    fi
}

# Function to clean up temporary files
cleanup_temp_files() {
    rm -f overrides.yaml
}