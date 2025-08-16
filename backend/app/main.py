# FastAPI main application

from fastapi import FastAPI
from backend.app.api.v1.routers import stock_router


# Crear instancia principal de la app FastAPI
app = FastAPI(
    title="Stock API",
    version="1.0",
    description="API para extraer datos históricos de acciones con yfinance"
)

# Registrar router de stocks
app.include_router(stock_router.router)

