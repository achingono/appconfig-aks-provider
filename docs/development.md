# Development Guidelines

Environment
- Linux host recommended for automatic cert trust.
- Install: Docker, Minikube, kubectl, Helm, OpenSSL, unzip, wget/curl.

Running Locally
- docker-compose: `docker-compose up --build` serves UI on 5000 and API on 5100 using local `data/` and `src/cfg/settings.json`. See [`docker-compose.yaml`](../docker-compose.yaml).
- Minikube + Helm: [`./deploy.sh`](../deploy.sh) (flags: `--skip-provider`, `--skip-ingress`, `--skip-emulator`, `--skip-build`, `--skip-data`).

Project Conventions
- Python (Flask API)
  - Code under [`src/api`](../src/api) with RESTX namespaces in `resources/` and pandas models/services in `models/`.
  - Keep environment-driven paths (BOOKS_DATA_PATH, BOOKS_RATING_PATH, CONFIG_PATH). Do not hardcode paths.
  - Use server.config['APP_SETTINGS'] for runtime settings (PageSize, ColorScheme).
- JavaScript (Next.js UI)
  - UI under [`src/app`](../src/app). SSR reads `/app/settings.json` with `lib/serverConfigService.js`.
  - Client API base URL comes from `NEXT_PUBLIC_API_BASE_URL`. Keep components stateless; fetch via services.
- Helm
  - Put new manifests in `helm/templates/<component>/`.
  - Parameterize via [`helm/values.yaml`](../helm/values.yaml). Avoid hardcoding hostnames, ports, secrets.
  - Add resource requests/limits and probes where appropriate.
- Data
  - Place CSVs in [`data/`](../data). Update `values.yaml` and verification job if filenames change.

Quality & Testing
- Lint Python with pylint. Prefer small, testable services.
- Verify API endpoints via Swagger at `/swagger` (ingress: https://api.<domain>/swagger).
- Use the verification Job and `kubectl logs` for volume issues.

Troubleshooting
- Check pods: `kubectl get pods -n demo`.
- Provider logs: `kubectl logs -n azappconfig-system deployment/az-appconfig-k8s-provider`.
- Ingress: ensure addon enabled and `/etc/hosts` entries exist.
- Certificates: recreate with deploy script if browsers complain; ensure `tls.crt` trusted on Linux.

Additional Checks
- Provider & ConfigMap
  - Provider CR: `kubectl get azureappconfigurationprovider -n demo -o yaml`
  - Provider controller logs: `kubectl logs -n azappconfig-system deployment/az-appconfig-k8s-provider`
  - ConfigMap content: `kubectl get configmap app-config -n demo -o jsonpath='{.data.settings\.json}' | jq .`
- Ingress & Networking
  - Ingress resources: `kubectl get ingress -n demo -o wide`
  - Controller status: `kubectl get pods -n ingress-nginx`
  - Controller logs: `kubectl logs -n ingress-nginx deployment/ingress-nginx-controller --tail=100`
  - Test host mapping: `curl -k https://api.demo.local/swagger` (ensure `/etc/hosts` updated)
- Data Volume
  - Verify job logs: `kubectl logs job/poc-volume-verification -n demo` (replace `poc` with your release)
  - Check mount path in API pod: `kubectl exec -n demo deploy/demo-api -- ls -la /app/data`
  - List files on node: `minikube ssh -- 'ls -la /mnt/data'`
