#!/bin/bash
# ==============================================================================
# Aegis-Cyber Cashout Forecaster // AWS EC2 Production Bootstrap Script
# Smart India Hackathon (SIH26184) | MHA / I4C Alignment
# Target OS: Ubuntu 22.04 / 24.04 LTS (x86_64) on AWS EC2
# ==============================================================================

set -e

echo "===================================================================="
echo "🛡️  AEGIS-CYBER // AWS EC2 AUTOMATED PRODUCTION DEPLOYMENT"
echo "===================================================================="

# 1. Update OS Packages
echo "[1/6] Updating system packages..."
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release git nginx ufw

# 2. Install Docker Engine & Docker Compose Plugin
echo "[2/6] Installing Docker Engine & Compose v2..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER || true
else
    echo "Docker is already installed."
fi

# 3. Setup Project Directory
PROJECT_DIR="/opt/aegis-cyber-cashout"
echo "[3/6] Setting up project in ${PROJECT_DIR}..."

if [ -d "$PROJECT_DIR" ]; then
    echo "Repository exists. Pulling latest main..."
    cd "$PROJECT_DIR"
    sudo git fetch origin
    sudo git reset --hard origin/main
else
    echo "Cloning repository from GitHub..."
    sudo git clone https://github.com/hemanth2607-cyber/aegis-cyber-cashout.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# 4. Build & Launch Docker Containers
echo "[4/6] Building and starting Docker containers (FastAPI + Next.js + Redis)..."
sudo docker compose -f deploy/docker-compose.yml down --remove-orphans || true
sudo docker compose -f deploy/docker-compose.yml up -d --build

# 5. Configure Nginx Reverse Proxy
echo "[5/6] Configuring Nginx reverse proxy on Port 80..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/aegis.conf
sudo ln -sf /etc/nginx/sites-available/aegis.conf /etc/nginx/sites-enabled/aegis.conf
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 6. Configure UFW Firewall
echo "[6/6] Configuring firewall rules (Ports 22, 80, 443, 3000, 8000)..."
sudo ufw allow 22/tcp || true
sudo ufw allow 80/tcp || true
sudo ufw allow 443/tcp || true
sudo ufw allow 3000/tcp || true
sudo ufw allow 8000/tcp || true

# Fetch Public IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "<YOUR-EC2-PUBLIC-IP>")

echo ""
echo "===================================================================="
echo "✅  AEGIS-CYBER DEPLOYMENT COMPLETE & OPERATIONAL ON AWS!"
echo "===================================================================="
echo ""
echo "🌐  Interactive 2D Simulation: http://${PUBLIC_IP}/simulation"
echo "📊  Tactical Command Center:   http://${PUBLIC_IP}/dashboard"
echo "📚  FastAPI Documentation:     http://${PUBLIC_IP}/docs"
echo "⚡  Real-Time WebSocket Feed:  ws://${PUBLIC_IP}/ws/alerts"
echo ""
echo "To monitor live logs:"
echo "  sudo docker compose -f /opt/aegis-cyber-cashout/deploy/docker-compose.yml logs -f"
echo "===================================================================="
