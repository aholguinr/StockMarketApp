#!/usr/bin/env python3
"""
Script de inicialización del proyecto StockMarket App
"""
import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Verificar versión de Python"""
    if sys.version_info < (3, 9):
        print("❌ Python 3.9+ es requerido")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} detectado")

def check_venv():
    """Verificar que estamos en un ambiente virtual"""
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("❌ No estás en un ambiente virtual")
        print("   Ejecuta: python3 -m venv venv && source venv/bin/activate")
        sys.exit(1)
    print("✅ Ambiente virtual activo")

def install_dependencies():
    """Instalar dependencias"""
    print("\n📦 Instalando dependencias...")
    
    # Crear directorio requirements si no existe
    Path("requirements").mkdir(exist_ok=True)
    
    # Instalar dependencias de desarrollo
    if Path("requirements/dev.txt").exists():
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements/dev.txt"])
        print("✅ Dependencias instaladas")
    else:
        print("⚠️  No se encontró requirements/dev.txt")

def setup_pre_commit():
    """Configurar pre-commit hooks"""
    print("\n🔧 Configurando pre-commit hooks...")
    
    pre_commit_config = """repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-json
      - id: check-merge-conflict
      - id: detect-private-key
      
  - repo: https://github.com/psf/black
    rev: 23.12.0
    hooks:
      - id: black
        language_version: python3.9
        
  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: ["--profile", "black"]
        
  - repo: https://github.com/PyCQA/flake8
    rev: 6.1.0
    hooks:
      - id: flake8
        args: ['--max-line-length=120', '--extend-ignore=E203,W503']
"""
    
    with open(".pre-commit-config.yaml", "w") as f:
        f.write(pre_commit_config)
    
    subprocess.run(["pre-commit", "install"])
    print("✅ Pre-commit hooks configurados")

def create_docker_files():
    """Crear archivos Docker"""
    print("\n🐳 Creando archivos Docker...")
    
    dockerfile = """# Multi-stage build para optimización
FROM python:3.11-slim as builder

WORKDIR /app

# Instalar dependencias de sistema necesarias
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements/prod.txt .

# Instalar dependencias Python
RUN pip install --user --no-cache-dir -r prod.txt

# Stage final
FROM python:3.11-slim

WORKDIR /app

# Copiar dependencias instaladas
COPY --from=builder /root/.local /root/.local

# Asegurar que los scripts están en PATH
ENV PATH=/root/.local/bin:$PATH

# Copiar código de la aplicación
COPY ./backend/app ./app

# Exponer puerto
EXPOSE 8000

# Comando para ejecutar la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
"""
    
    docker_compose = """version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://stockmarket_user:changeme@db:5432/stockmarket_db
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - ./backend/app:/app
    depends_on:
      - db
      - redis
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=stockmarket_user
      - POSTGRES_PASSWORD=changeme
      - POSTGRES_DB=stockmarket_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  celery:
    build:
      context: .
      dockerfile: backend/Dockerfile
    command: celery -A app.core.celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql://stockmarket_user:changeme@db:5432/stockmarket_db
      - CELERY_BROKER_URL=redis://redis:6379/1
    volumes:
      - ./backend/app:/app
    depends_on:
      - db
      - redis

volumes:
  postgres_data:
"""
    
    Path("backend").mkdir(exist_ok=True)
    
    with open("backend/Dockerfile", "w") as f:
        f.write(dockerfile)
    
    with open("docker-compose.yml", "w") as f:
        f.write(docker_compose)
    
    print("✅ Archivos Docker creados")

def main():
    """Función principal"""
    print("🚀 Inicializando proyecto StockMarket App\n")
    
    check_python_version()
    check_venv()
    install_dependencies()
    setup_pre_commit()
    create_docker_files()
    
    print("\n✨ Proyecto inicializado exitosamente!")
    print("\nPróximos pasos:")
    print("1. Edita el archivo .env con tus configuraciones")
    print("2. Ejecuta: docker-compose up -d  # Para levantar PostgreSQL y Redis")
    print("3. Ejecuta: alembic init migrations  # Para inicializar migraciones")
    print("4. Comienza a desarrollar en backend/app/main.py")

if __name__ == "__main__":
    main()
