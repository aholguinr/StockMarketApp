#!/usr/bin/env python3
"""
Test detallado de yfinance y APIs alternativas
"""
import yfinance as yf
import time
from datetime import datetime

print("=" * 50)
print("TEST DE CONECTIVIDAD - YFINANCE")
print("=" * 50)

# Lista de símbolos para probar
test_symbols = ["AAPL", "MSFT", "GOOGL", "SPY", "^GSPC"]

for symbol in test_symbols:
    print(f"\n🔍 Probando {symbol}...")
    try:
        ticker = yf.Ticker(symbol)
        
        # Intentar diferentes métodos
        # Método 1: history
        try:
            hist = ticker.history(period="5d")
            if not hist.empty:
                last_price = hist['Close'].iloc[-1]
                print(f"  ✅ history(): Último precio = ${last_price:.2f}")
            else:
                print(f"  ⚠️  history(): Sin datos")
        except Exception as e:
            print(f"  ❌ history(): {str(e)[:50]}")
        
        # Método 2: info
        try:
            info = ticker.info
            if info and 'regularMarketPrice' in info:
                print(f"  ✅ info(): Precio = ${info['regularMarketPrice']:.2f}")
            elif info:
                print(f"  ⚠️  info(): Datos parciales disponibles")
            else:
                print(f"  ❌ info(): Sin datos")
        except Exception as e:
            print(f"  ❌ info(): {str(e)[:50]}")
        
        # Método 3: fast_info
        try:
            fast = ticker.fast_info
            if hasattr(fast, 'last_price'):
                print(f"  ✅ fast_info: Precio = ${fast.last_price:.2f}")
            else:
                print(f"  ⚠️  fast_info: Sin precio")
        except Exception as e:
            print(f"  ❌ fast_info: {str(e)[:50]}")
        
        time.sleep(0.5)  # Evitar rate limiting
        
    except Exception as e:
        print(f"  ❌ Error general: {str(e)[:100]}")

print("\n" + "=" * 50)
print("DIAGNÓSTICO:")

# Verificar versión y sugerir soluciones
import requests
try:
    # Test directo a Yahoo Finance
    response = requests.get(
        "https://query1.finance.yahoo.com/v8/finance/chart/AAPL",
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    if response.status_code == 200:
        print("✅ Conexión directa a Yahoo Finance: OK")
    else:
        print(f"⚠️  Yahoo Finance respondió con código: {response.status_code}")
except Exception as e:
    print(f"❌ No se puede conectar a Yahoo Finance: {e}")

print(f"\n📦 Versión de yfinance: {yf.__version__}")
print("\nPOSIBLES SOLUCIONES:")
print("1. Actualizar yfinance: pip install --upgrade yfinance")
print("2. Limpiar cache: yfinance.download('AAPL', progress=False)")
print("3. Usar VPN si estás en una región bloqueada")
print("4. Esperar unos minutos (puede ser rate limiting temporal)")
