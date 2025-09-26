# Architectural Principles

Goals
- Local-first developer experience with production-adjacent primitives (ingress, TLS, config provider).
- Clear separation of concerns between configuration, compute, networking, and data.
- Reproducible deployments via Helm and scripted automation.

High-Level Topology
- Ingress (NGINX) terminates TLS and routes:
  - `app.<domain>` -> UI service
  - `api.<domain>` -> API service
  - `config.<domain>` -> Emulator
- Azure App Configuration Provider CRD syncs configuration and feature flags to a ConfigMap consumed by the API and UI.
- API consumes CSV data via a hostPath volume; a verification Job ([`verification/job.yaml`](../helm/templates/verification/job.yaml)) checks readiness after installs/upgrades.

```mermaid
flowchart TD
    Dev[Developer Browser] -->|TLS| Ingress[NGINX Ingress]
    Ingress -->|app.<domain>| AppSvc[Service app -> Deployment UI]
    Ingress -->|api.<domain>| ApiSvc[Service api -> Deployment API]
    Ingress -->|config.<domain>| EmuSvc[Service config -> Emulator]

    subgraph Cluster[Kubernetes Namespace]
      ProviderCRD[AzureAppConfigurationProvider CRD\n(helm/templates/provider/provider.yaml)]
      ProviderController[Provider Controller]
      ConfigMap[(ConfigMap settings.json)]
      AppPod[UI Pod]
      ApiPod[API Pod]
      HostPath[/HostPath: /mnt/data -> /app/data/]
      VerifJob[Verification Job\n(helm/templates/verification/job.yaml)]
    end

    ProviderController --> ProviderCRD
    ProviderCRD -->|syncs| ConfigMap
    ConfigMap -->|mounted| AppPod
    ConfigMap -->|mounted| ApiPod
    HostPath -->|mount| ApiPod
    VerifJob -->|checks| HostPath
```

Configuration Flow
1) [`deploy.sh`](../deploy.sh) generates certificates, installs the Provider, builds/loads images, writes `overrides.yaml`.
2) Helm deploys:
   - Emulator ([`emulator/deployment.yaml`](../helm/templates/emulator/deployment.yaml)) (optional)
   - Provider (CRD + [`provider/provider.yaml`](../helm/templates/provider/provider.yaml) resource)
   - Config secrets for connection strings ([`provider/secret.yaml`](../helm/templates/provider/secret.yaml)) and TLS ([`ingress/secret.yaml`](../helm/templates/ingress/secret.yaml))
   - API/UI deployments ([`api/deployment.yaml`](../helm/templates/api/deployment.yaml), [`app/deployment.yaml`](../helm/templates/app/deployment.yaml)) mounting the ConfigMap as `/app/settings.json`
3) Provider refresh loop updates the ConfigMap according to selectors; pods reload via Stakater Reloader annotations.

Security & Trust
- Self-signed TLS is intended for development only.
- Certificates are loaded into two Secrets (namespace and `azappconfig-system`) so the Provider and Ingress trust the same CA.
- CORS on the API is restricted by default to local origins.

Resilience & Observability
- Probes on the emulator deployment (startup, liveness, readiness).
- Post-install/upgrade verification job for data volume integrity.
- Helm `--wait` and verbose error collection in the script to aid troubleshooting.

Key Helm Values
- `.Values.ingress.*` controls routing and TLS. See [`values.yaml`](../helm/values.yaml).
- `.Values.provider.*` controls provider enablement, selectors, refresh. See [`values.yaml`](../helm/values.yaml).
- `.Values.emulator.*` toggles emulator and credentials. See [`values.yaml`](../helm/values.yaml).
- `.Values.volume.*` defines host/data mount and verification job settings. See [`values.yaml`](../helm/values.yaml).
- `.Values.api.*` and `.Values.app.*` set container images, env vars, and mounts. See [`values.yaml`](../helm/values.yaml).
