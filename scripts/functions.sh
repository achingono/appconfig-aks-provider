#!/bin/bash

# Function to ensure minikube is running
ensure_minikube_running() {
    if ! minikube status &> /dev/null; then
        echo "Minikube is not running. Starting with 'minikube start'"
        minikube start
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
    if timeout 30s minikube addons enable ingress; then
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
EOF

    echo "✓ Created overrides.yaml with environment-specific overrides"
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

# Function to clean up temporary files
cleanup_temp_files() {
    rm -f overrides.yaml
}