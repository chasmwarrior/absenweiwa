#!/bin/bash
# ==========================================
# AbsensiBot Full Installer for Ubuntu
# ==========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function check_root() {
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}Please run as root (use sudo)${NC}"
        exit 1
    fi
}

echo -e "${GREEN}Memulai instalasi otomatis Sistem Absensi WhatsApp...${NC}"
check_root

echo -e "${YELLOW}Mengupdate sistem dan menginstal dependensi dasar...${NC}"
apt update && apt install -y curl git unzip

# Install Docker if not exists
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker tidak ditemukan. Menginstal Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker berhasil diinstal.${NC}"
else
    echo -e "${GREEN}Docker sudah terinstal.${NC}"
fi

# Install Docker Compose if not exists
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose tidak ditemukan. Menginstal Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose berhasil diinstal.${NC}"
else
    echo -e "${GREEN}Docker Compose sudah terinstal.${NC}"
fi

echo -e "${YELLOW}Membangun dan menjalankan container dengan Docker Compose...${NC}"
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}==================================================${NC}"
    echo -e "${GREEN}Instalasi Selesai!${NC}"
    echo "Aplikasi Absensi berjalan di: http://localhost:3000"
    echo -e "${GREEN}==================================================${NC}"
    echo "Langkah selanjutnya:"
    echo "1. Buka http://localhost:3000 dan login dengan admin"
    echo "2. Masuk ke menu Pengaturan Sistem > WhatsApp Bot Connection"
    echo "3. Scan QR Code dengan WhatsApp untuk menghubungkan bot."
else
    echo -e "${RED}Terjadi kesalahan saat membangun container.${NC}"
    exit 1
fi

