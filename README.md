# Stock Market Dashboard (India) — Full DevOps Project

## Quick Start (Local Dev)
1) Backend
```bash
cd backend
cp .env.example .env
# Put your Alpha Vantage API key in .env
npm install
npm start
```
Backend: http://localhost:3000/api/stock/RELIANCE.NS

2) Frontend
```bash
cd ../frontend
npm install
# To use local backend:
echo "VITE_BACKEND_URL=http://localhost:3000" > .env
npm run dev
```
Frontend: http://localhost:5173

## Docker (Local)
```bash
# Backend
docker build -t stock-backend:local ./backend
docker run -p 3000:3000 --env-file backend/.env stock-backend:local

# Frontend
docker build -t stock-frontend:local ./frontend
docker run -p 8080:80 stock-frontend:local
```

## Kubernetes
- Edit `k8s/secret-alpha-vantage.yaml` and put your API key.
- Replace `your-docker-id` in deployment images / Jenkinsfile.
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret-alpha-vantage.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

## CI/CD with Jenkins
- Create credentials: `dockerhub-creds` (username/password), `kubeconfig-cred-id` (Kubeconfig file).
- Configure SonarQube Server in Jenkins as `SonarQubeServer` and install scanner tool named `SonarQubeScanner`.
- Ensure Trivy installed on Jenkins agent (`trivy -v`).

## Notes
- Free API limits apply (Alpha Vantage ~5 req/min). For heavier use, consider TwelveData or paid providers.
- Tickers examples: RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS
