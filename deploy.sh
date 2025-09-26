#!/bin/bash
set -e

# Source common functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/scripts/functions.sh"

SKIP_PROVIDER=false
SKIP_INGRESS=false
SKIP_EMULATOR=false
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-provider)
            SKIP_PROVIDER=true
            shift
            ;;
        --skip-ingress)
            SKIP_INGRESS=true
            shift
            ;;
        --skip-emulator)
            SKIP_EMULATOR=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help|-h)
            show_usage
            exit 0
            ;;
        *)
            echo "Error: Unknown option '$1'"
            show_usage
            exit 1
            ;;
    esac
done

# Ensure prerequisites are met
check_prerequisites

echo "Setting up deployment variables..."

if [[ -f ".env" ]]; then
    echo "Loading environment variables from .env file..."
    # Export variables from .env file, ignoring comments and empty lines
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
else
    echo "Warning: .env file not found. Proceeding with default values and command-line arguments."
fi

# Set default values for local minikube deployment
DEPLOYMENT=${DEPLOYMENT:-poc}
NAMESPACE=${NAMESPACE:-demo}

# Sanitize the release name to follow DNS naming conventions (Helm requirement)
# Convert to lowercase and replace invalid characters with hyphens
DEPLOYMENT=$(echo "$DEPLOYMENT" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g')

# Ensure the name is not empty and doesn't start/end with hyphens
if [[ -z "$DEPLOYMENT" ]] || [[ "$DEPLOYMENT" =~ ^-.*-$ ]]; then
    DEPLOYMENT="demo"
fi

# Domain and hostname variables
LOCAL_DOMAIN="${LOCAL_DOMAIN:-demo.local}"
IMAGE_TAG="${IMAGE_TAG:-$(date +%s%N | md5sum | cut -c1-6)}"
APP_IMAGE_NAME="${APP_IMAGE_NAME:-${DEPLOYMENT}/app}"
API_IMAGE_NAME="${API_IMAGE_NAME:-${DEPLOYMENT}/api}"

# ensure minikube is running
ensure_minikube_running

if [[  ! -f "tls.crt" || ! -f "tls.key" ]]; then
    echo "No existing TLS certificates found. Generating new self-signed certificates..."
    # Generate local development certificates
    generate_local_certificates
fi

if [[ "$SKIP_PROVIDER" == false ]]; then
    # Install Azure App Configuration provider
    install_appconfig_provider
else
    echo "Skipping Azure App Configuration provider installation as per user request."
fi

if [[ "$SKIP_INGRESS" == false ]]; then
    # Enable minikube ingress addon
    enable_minikube_ingress
else
    echo "Skipping minikube ingress addon enablement as per user request."
fi

if [[ "$SKIP_BUILD" == false ]]; then
    # Build Docker images
    build_docker_images

    # Load images into minikube
    load_images_to_minikube
else
    echo "Skipping Docker image build and load as requested."
fi

# Create minikube-specific overrides
create_minikube_overrides

# Deploy with Helm
deploy_with_helm

# clean up
cleanup_temp_files