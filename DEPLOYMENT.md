# SmillingWallet — Deployment Guide

## Architecture in production

```
Internet
   │
   ▼
[ AWS ALB / nginx ] ─── HTTPS (443) ── TLS terminates here
   │
   ├─── /          ──▶  [ Frontend (nginx) ]  ──▶ serves React SPA
   │                          │
   │                          ├─ /api/*         ──▶ proxied to Backend
   │                          └─ /ws-smiling-wallet/* ─▶ proxied (WebSocket)
   │
   └─── backend:8080  ──▶  [ Spring Boot ] ──▶ [ PostgreSQL ] [ Redis ]
```

---

## Phase 1 — Local Docker Compose

### Prerequisites
- Docker Desktop installed (https://www.docker.com/products/docker-desktop/)
- WSL2 enabled on Windows

### Setup

```bash
# 1. Copy and fill in your secrets
cp .env.example .env
# Edit .env — fill in JWT_SECRET, DB_PASSWORD, MAIL_PASSWORD, etc.

# 2. Build & start everything
docker compose up --build

# 3. Open the app
# → http://localhost  (React frontend via nginx)
# → http://localhost:8080  (Spring Boot API — for debugging)
```

### Dev workflow (infrastructure only in Docker)

If you want Vite hot-reload and Spring Boot DevTools, run only the databases in Docker:

```bash
# Start just PostgreSQL + Redis
docker compose -f docker-compose.dev.yml up -d

# Then in separate terminals:
./mvnw spring-boot:run          # backend on https://localhost:8080
cd src/frontend && npm run dev  # frontend on http://localhost:5173
```

---

## Phase 2 — AWS EC2 (simplest cloud deployment, ~$15/mo)

Good for MVP / testing. One EC2 instance running docker-compose.

```bash
# 1. Launch an EC2 t3.small (Amazon Linux 2023)
# 2. Install Docker on EC2:
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone your repo and create .env
git clone https://github.com/muresanianis450/SmillingWallet.git
cd SmillingWallet
cp .env.example .env
# edit .env

# 4. Start
docker compose up -d --build

# 5. Set up nginx on EC2 for HTTPS (Let's Encrypt):
sudo yum install -y nginx certbot python3-certbot-nginx
# Configure nginx to proxy port 80/443 → localhost:80
```

---

## Phase 3 — AWS ECS Fargate (managed containers, ~$60/mo)

No servers to manage. Uses:
- **ECR** — stores your Docker images
- **ECS Fargate** — runs containers
- **RDS** — managed PostgreSQL
- **ElastiCache** — managed Redis
- **ALB** — load balancer with HTTPS

### Step 1: Push images to ECR

```bash
# Authenticate
aws ecr get-login-password --region eu-central-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com

# Create ECR repos (once)
aws ecr create-repository --repository-name smiling-wallet-backend --region eu-central-1
aws ecr create-repository --repository-name smiling-wallet-frontend --region eu-central-1

# Build and push
REGISTRY=YOUR_ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com

docker build -t $REGISTRY/smiling-wallet-backend:latest .
docker push $REGISTRY/smiling-wallet-backend:latest

docker build -t $REGISTRY/smiling-wallet-frontend:latest src/frontend/
docker push $REGISTRY/smiling-wallet-frontend:latest
```

### Step 2: Create ECS task definitions
Use the AWS Console or Terraform (recommended for repeatable infra).
Each service maps directly to the docker-compose.yml services.

---

## Phase 4 — AWS EKS (Kubernetes, ~$130/mo)

Full Kubernetes. Best for learning K8s or when you need auto-scaling.

### Prerequisites
```bash
# Install tools (Windows PowerShell as admin)
choco install awscli kubectl eksctl kubernetes-helm

# Configure AWS
aws configure
```

### Step 1: Create EKS cluster

```bash
eksctl create cluster \
  --name smiling-wallet \
  --region eu-central-1 \
  --nodegroup-name workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 4 \
  --managed
```

This takes ~15 minutes. kubectl context is set automatically.

### Step 2: Install AWS Load Balancer Controller

```bash
# Install via Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=smiling-wallet \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

### Step 3: Push images to ECR (same as Phase 3 Step 1)

### Step 4: Update k8s manifests

```bash
# In k8s/05-backend.yaml and k8s/06-frontend.yaml:
# Replace YOUR_REGISTRY with your ECR registry URL

# In k8s/07-ingress.yaml:
# Replace your-domain.com with your actual domain
# Uncomment the AWS ALB annotations
# Add your ACM certificate ARN
```

### Step 5: Apply manifests

```bash
# Create secrets (never commit these)
kubectl create secret generic smiling-wallet-secrets \
  --namespace smiling-wallet \
  --from-literal=db-password='YOUR_DB_PASS' \
  --from-literal=jwt-secret='YOUR_JWT_SECRET' \
  --from-literal=totp-key='YOUR_TOTP_KEY' \
  --from-literal=mail-username='your@email.com' \
  --from-literal=mail-password='YOUR_APP_PASSWORD'

# Apply all manifests in order
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
kubectl apply -f k8s/03-postgres.yaml      # skip if using RDS
kubectl apply -f k8s/04-redis.yaml         # skip if using ElastiCache
kubectl apply -f k8s/05-backend.yaml
kubectl apply -f k8s/06-frontend.yaml
kubectl apply -f k8s/07-ingress.yaml

# Check rollout
kubectl rollout status deployment/backend -n smiling-wallet
kubectl rollout status deployment/frontend -n smiling-wallet

# Get the ALB DNS name
kubectl get ingress -n smiling-wallet
```

### Useful kubectl commands

```bash
# Watch pods
kubectl get pods -n smiling-wallet -w

# View backend logs
kubectl logs -n smiling-wallet -l app=backend -f

# Shell into a pod
kubectl exec -it -n smiling-wallet deployment/backend -- sh

# Update image after a new push
kubectl set image deployment/backend \
  backend=YOUR_REGISTRY/smiling-wallet-backend:latest \
  -n smiling-wallet
```

---

## Cost comparison

| Option | Monthly cost | Effort |
|---|---|---|
| EC2 t3.small + compose | ~$15 | Low |
| ECS Fargate + RDS | ~$60 | Medium |
| EKS + RDS + ElastiCache | ~$130 | High |

For a student/portfolio project, start with **EC2 + docker-compose**.
Move to **EKS** when you need auto-scaling or want to demonstrate Kubernetes knowledge.

---

## Important: secrets in `application.yml`

Before going to production, move these to environment variables:
- `jwt.secret` — already overridden in docker profile
- `spring.mail.password` — already overridden in docker profile
- `spring.mail.username` — already overridden in docker profile

They still have hardcoded dev defaults in `application.yml` which is OK for local dev,
but **never deploy with those defaults**.
