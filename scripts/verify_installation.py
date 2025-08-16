#!/usr/bin/env python3
"""
Verificar que todas las librerías críticas están instaladas correctamente
"""
import sys
from importlib.metadata import version

def check_library(name, import_name=None):
    """Verificar si una librería está instalada"""
    if import_name is None:
        import_name = name
    
    try:
        __import__(import_name)
        ver = version(name)
        print(f"✅ {name:20} {ver}")
        return True
    except ImportError:
        print(f"❌ {name:20} NO INSTALADO")
        return False
    except Exception as e:
        print(f"⚠️  {name:20} Error: {e}")
        return False

print("=" * 50)
print("VERIFICACIÓN DE INSTALACIÓN - StockMarket App")
print("=" * 50)
print(f"\n📍 Python: {sys.version}")
print(f"📍 Ambiente virtual: {'✅' if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix) else '❌'}")

print("\n🔧 CORE FRAMEWORK:")
check_library("fastapi")
check_library("uvicorn")
check_library("pydantic")
check_library("pydantic-settings", "pydantic_settings")

print("\n💾 BASE DE DATOS:")
check_library("sqlalchemy")
check_library("alembic")
check_library("psycopg2-binary", "psycopg2")

print("\n📊 ANÁLISIS DE DATOS:")
check_library("yfinance")
check_library("pandas")
check_library("numpy")
check_library("ta")
check_library("pandas-ta", "pandas_ta")
check_library("stockstats")
check_library("finta")

print("\n📈 VISUALIZACIÓN:")
check_library("plotly")
check_library("kaleido")

print("\n🔐 SEGURIDAD:")
check_library("python-jose", "jose")
check_library("passlib")
check_library("python-multipart", "multipart")

print("\n⚡ CACHE Y COLAS:")
check_library("redis")
check_library("celery")

print("\n🌐 HTTP:")
check_library("httpx")
check_library("aiohttp")

print("\n✨ DESARROLLO:")
check_library("pytest")
check_library("black")
check_library("flake8")

print("\n" + "=" * 50)

# Verificación funcional básica
print("\n🧪 PRUEBAS FUNCIONALES:")

try:
    import yfinance as yf
    ticker = yf.Ticker("AAPL")
    hist = ticker.history(period="5d")
    if not hist.empty:
        print("✅ yfinance puede obtener datos")
    else:
        print("⚠️  yfinance instalado pero sin datos")
except Exception as e:
    print(f"❌ Error con yfinance: {e}")

try:
    import pandas as pd
    import ta
    df = pd.DataFrame({'close': [1, 2, 3, 4, 5]})
    rsi = ta.momentum.RSIIndicator(df['close']).rsi()
    print("✅ Indicadores técnicos (ta) funcionando")
except Exception as e:
    print(f"❌ Error con indicadores: {e}")

print("\n" + "=" * 50)
print("✅ Verificación completada")
