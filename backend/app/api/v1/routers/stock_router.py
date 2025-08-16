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


# ============================
# 📌 ETF Analysis Module
# ============================

# ETF Categories and Data
MAJOR_ETFS = {
    'broad_market': {
        'name': 'Mercado Amplio',
        'description': 'ETFs que siguen índices amplios del mercado estadounidense',
        'etfs': {
            'SPY': 'SPDR S&P 500 ETF - Sigue el índice S&P 500',
            'VOO': 'Vanguard S&P 500 ETF - Versión de bajo costo del S&P 500',
            'IVV': 'iShares Core S&P 500 ETF - Otra opción para el S&P 500',
            'VTI': 'Vanguard Total Stock Market ETF - Todo el mercado de EE.UU.',
            'ITOT': 'iShares Core S&P Total U.S. Stock Market ETF'
        }
    },
    'international': {
        'name': 'Internacional',
        'description': 'ETFs de mercados internacionales desarrollados y emergentes',
        'etfs': {
            'VEA': 'Vanguard FTSE Developed Markets ETF - Mercados desarrollados',
            'IEFA': 'iShares Core MSCI EAFE IMI Index ETF',
            'VWO': 'Vanguard FTSE Emerging Markets ETF - Mercados emergentes',
            'EEM': 'iShares MSCI Emerging Markets ETF',
            'IEMG': 'iShares Core MSCI Emerging Markets IMI Index ETF'
        }
    },
    'bonds': {
        'name': 'Bonos',
        'description': 'ETFs de renta fija y bonos gubernamentales/corporativos',
        'etfs': {
            'BND': 'Vanguard Total Bond Market ETF - Bonos totales',
            'AGG': 'iShares Core U.S. Aggregate Bond ETF',
            'VGIT': 'Vanguard Intermediate-Term Treasury ETF',
            'IUSB': 'iShares Core Total USD Bond Market ETF',
            'SCHZ': 'Schwab Intermediate-Term U.S. Treasury ETF'
        }
    },
    'sectors': {
        'name': 'Sectores SPDR',
        'description': 'ETFs que siguen sectores específicos del S&P 500',
        'etfs': {
            'XLK': 'Technology Select Sector SPDR Fund - Tecnología',
            'XLF': 'Financial Select Sector SPDR Fund - Financiero',
            'XLE': 'Energy Select Sector SPDR Fund - Energía',
            'XLV': 'Health Care Select Sector SPDR Fund - Salud',
            'XLI': 'Industrial Select Sector SPDR Fund - Industrial',
            'XLP': 'Consumer Staples Select Sector SPDR Fund - Consumo básico',
            'XLY': 'Consumer Discretionary Select Sector SPDR Fund - Consumo discrecional',
            'XLU': 'Utilities Select Sector SPDR Fund - Servicios públicos',
            'XLB': 'Materials Select Sector SPDR Fund - Materiales',
            'XLRE': 'Real Estate Select Sector SPDR Fund - Bienes raíces',
            'XLC': 'Communication Services Select Sector SPDR Fund - Comunicaciones'
        }
    },
    'commodities': {
        'name': 'Commodities',
        'description': 'ETFs de materias primas y metales preciosos',
        'etfs': {
            'GLD': 'SPDR Gold Shares - Oro',
            'SLV': 'iShares Silver Trust - Plata',
            'USO': 'United States Oil Fund - Petróleo',
            'DBA': 'Invesco DB Agriculture Fund - Agricultura',
            'PDBC': 'Invesco Optimum Yield Diversified Commodity Strategy'
        }
    },
    'real_estate': {
        'name': 'Bienes Raíces',
        'description': 'ETFs de REITs y bienes raíces',
        'etfs': {
            'VNQ': 'Vanguard Real Estate ETF - REITs',
            'SCHH': 'Schwab U.S. REIT ETF',
            'FREL': 'Fidelity MSCI Real Estate Index ETF',
            'RWR': 'SPDR Dow Jones REIT ETF'
        }
    },
    'volatility': {
        'name': 'Volatilidad',
        'description': 'ETFs relacionados con la volatilidad del mercado',
        'etfs': {
            'UVXY': 'ProShares Ultra VIX Short-Term Futures ETF',
            'SVXY': 'ProShares Short VIX Short-Term Futures ETF'
        }
    },
    'thematic': {
        'name': 'Temáticos',
        'description': 'ETFs de tendencias y temas específicos',
        'etfs': {
            'NLR': 'VanEck Nuclear Energy ETF - Energía nuclear',
            'ICLN': 'iShares Global Clean Energy ETF - Energía limpia',
            'ARKK': 'ARK Innovation ETF - Innovación disruptiva',
            'SOXX': 'iShares Semiconductor ETF - Semiconductores',
            'XBI': 'SPDR S&P Biotech ETF - Biotecnología',
            'HACK': 'ETFMG Prime Cyber Security ETF - Ciberseguridad',
            'ROBO': 'ROBO Global Robotics and Automation ETF',
            'ESPO': 'VanEck Gaming ETF - Gaming y esports'
        }
    }
}

class ETFAnalysisRequest(BaseModel):
    etfs: list[str] = []
    period: str = "1y"
    interval: str = "1d"
    include_summary: bool = True

class CustomETFRequest(BaseModel):
    symbol: str
    name: str
    description: str
    category: str = "custom"

@router.get("/etfs/categories")
def get_etf_categories():
    """
    Retorna todas las categorías de ETFs con sus descripciones.
    """
    return {
        "categories": MAJOR_ETFS,
        "total_etfs": sum(len(cat["etfs"]) for cat in MAJOR_ETFS.values())
    }

@router.post("/etfs/analyze")
def analyze_etfs(req: ETFAnalysisRequest):
    """
    Analiza múltiples ETFs y retorna datos de comparación.
    
    Request:
    - etfs: Lista de símbolos de ETFs a analizar
    - period: Período de análisis
    - interval: Intervalo de datos
    - include_summary: Si incluir resumen de indicadores
    """
    try:
        results = {}
        
        # Lista de símbolos problemáticos conocidos que deben ser omitidos silenciosamente
        problematic_symbols = {'VIX'}  # VIX ya no debería estar pero por seguridad
        
        for etf_symbol in req.etfs:
            # Saltar símbolos problemáticos conocidos
            if etf_symbol in problematic_symbols:
                print(f"Skipping problematic symbol: {etf_symbol}")
                continue
                
            try:
                # Usar la función existente para obtener datos con timeout implícito
                etf_data = obtener_datos_accion_json(
                    nombre_accion=etf_symbol,
                    periodo=req.period,
                    intervalo=req.interval
                )
                
                # Validar que tenemos datos válidos
                if not etf_data or "data" not in etf_data or not etf_data["data"]:
                    results[etf_symbol] = {"error": f"No hay datos disponibles para {etf_symbol}"}
                    continue
                
                if req.include_summary:
                    # Calcular indicadores clave
                    data_points = etf_data["data"]
                    if data_points:
                        prices = [point["Close"] for point in data_points if point["Close"] and point["Close"] > 0]
                        volumes = [point["Volume"] for point in data_points if point["Volume"] and point["Volume"] > 0]
                        
                        if len(prices) > 1:
                            # Calcular métricas
                            current_price = prices[-1]
                            start_price = prices[0]
                            returns = [(prices[i] / prices[i-1] - 1) * 100 for i in range(1, len(prices))]
                            
                            summary = {
                                "current_price": round(current_price, 2),
                                "total_return": round(((current_price / start_price) - 1) * 100, 2),
                                "volatility": round(pd.Series(returns).std(), 2) if len(returns) > 1 else 0,
                                "avg_volume": int(sum(volumes) / len(volumes)) if volumes else 0,
                                "max_price": round(max(prices), 2),
                                "min_price": round(min(prices), 2),
                                "data_points": len(prices)
                            }
                            etf_data["summary"] = summary
                        else:
                            results[etf_symbol] = {"error": f"Datos insuficientes para {etf_symbol}"}
                            continue
                
                results[etf_symbol] = etf_data
                
            except Exception as e:
                error_msg = str(e).lower()
                # Detectar errores comunes y dar mensajes más específicos
                if "delisted" in error_msg or "no price data" in error_msg:
                    results[etf_symbol] = {"error": f"ETF {etf_symbol} no disponible o descontinuado"}
                elif "timeout" in error_msg:
                    results[etf_symbol] = {"error": f"Timeout obteniendo datos para {etf_symbol}"}
                else:
                    results[etf_symbol] = {"error": f"Error obteniendo datos para {etf_symbol}: {str(e)}"}
        
        return {
            "success": True,
            "period": req.period,
            "interval": req.interval,
            "analyzed_etfs": len(req.etfs),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis de ETFs: {str(e)}")

@router.get("/etfs/summary/{period}")
def get_etfs_summary(period: str = "1mo"):
    """
    Obtiene un resumen rápido de todos los ETFs principales.
    
    Parameters:
    - period: Período para el cálculo de métricas (1mo, 3mo, 6mo, 1y)
    """
    try:
        all_etfs = []
        for category_name, category_data in MAJOR_ETFS.items():
            for etf_symbol in category_data["etfs"].keys():
                all_etfs.append(etf_symbol)
        
        # Analizar todos los ETFs
        req = ETFAnalysisRequest(
            etfs=all_etfs,
            period=period,
            interval="1d",
            include_summary=True
        )
        
        analysis = analyze_etfs(req)
        
        # Reorganizar por categorías, solo incluyendo ETFs con datos válidos
        categorized_summary = {}
        for category_name, category_data in MAJOR_ETFS.items():
            categorized_summary[category_name] = {
                "name": category_data["name"],
                "description": category_data["description"],
                "etfs": {}
            }
            
            for etf_symbol, etf_description in category_data["etfs"].items():
                if (etf_symbol in analysis["results"] and 
                    "summary" in analysis["results"][etf_symbol] and 
                    "error" not in analysis["results"][etf_symbol]):
                    categorized_summary[category_name]["etfs"][etf_symbol] = {
                        "description": etf_description,
                        "summary": analysis["results"][etf_symbol]["summary"]
                    }
                # Si hay error, simplemente no incluir el ETF en el resumen para no confundir al usuario
        
        return {
            "success": True,
            "period": period,
            "generated_at": pd.Timestamp.now().isoformat(),
            "categories": categorized_summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando resumen de ETFs: {str(e)}")
