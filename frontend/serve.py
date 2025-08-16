#!/usr/bin/env python3
"""
Simple HTTP server para servir el frontend del Stock Market Analyzer
"""

import http.server
import socketserver
import webbrowser
import os
import sys

# Configuración
PORT = 3000
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

def start_server():
    """Inicia el servidor HTTP para el frontend"""
    
    # Cambiar al directorio del frontend
    os.chdir(FRONTEND_DIR)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🚀 Servidor iniciado en http://localhost:{PORT}")
            print(f"📁 Sirviendo archivos desde: {FRONTEND_DIR}")
            print("🔗 Asegúrate de que el backend esté ejecutándose en http://localhost:8000")
            print("⏹️  Presiona Ctrl+C para detener el servidor\n")
            
            # Abrir automáticamente en el navegador
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Servir indefinidamente
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Error: El puerto {PORT} ya está en uso")
            print(f"💡 Intenta usar un puerto diferente o detén el proceso que usa el puerto {PORT}")
        else:
            print(f"❌ Error al iniciar el servidor: {e}")
        sys.exit(1)

if __name__ == "__main__":
    start_server()