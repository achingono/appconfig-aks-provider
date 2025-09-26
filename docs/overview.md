# Project Overview

This repository demonstrates running the Azure App Configuration Kubernetes Provider against the Azure App Configuration Emulator inside a local Minikube cluster, plus a small full-stack sample to exercise configuration-driven behavior.

Components
- Azure App Configuration Emulator
- Azure App Configuration Kubernetes Provider (CRD + controller)
- NGINX Ingress for TLS/host routing
- Flask REST API that reads configuration and serves data
- Next.js UI that renders using server-provided configuration
- Helm chart and a deployment script orchestrating local setup

Key Capabilities
- Self-signed TLS generation and trust (Linux host automation)
- Ingress with wildcard domain (e.g., *.demo.local)
- Provider syncs configuration and feature flags into a ConfigMap consumed by API and UI
- Data volume mounted from host into API pod and automatically verified
- One-command bootstrap via ./deploy.sh

How to Run (quick)
1) Ensure Docker, Minikube, kubectl, Helm are installed.
2) `./deploy.sh` (optional flags: --skip-ingress, --skip-provider, --skip-emulator, --skip-build, --skip-data)
3) Update /etc/hosts for the chosen LOCAL_DOMAIN (default demo.local):
   127.0.0.1 app.demo.local api.demo.local config.demo.local
4) Visit:
   - https://config.demo.local
   - https://api.demo.local/swagger
   - https://app.demo.local

Notable Paths
- Helm chart: [`./helm`](../helm)
- API service: [`./src/api`](../src/api)
- UI (Next.js): [`./src/app`](../src/app)
- Deployment script: [`./deploy.sh`](../deploy.sh)
- Data folder: [`./data`](../data)

