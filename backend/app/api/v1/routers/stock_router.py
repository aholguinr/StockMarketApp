from fastapi import APIRouter, HTTPException
from backend.app.models.stock import StockRequest, StockResponse
from backend.app.services.stock_service import extraer_datos_accion


# Definición del router para agrupar endpoints relacionados con "stocks"
router = APIRouter(prefix="/stocks", tags=["Stocks"])

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import io
import pandas as pd
import matplotlib.pyplot as plt
from backend.app.services.stock_service import extraer_datos_accion, obtener_datos_accion_json  # <- ya existente
from backend.app.services.stock_analyzer import analyze_stock_decision

router = APIRouter()

# ============================
# 📌 Modelos de request/response
# ============================

class GraficarRequest(BaseModel):
    nombre_archivo: str

class AnalizarRequest(BaseModel):
    nombre_accion: str
    fecha_final: Optional[str] = None
    dias_pasado: int = 30

class StockDecisionRequest(BaseModel):
    symbol: str = "AAPL"
    detailed_output: bool = True
    period: str = "6mo"

class StockVisualizationRequest(BaseModel):
    symbol: str
    period: str = "1mo"
    interval: str = "1d"


# ============================
# 📌 Endpoint: Graficar acción desde CSV
# ============================

@router.post("/graficar_accion")
def graficar_accion(req: GraficarRequest):
    """
    Lee un archivo CSV con datos de acciones, genera una gráfica
    y devuelve tanto estadísticas en JSON como la gráfica en PNG.
    """
    nombre_archivo = req.nombre_archivo

    # 1. Validar existencia del archivo
    if not os.path.exists(nombre_archivo):
        raise HTTPException(status_code=404, detail=f"Archivo {nombre_archivo} no encontrado")

    # 2. Leer CSV
    datos = pd.read_csv(nombre_archivo)
    if "Date" in datos.columns:
        datos["Date"] = pd.to_datetime(datos["Date"])

    # 3. Extraer metadatos del nombre de archivo
    partes = nombre_archivo.replace(".csv", "").split("-")
    simbolo = partes[0]

    # 4. Generar gráfica en memoria
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.plot(datos["Date"], datos["Close"], linewidth=2, color="#2E86C1", label="Precio de Cierre")
    ax.set_title(f"Evolución del Precio de Cierre - {simbolo}", fontsize=16, fontweight="bold", pad=20)
    ax.set_xlabel("Fecha", fontsize=12, fontweight="bold")
    ax.set_ylabel("Precio de Cierre (USD)", fontsize=12, fontweight="bold")
    ax.set_xlim(datos["Date"].min(), datos["Date"].max())
    ax.set_ylim(datos["Close"].min() * 0.98, datos["Close"].max() * 1.02)
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f"${x:.2f}"))
    plt.xticks(rotation=45)
    ax.grid(True, alpha=0.3)
    ax.legend(loc="best")
    plt.tight_layout()

    # Guardar imagen en memoria
    buffer = io.BytesIO()
    plt.savefig(buffer, format="png")
    buffer.seek(0)
    plt.close(fig)

    # 5. Calcular estadísticas
    precio_min = datos["Close"].min()
    precio_max = datos["Close"].max()
    precio_promedio = datos["Close"].mean()
    precio_actual = datos["Close"].iloc[-1]
    variacion = ((precio_actual - datos["Close"].iloc[0]) / datos["Close"].iloc[0]) * 100

    stats = {
        "simbolo": simbolo,
        "registros": len(datos),
        "precio_minimo": round(precio_min, 2),
        "precio_maximo": round(precio_max, 2),
        "precio_promedio": round(precio_promedio, 2),
        "precio_actual": round(precio_actual, 2),
        "variacion_porcentual": round(variacion, 2),
    }

    # 6. Devolver respuesta mixta: JSON + imagen
    headers = {"X-Stats": str(stats)}  # Metadatos en cabecera
    return StreamingResponse(buffer, media_type="image/png", headers=headers)


# ============================
# 📌 Endpoint: Análisis completo de acción
# ============================

