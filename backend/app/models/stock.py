# Stock model

from pydantic import BaseModel, Field
from typing import Optional


# Modelo para la solicitud al endpoint
class StockRequest(BaseModel):
    nombre_accion: str = Field(..., example="AAPL")  # ticker obligatorio
    fecha_final: Optional[str] = Field(None, example="2025-08-10")  # opcional
    dias_pasado: int = Field(30, example=60)  # por defecto 30 días


# Modelo de respuesta del endpoint
class StockResponse(BaseModel):
    archivo_csv: str  # nombre del archivo creado
    mensaje: str      # mensaje de éxito
