#!/bin/bash
# ================================
# ProductAI Studio - Deployment Script
# For Ubuntu 24.04 Server
# ================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ProductAI Studio - Deployment Script                 ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Not running as root. Some operations may fail.${NC}"
fi

# 1. Check prerequisites
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker not found! Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully.${NC}"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose not found! Installing...${NC}"
    apt-get update && apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed successfully.${NC}"
fi

echo -e "${GREEN}✓ Prerequisites satisfied.${NC}"

# 2. Pull latest code (if in git repo)
echo -e "${YELLOW}[2/6] Updating codebase...${NC}"
if [ -d ".git" ]; then
    git pull origin main || git pull origin master || echo "Git pull skipped"
    echo -e "${GREEN}✓ Code updated.${NC}"
else
    echo -e "${YELLOW}Not a git repository. Skipping pull.${NC}"
fi

# 3. Check environment file
echo -e "${YELLOW}[3/6] Checking environment configuration...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production not found!${NC}"
    echo -e "Please copy .env.example to .env.production and configure it."
    echo -e "  cp .env.example .env.production"
    echo -e "  nano .env.production"
    exit 1
fi

# Validate required vars
if ! grep -q "GEMINI_API_KEY_1=" .env.production || grep -q "GEMINI_API_KEY_1=$" .env.production; then
    echo -e "${YELLOW}Warning: GEMINI_API_KEY_1 may not be set in .env.production${NC}"
fi

if grep -q "SESSION_SECRET=your-super-secret" .env.production; then
    echo -e "${RED}Error: Please change SESSION_SECRET in .env.production${NC}"
    echo -e "Generate a new secret with: openssl rand -base64 32"
    exit 1
fi

echo -e "${GREEN}✓ Environment configured.${NC}"

# 4. Create data directory
echo -e "${YELLOW}[4/6] Creating data directory...${NC}"
mkdir -p data
chmod 755 data
echo -e "${GREEN}✓ Data directory ready.${NC}"

# 5. Build and deploy
echo -e "${YELLOW}[5/6] Building and deploying containers...${NC}"

# Use docker compose (v2) if available, otherwise docker-compose (v1)
if docker compose version &> /dev/null; then
    docker compose down || true
    docker compose build --no-cache
    docker compose up -d
else
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
fi

echo -e "${GREEN}✓ Containers deployed.${NC}"

# 6. Health check
echo -e "${YELLOW}[6/6] Running health check...${NC}"
sleep 5

if curl -s -f http://localhost:${PORT:-80}/api/auth/me > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy!${NC}"
else
    echo -e "${YELLOW}Application may still be starting. Check logs with:${NC}"
    echo -e "  docker compose logs -f"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete!                                 ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Access: http://your-server-ip:${PORT:-80}                    ║${NC}"
echo -e "${GREEN}║  Default Login: admin / (check .env.production)      ║${NC}"
echo -e "${GREEN}║                                                       ║${NC}"
echo -e "${GREEN}║  Useful commands:                                     ║${NC}"
echo -e "${GREEN}║    View logs:    docker compose logs -f               ║${NC}"
echo -e "${GREEN}║    Stop:         docker compose down                  ║${NC}"
echo -e "${GREEN}║    Restart:      docker compose restart               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