@router.post("/analizar_accion")
def analizar_accion(req: AnalizarRequest):
    """
    Ejecuta el flujo completo:
    - Extrae datos históricos de la acción.
    - Genera una gráfica y estadísticas.
    Retorna JSON con estadísticas + ruta del archivo generado.
    """
    try:
        # Paso 1: Extraer datos con función existente
        nombre_archivo = extraer_datos_accion(
            req.nombre_accion, req.fecha_final, req.dias_pasado
        )
        if not nombre_archivo:
            raise HTTPException(status_code=500, detail="Error al extraer datos de la acción")

        # Paso 2: Graficar (reutilizando la lógica anterior)
        datos = pd.read_csv(nombre_archivo)
        if "Date" in datos.columns:
            datos["Date"] = pd.to_datetime(datos["Date"])

        precio_min = datos["Close"].min()
        precio_max = datos["Close"].max()
        precio_promedio = datos["Close"].mean()
        precio_actual = datos["Close"].iloc[-1]
        variacion = ((precio_actual - datos["Close"].iloc[0]) / datos["Close"].iloc[0]) * 100

        return {
            "archivo_generado": nombre_archivo,
            "estadisticas": {
                "precio_minimo": round(precio_min, 2),
                "precio_maximo": round(precio_max, 2),
                "precio_promedio": round(precio_promedio, 2),
                "precio_actual": round(precio_actual, 2),
                "variacion_porcentual": round(variacion, 2),
            },
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.post("/extraer", response_model=StockResponse)
def extraer_datos(req: StockRequest):
    """
    Endpoint para extraer datos históricos de una acción.

    Request:
    - nombre_accion: ticker de la acción (ej: "AAPL")
    - fecha_final: fecha límite en formato YYYY-MM-DD (opcional)
    - dias_pasado: número de días hacia atrás (por defecto 30)

    Response:
    - archivo_csv: nombre del archivo generado
    - mensaje: estado de la operación
    """
    try:
        archivo = extraer_datos_accion(
            nombre_accion=req.nombre_accion,
            fecha_final=req.fecha_final,
            dias_pasado=req.dias_pasado
        )
        return StockResponse(
            archivo_csv=archivo,
            mensaje="Datos extraídos y guardados correctamente."
        )
    except Exception as e:
        # HTTP 400 si ocurre error en la extracción
        raise HTTPException(status_code=400, detail=str(e))


# ============================
# 📌 Endpoint: Análisis de decisión de inversión
# ============================

@router.post("/stocks/analyze_decision")
def analyze_stock_investment_decision(req: StockDecisionRequest):
    """
    Realiza un análisis completo de una acción para tomar decisiones de inversión.
    
    Request:
    - symbol: Símbolo de la acción (ej: "AAPL", "TSLA")
    - detailed_output: True para análisis completo, False para resumen
    - period: Período de datos históricos ("6mo", "1y", "2y")
    
    Response:
    - Análisis completo con recomendación de compra/venta/mantener
    - Indicadores técnicos, momentum, patrones estadísticos
    - Métricas de riesgo y niveles de precios
    """
    try:
        analysis_result = analyze_stock_decision(
            symbol=req.symbol,
            detailed_output=req.detailed_output,
            period=req.period
        )
        
        # Verificar si hay error en el análisis
        if "error" in analysis_result:
            raise HTTPException(status_code=400, detail=analysis_result["error"])
        
        return analysis_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el análisis: {str(e)}")


# ============================
# 📌 Endpoint: Visualización de acciones con intervalos
# ============================

@router.post("/stocks/get_stock_data")
def get_stock_data_for_visualization(req: StockVisualizationRequest):
    """
    Obtiene datos históricos de una acción para visualización con intervalos flexibles.
    
    Request:
    - symbol: Símbolo de la acción (ej: "AAPL", "TSLA")
    - period: Período de datos ("1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max")
    - interval: Intervalo de tiempo ("1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo")
    
    Response:
    - Datos históricos en formato JSON con información de la empresa
    - Datos preparados para gráficas (fechas, precios, volumen)
    """
    try:
        # Validar inputs
        if not req.symbol or len(req.symbol.strip()) == 0:
            raise HTTPException(status_code=400, detail="Símbolo de acción requerido")
        
        # Obtener datos usando la función actualizada
        result = obtener_datos_accion_json(
            nombre_accion=req.symbol,
            periodo=req.period,
            intervalo=req.interval
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener datos: {str(e)}")


@router.get("/get_available_intervals")
def get_available_intervals():
    """
    Retorna los intervalos y períodos disponibles para la visualización.
    
    Response:
    - Lista de intervalos válidos
    - Lista de períodos válidos
    - Restricciones por intervalo
    """
    return {
        "intervals": {
            "minutes": ["1m", "2m", "5m", "15m", "30m", "60m", "90m"],
            "hours": ["1h"],
            "days": ["1d", "5d"],
            "weeks": ["1wk"],
            "months": ["1mo", "3mo"]
        },
        "periods": {
            "short_term": ["1d", "5d"],
            "medium_term": ["1mo", "3mo", "6mo"],
            "long_term": ["1y", "2y", "5y", "10y"],
            "special": ["ytd", "max"]
        },
        "restrictions": {
            "minute_intervals": {
                "allowed_intervals": ["1m", "2m", "5m", "15m", "30m", "60m", "90m"],
                "allowed_periods": ["1d", "5d"],
                "max_days": 7
            },
            "hour_intervals": {
                "allowed_intervals": ["1h"],
                "allowed_periods": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"],
                "max_days": 730
            },
            "day_or_larger": {
                "allowed_intervals": ["1d", "5d", "1wk", "1mo", "3mo"],
                "allowed_periods": "all",
                "max_days": "unlimited"
            }
        },
        "recommendations": {
            "intraday_trading": {"interval": "1m", "period": "1d"},
            "day_trading": {"interval": "5m", "period": "5d"},
            "swing_trading": {"interval": "1h", "period": "1mo"},
            "position_trading": {"interval": "1d", "period": "1y"},
            "long_term_analysis": {"interval": "1wk", "period": "5y"}
        }
    }
