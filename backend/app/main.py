# FastAPI main application

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.routers import stock_router


# Crear instancia principal de la app FastAPI
app = FastAPI(
    title="Stock API",
    version="1.0",
    description="API para extraer datos históricos de acciones con yfinance"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica los orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar router de stocks
app.include_router(stock_router.router)

