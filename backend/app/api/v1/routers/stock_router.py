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
from backend.app.services.advanced_analytics import (
    analyze_advanced_patterns, 
    predict_stock_trends, 
    calculate_technical_indicators,
    analyze_market_sentiment,
    detect_support_resistance
)

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

class MultiStockAnalysisRequest(BaseModel):
    symbols: list[str]
    period: str = "6mo"
    detailed_output: bool = True
    normalize: bool = False

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


# ============================
# 📌 Multi-Stock Analysis Module
# ============================

@router.post("/stocks/analyze_multiple")
def analyze_multiple_stocks(req: MultiStockAnalysisRequest):
    """
    Analiza múltiples acciones y proporciona comparación y recomendaciones globales.
    
    Request:
    - symbols: Lista de símbolos de acciones (máximo 10)
    - period: Período de análisis
    - detailed_output: Si incluir análisis detallado
    - normalize: Si normalizar valores para comparación
    
    Response:
    - Análisis individual de cada acción
    - Tabla comparativa
    - Recomendaciones globales
    - Métricas de portafolio
    """
    try:
        # Validar número de símbolos
        if len(req.symbols) > 10:
            raise HTTPException(status_code=400, detail="Máximo 10 acciones permitidas")
        
        if len(req.symbols) == 0:
            raise HTTPException(status_code=400, detail="Debe proporcionar al menos una acción")
        
        # Eliminar duplicados y limpiar símbolos
        unique_symbols = list(dict.fromkeys([symbol.upper().strip() for symbol in req.symbols if symbol.strip()]))
        
        if len(unique_symbols) == 0:
            raise HTTPException(status_code=400, detail="No se proporcionaron símbolos válidos")
        
        results = {}
        successful_analyses = []
        failed_analyses = []
        
        # Analizar cada acción individualmente
        for symbol in unique_symbols:
            try:
                # Usar la función existente de análisis
                individual_analysis = analyze_stock_decision(
                    symbol=symbol,
                    detailed_output=req.detailed_output,
                    period=req.period
                )
                
                if "error" not in individual_analysis:
                    results[symbol] = individual_analysis
                    successful_analyses.append(symbol)
                else:
                    failed_analyses.append({"symbol": symbol, "error": individual_analysis["error"]})
                    
            except Exception as e:
                failed_analyses.append({"symbol": symbol, "error": str(e)})
        
        if len(successful_analyses) == 0:
            raise HTTPException(status_code=400, detail="No se pudo analizar ninguna acción exitosamente")
        
        # Generar análisis comparativo
        comparative_analysis = generate_comparative_analysis(results, req.normalize)
        
        # Generar recomendaciones globales
        global_recommendations = generate_global_recommendations(results, comparative_analysis)
        
        return {
            "success": True,
            "period": req.period,
            "total_requested": len(unique_symbols),
            "successful_analyses": len(successful_analyses),
            "failed_analyses": len(failed_analyses),
            "individual_results": results,
            "comparative_analysis": comparative_analysis,
            "global_recommendations": global_recommendations,
            "failed_symbols": failed_analyses,
            "normalized": req.normalize
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis múltiple: {str(e)}")


def generate_comparative_analysis(results, normalize=False):
    """
    Genera análisis comparativo entre múltiples acciones.
    """
    if not results:
        return {}
    
    # Extraer métricas clave de cada acción
    comparison_table = []
    
    for symbol, data in results.items():
        try:
            row = {
                "symbol": symbol,
                "current_price": float(data.get("current_price", 0)),
                "recommendation": data.get("recommendation", "N/A"),
                "confidence": float(data.get("confidence", 0)),
                "entry_price": float(data.get("entry_price", 0)),
                "stop_loss": float(data.get("stop_loss", 0)),
                "take_profit": float(data.get("take_profit", 0)),
                "risk_level": data.get("risk_level", "N/A"),
                "final_score": float(data.get("scoring_breakdown", {}).get("final_score", 0)),
                "technical_score": float(data.get("scoring_breakdown", {}).get("technical_score", 0)),
                "momentum_score": float(data.get("scoring_breakdown", {}).get("momentum_score", 0)),
                "risk_score": float(data.get("scoring_breakdown", {}).get("risk_score", 0)),
                "sharpe_ratio": float(data.get("risk_metrics", {}).get("sharpe_ratio", 0)),
                "volatility": float(data.get("risk_metrics", {}).get("daily_volatility", 0)),
                "max_drawdown": float(data.get("risk_metrics", {}).get("max_drawdown", 0))
            }
            
            comparison_table.append(row)
            
        except (ValueError, TypeError) as e:
            print(f"Error processing {symbol}: {e}")
            continue
    
    if not comparison_table:
        return {"error": "No se pudieron procesar los datos para comparación"}
    
    # Normalizar valores si se solicita
    if normalize and len(comparison_table) > 1:
        comparison_table = normalize_values(comparison_table)
    
    # Calcular estadísticas del grupo
    scores = [row["final_score"] for row in comparison_table if row["final_score"] > 0]
    confidences = [row["confidence"] for row in comparison_table if row["confidence"] > 0]
    volatilities = [row["volatility"] for row in comparison_table if row["volatility"] > 0]
    
    group_stats = {
        "avg_score": round(sum(scores) / len(scores), 2) if scores else 0,
        "max_score": max(scores) if scores else 0,
        "min_score": min(scores) if scores else 0,
        "avg_confidence": round(sum(confidences) / len(confidences), 2) if confidences else 0,
        "avg_volatility": round(sum(volatilities) / len(volatilities), 2) if volatilities else 0,
        "best_performer": max(comparison_table, key=lambda x: x["final_score"])["symbol"] if comparison_table else None,
        "worst_performer": min(comparison_table, key=lambda x: x["final_score"])["symbol"] if comparison_table else None
    }
    
    # Ranking por diferentes criterios
    rankings = {
        "by_score": sorted(comparison_table, key=lambda x: x["final_score"], reverse=True),
        "by_confidence": sorted(comparison_table, key=lambda x: x["confidence"], reverse=True),
        "by_sharpe_ratio": sorted(comparison_table, key=lambda x: x["sharpe_ratio"], reverse=True),
        "by_risk_adjusted": sorted(comparison_table, key=lambda x: x["final_score"] / max(x["volatility"], 1), reverse=True)
    }
    
    return {
        "comparison_table": comparison_table,
        "group_statistics": group_stats,
        "rankings": rankings,
        "total_stocks": len(comparison_table)
    }


def normalize_values(data):
    """
    Normaliza valores numéricos para comparación objetiva (0-100 scale).
    """
    if len(data) <= 1:
        return data
    
    # Campos a normalizar
    fields_to_normalize = [
        "final_score", "technical_score", "momentum_score", 
        "risk_score", "confidence", "sharpe_ratio"
    ]
    
    normalized_data = []
    
    for row in data:
        normalized_row = row.copy()
        
        for field in fields_to_normalize:
            values = [r.get(field, 0) for r in data if r.get(field) is not None]
            
            if len(values) > 1 and max(values) != min(values):
                # Min-max normalization to 0-100 scale
                min_val = min(values)
                max_val = max(values)
                current_val = row.get(field, 0)
                
                normalized_val = ((current_val - min_val) / (max_val - min_val)) * 100
                normalized_row[f"{field}_normalized"] = round(normalized_val, 2)
            else:
                normalized_row[f"{field}_normalized"] = row.get(field, 0)
        
        normalized_data.append(normalized_row)
    
    return normalized_data


def generate_global_recommendations(results, comparative_analysis):
    """
    Genera recomendaciones globales basadas en el análisis de múltiples acciones.
    """
    if not results or not comparative_analysis.get("comparison_table"):
        return {"error": "Datos insuficientes para recomendaciones globales"}
    
    comparison_table = comparative_analysis["comparison_table"]
    group_stats = comparative_analysis["group_statistics"]
    
    # Análisis de distribución de recomendaciones
    recommendations = [row["recommendation"] for row in comparison_table]
    rec_counts = {}
    for rec in recommendations:
        rec_counts[rec] = rec_counts.get(rec, 0) + 1
    
    # Acciones con mejor puntuación
    top_performers = sorted(comparison_table, key=lambda x: x["final_score"], reverse=True)[:3]
    
    # Acciones de alto riesgo
    high_risk_stocks = [row for row in comparison_table if row["risk_level"] == "ALTO"]
    
    # Acciones con mejor ratio riesgo-retorno
    best_risk_adjusted = sorted(
        comparison_table, 
        key=lambda x: x["final_score"] / max(x["volatility"], 1), 
        reverse=True
    )[:3]
    
    # Generar recomendaciones de portafolio (para uso futuro)
    # portfolio_recommendations = []
    
    # Estrategia conservadora
    conservative_picks = [
        row for row in comparison_table 
        if row["risk_level"] in ["BAJO", "MEDIO"] and row["confidence"] >= 70
    ]
    
    # Estrategia agresiva
    aggressive_picks = [
        row for row in comparison_table 
        if row["final_score"] >= group_stats["avg_score"] and row["recommendation"] == "COMPRAR"
    ]
    
    # Diversificación por niveles de riesgo
    risk_distribution = {}
    for row in comparison_table:
        risk_level = row["risk_level"]
        risk_distribution[risk_level] = risk_distribution.get(risk_level, 0) + 1
    
    # Recomendaciones específicas
    specific_recommendations = []
    
    if len(top_performers) > 0:
        specific_recommendations.append({
            "type": "top_pick",
            "title": "Mejor Oportunidad",
            "symbol": top_performers[0]["symbol"],
            "reason": f"Mayor puntuación ({top_performers[0]['final_score']}) y confianza del {top_performers[0]['confidence']}%"
        })
    
    if len(conservative_picks) > 0:
        specific_recommendations.append({
            "type": "conservative",
            "title": "Opción Conservadora",
            "symbols": [stock["symbol"] for stock in conservative_picks[:2]],
            "reason": "Bajo riesgo con buena confianza en la recomendación"
        })
    
    if len(best_risk_adjusted) > 0:
        specific_recommendations.append({
            "type": "risk_adjusted",
            "title": "Mejor Ratio Riesgo-Retorno",
            "symbol": best_risk_adjusted[0]["symbol"],
            "reason": "Óptima relación entre puntuación y volatilidad"
        })
    
    # Alertas y warnings
    alerts = []
    
    if len(high_risk_stocks) > len(comparison_table) * 0.5:
        alerts.append({
            "type": "warning",
            "message": "Más del 50% de las acciones presentan alto riesgo. Considere diversificar."
        })
    
    if group_stats["avg_confidence"] < 60:
        alerts.append({
            "type": "caution",
            "message": f"Confianza promedio baja ({group_stats['avg_confidence']}%). Mercado volátil o datos limitados."
        })
    
    if rec_counts.get("VENDER", 0) > rec_counts.get("COMPRAR", 0):
        alerts.append({
            "type": "bearish",
            "message": "Predominan señales de venta. Considere estrategias defensivas."
        })
    
    return {
        "portfolio_score": round(group_stats["avg_score"], 2),
        "recommendation_distribution": rec_counts,
        "top_performers": [stock["symbol"] for stock in top_performers],
        "risk_distribution": risk_distribution,
        "conservative_options": [stock["symbol"] for stock in conservative_picks],
        "aggressive_options": [stock["symbol"] for stock in aggressive_picks],
        "specific_recommendations": specific_recommendations,
        "alerts": alerts,
        "summary": {
            "best_pick": top_performers[0]["symbol"] if top_performers else None,
            "portfolio_strength": "FUERTE" if group_stats["avg_score"] >= 70 else "MODERADA" if group_stats["avg_score"] >= 50 else "DÉBIL",
            "diversification_score": min(len(set(recommendations)), 3) * 33.33,  # Max 100% if all 3 rec types present
            "overall_recommendation": "COMPRAR" if rec_counts.get("COMPRAR", 0) > len(comparison_table) * 0.5 else "MANTENER"
        }
    }


# ============================
# 📌 Advanced Analytics Endpoints
# ============================

class AdvancedPatternsRequest(BaseModel):
    symbol: str
    period: str = "1y"
    interval: str = "1d"

class PredictionRequest(BaseModel):
    symbol: str
    period: str = "1y"
    forecast_days: int = 30

class TechnicalIndicatorsRequest(BaseModel):
    symbol: str
    period: str = "6mo"
    interval: str = "1d"

class SentimentAnalysisRequest(BaseModel):
    symbol: str
    period: str = "3mo"

class SupportResistanceRequest(BaseModel):
    symbol: str
    period: str = "6mo"
    interval: str = "1d"

@router.post("/stocks/analyze_patterns")
def analyze_stock_patterns(req: AdvancedPatternsRequest):
    """
    Analiza patrones avanzados como ondas de Elliott, fractales, divergencias.
    
    Request:
    - symbol: Símbolo de la acción
    - period: Período de análisis
    - interval: Intervalo de datos
    
    Response:
    - Análisis de patrones técnicos avanzados
    - Ondas de Elliott, fractales, divergencias
    - Estructura de mercado y análisis de volumen
    """
    try:
        result = analyze_advanced_patterns(
            symbol=req.symbol,
            period=req.period,
            interval=req.interval
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing patterns: {str(e)}")

@router.post("/stocks/predict_trends")
def predict_stock_trends_endpoint(req: PredictionRequest):
    """
    Predice tendencias futuras usando múltiples modelos de machine learning.
    
    Request:
    - symbol: Símbolo de la acción
    - period: Período histórico para el análisis
    - forecast_days: Días a predecir hacia el futuro
    
    Response:
    - Predicciones usando múltiples modelos (Linear, RF, ARIMA, etc.)
    - Predicción ensemble ponderada
    - Métricas de confianza
    - Niveles futuros de soporte y resistencia
    """
    try:
        if req.forecast_days > 90:
            raise HTTPException(status_code=400, detail="Maximum forecast period is 90 days")
        
        result = predict_stock_trends(
            symbol=req.symbol,
            period=req.period,
            forecast_days=req.forecast_days
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting trends: {str(e)}")

@router.post("/stocks/technical_indicators")
def get_technical_indicators(req: TechnicalIndicatorsRequest):
    """
    Calcula indicadores técnicos avanzados y osciladores.
    
    Request:
    - symbol: Símbolo de la acción
    - period: Período de análisis
    - interval: Intervalo de datos
    
    Response:
    - Indicadores técnicos completos (RSI, MACD, Bollinger, etc.)
    - Osciladores avanzados (Stochastic, Williams %R, CCI, etc.)
    - Indicadores de momentum y volumen
    - Señales técnicas actuales
    """
    try:
        result = calculate_technical_indicators(
            symbol=req.symbol,
            period=req.period,
            interval=req.interval
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating indicators: {str(e)}")

@router.post("/stocks/sentiment_analysis")
def analyze_stock_sentiment(req: SentimentAnalysisRequest):
    """
    Analiza el sentiment del mercado basado en patrones de precio y volumen.
    
    Request:
    - symbol: Símbolo de la acción
    - period: Período de análisis
    
    Response:
    - Análisis de sentiment de precio, volumen y volatilidad
    - Detección de régimen de mercado
    - Indicadores de miedo y avaricia
    - Score de sentiment general
    """
    try:
        result = analyze_market_sentiment(
            symbol=req.symbol,
            period=req.period
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@router.post("/stocks/support_resistance")
def detect_support_resistance_levels(req: SupportResistanceRequest):
    """
    Detecta niveles de soporte y resistencia automáticamente.
    
    Request:
    - symbol: Símbolo de la acción
    - period: Período de análisis
    - interval: Intervalo de datos
    
    Response:
    - Niveles de soporte y resistencia estáticos
    - Niveles dinámicos (medias móviles, líneas de tendencia)
    - Retrocesos de Fibonacci
    - Puntos pivot
    - Análisis de fortaleza de niveles
    """
    try:
        result = detect_support_resistance(
            symbol=req.symbol,
            period=req.period,
            interval=req.interval
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting support/resistance: {str(e)}")

@router.get("/stocks/advanced_analytics_info")
def get_advanced_analytics_info():
    """
    Retorna información sobre las capacidades de análisis avanzado disponibles.
    
    Response:
    - Lista de patrones que se pueden detectar
    - Modelos de predicción disponibles
    - Indicadores técnicos soportados
    - Métricas de sentiment disponibles
    """
    return {
        "patterns": {
            "elliott_waves": "Detección de ondas de Elliott (simplificada)",
            "fractals": "Identificación de fractales en el precio",
            "divergences": "Divergencias RSI/MACD",
            "chart_patterns": "Patrones de gráfico (doble techo/suelo, triángulos)",
            "harmonic_patterns": "Patrones armónicos (Gartley, Butterfly)"
        },
        "prediction_models": {
            "linear_trend": "Predicción basada en tendencia lineal",
            "moving_average": "Predicción basada en medias móviles",
            "random_forest": "Modelo Random Forest con características técnicas",
            "arima_simple": "Modelo ARIMA simplificado",
            "ensemble": "Predicción ensemble ponderada"
        },
        "technical_indicators": {
            "basic": ["SMA", "EMA", "RSI", "MACD", "Bollinger Bands"],
            "oscillators": ["Stochastic", "Williams %R", "CCI", "ATR"],
            "momentum": ["Momentum", "ROC", "Awesome Oscillator"],
            "volume": ["Volume SMA", "VWAP", "OBV"],
            "trend": ["Parabolic SAR", "Ichimoku"]
        },
        "sentiment_analysis": {
            "price_sentiment": "Análisis basado en acción del precio",
            "volume_sentiment": "Análisis basado en patrones de volumen",
            "volatility_sentiment": "Análisis basado en volatilidad",
            "market_regime": "Detección de régimen de mercado",
            "fear_greed": "Indicadores de miedo y avaricia"
        },
        "support_resistance": {
            "static_levels": "Niveles fijos basados en máximos/mínimos",
            "dynamic_levels": "Medias móviles y líneas de tendencia",
            "fibonacci": "Retrocesos de Fibonacci",
            "pivot_points": "Puntos pivot diarios",
            "level_strength": "Análisis de fortaleza de niveles"
        },
        "forecast_capabilities": {
            "max_forecast_days": 90,
            "confidence_metrics": True,
            "volatility_forecast": True,
            "future_support_resistance": True
        }
    }


# ============================
# 📌 Portfolio Analysis Module
# ============================

class PortfolioRequest(BaseModel):
    assets: list[dict]  # [{"symbol": "AAPL", "weight": 25.0}, ...]
    period: str = "1y"
    analysis_types: list[str] = ["correlation", "risk_metrics", "outliers", "performance"]

class PortfolioOptimizationRequest(BaseModel):
    assets: list[dict]  # [{"symbol": "AAPL", "weight": 25.0}, ...]
    period: str = "1y"
    objective: str = "max_sharpe"  # max_sharpe, min_volatility, target_return, max_diversification
    target_return: float = 0.12  # Only used if objective is target_return
    risk_free_rate: float = 0.025
    optimization_methods: list[str] = ["risk_parity", "markowitz", "hybrid", "black_litterman"]

@router.post("/portfolio/analyze")
def analyze_portfolio(req: PortfolioRequest):
    """
    Analiza un portafolio completo con múltiples activos.
    
    Request:
    - assets: Lista de activos con símbolos y pesos [{"symbol": "AAPL", "weight": 25.0}]
    - period: Período de análisis histórico
    - analysis_types: Tipos de análisis a realizar ["correlation", "risk_metrics", "outliers", "performance"]
    
    Response:
    - Matriz de correlación entre activos
    - Métricas de riesgo del portafolio (VaR, CVaR, Volatilidad, Beta, etc.)
    - Detección de outliers en retornos
    - Resumen de performance del portafolio
    """
    try:
        # Validar inputs
        if not req.assets or len(req.assets) < 2:
            raise HTTPException(status_code=400, detail="Se requieren al menos 2 activos para análisis de portafolio")
        
        if len(req.assets) > 20:
            raise HTTPException(status_code=400, detail="Máximo 20 activos permitidos en el portafolio")
        
        # Validar pesos
        total_weight = sum(asset["weight"] for asset in req.assets)
        if abs(total_weight - 100) > 10:
            raise HTTPException(status_code=400, detail="Los pesos del portafolio deben sumar aproximadamente 100%")
        
        # Obtener datos de cada activo
        portfolio_data = {}
        for asset in req.assets:
            symbol = asset["symbol"].upper()
            try:
                stock_data = obtener_datos_accion_json(
                    nombre_accion=symbol,
                    periodo=req.period,
                    intervalo="1d"
                )
                
                if not stock_data or "data" not in stock_data or not stock_data["data"]:
                    continue
                    
                portfolio_data[symbol] = {
                    "weight": asset["weight"] / 100.0,  # Convert to decimal
                    "data": stock_data["data"],
                    "info": stock_data.get("info", {})
                }
                
            except Exception as e:
                print(f"Error getting data for {symbol}: {e}")
                continue
        
        if len(portfolio_data) < 2:
            raise HTTPException(status_code=400, detail="No se pudieron obtener datos suficientes para el análisis")
        
        # Realizar análisis según los tipos solicitados
        result = {"success": True, "period": req.period, "assets_analyzed": len(portfolio_data)}
        
        # Preparar matrices de datos para análisis
        import pandas as pd
        import numpy as np
        
        # Crear DataFrame con precios de cierre
        price_data = {}
        dates = None
        
        for symbol, data in portfolio_data.items():
            prices = []
            symbol_dates = []
            
            for point in data["data"]:
                if point.get("Close") and point.get("Date"):
                    prices.append(float(point["Close"]))
                    symbol_dates.append(point["Date"])
            
            if prices:
                price_data[symbol] = prices
                if dates is None:
                    dates = symbol_dates
        
        if not price_data:
            raise HTTPException(status_code=400, detail="No se pudieron procesar los datos de precios")
        
        # Crear DataFrame
        min_length = min(len(prices) for prices in price_data.values())
        df = pd.DataFrame({symbol: prices[-min_length:] for symbol, prices in price_data.items()})
        df.index = dates[-min_length:] if dates else range(min_length)
        
        # 1. Análisis de Correlación
        if "correlation" in req.analysis_types:
            correlation_matrix = df.corr()
            result["correlation_matrix"] = {
                "matrix": correlation_matrix.values.tolist(),
                "symbols": correlation_matrix.columns.tolist(),
                "interpretation": "Correlación entre -1 (correlación negativa perfecta) y +1 (correlación positiva perfecta)"
            }
        
        # 2. Métricas de Riesgo
        if "risk_metrics" in req.analysis_types:
            # Calcular retornos
            returns = df.pct_change().dropna()
            
            # Pesos del portafolio
            weights = np.array([portfolio_data[symbol]["weight"] for symbol in df.columns])
            weights = weights / weights.sum()  # Normalizar
            
            # Retornos del portafolio
            portfolio_returns = (returns * weights).sum(axis=1)
            
            # Métricas básicas
            portfolio_volatility = portfolio_returns.std() * np.sqrt(252)  # Anualizada
            portfolio_return = portfolio_returns.mean() * 252  # Anualizada
            
            # VaR y CVaR (95%)
            var_95 = np.percentile(portfolio_returns, 5)
            cvar_95 = portfolio_returns[portfolio_returns <= var_95].mean()
            
            # Maximum Drawdown
            cumulative_returns = (1 + portfolio_returns).cumprod()
            rolling_max = cumulative_returns.expanding().max()
            drawdown = (cumulative_returns / rolling_max) - 1
            max_drawdown = drawdown.min()
            
            # Volatilidad individual
            individual_volatility = {}
            for symbol in df.columns:
                individual_volatility[symbol] = returns[symbol].std() * np.sqrt(252)
            
            # Beta del portafolio (usando SPY como proxy del mercado)
            try:
                spy_data = obtener_datos_accion_json("SPY", req.period, "1d")
                if spy_data and "data" in spy_data:
                    spy_prices = [float(point["Close"]) for point in spy_data["data"] 
                                if point.get("Close")][-min_length:]
                    spy_returns = pd.Series(spy_prices).pct_change().dropna()
                    
                    if len(spy_returns) >= len(portfolio_returns):
                        spy_returns = spy_returns[-len(portfolio_returns):]
                        covariance = np.cov(portfolio_returns, spy_returns)[0, 1]
                        market_variance = spy_returns.var()
                        portfolio_beta = covariance / market_variance if market_variance > 0 else None
                        r_squared = np.corrcoef(portfolio_returns, spy_returns)[0, 1] ** 2
                    else:
                        portfolio_beta = None
                        r_squared = None
                else:
                    portfolio_beta = None
                    r_squared = None
            except:
                portfolio_beta = None
                r_squared = None
            
            # Ratio de diversificación
            weighted_volatilities = sum(weights[i] * individual_volatility[symbol] 
                                      for i, symbol in enumerate(df.columns))
            diversification_ratio = weighted_volatilities / portfolio_volatility if portfolio_volatility > 0 else 0
            
            result["risk_metrics"] = {
                "portfolio_volatility": portfolio_volatility,
                "portfolio_return": portfolio_return,
                "var_95": var_95,
                "cvar_95": cvar_95,
                "max_drawdown": max_drawdown,
                "individual_volatility": individual_volatility,
                "portfolio_beta": portfolio_beta,
                "r_squared": r_squared,
                "diversification_ratio": diversification_ratio,
                "sharpe_ratio": portfolio_return / portfolio_volatility if portfolio_volatility > 0 else 0
            }
        
        # 3. Detección de Outliers
        if "outliers" in req.analysis_types:
            outliers_result = detect_portfolio_outliers(df, returns if 'returns' in locals() else df.pct_change().dropna())
            result["outliers"] = outliers_result
        
        # 4. Performance Summary
        if "performance" in req.analysis_types:
            if 'portfolio_returns' in locals():
                cumulative_return = (1 + portfolio_returns).prod() - 1
                annualized_return = (1 + cumulative_return) ** (252 / len(portfolio_returns)) - 1
                
                result["performance"] = {
                    "total_return": cumulative_return,
                    "annualized_return": annualized_return,
                    "volatility": portfolio_volatility if 'portfolio_volatility' in locals() else 0,
                    "sharpe_ratio": result.get("risk_metrics", {}).get("sharpe_ratio", 0),
                    "max_drawdown": max_drawdown if 'max_drawdown' in locals() else 0,
                    "total_days": len(portfolio_returns),
                    "best_day": portfolio_returns.max(),
                    "worst_day": portfolio_returns.min()
                }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing portfolio: {str(e)}")


def detect_portfolio_outliers(price_df, returns_df):
    """
    Detecta outliers en los retornos del portafolio usando múltiples métodos.
    """
    import numpy as np
    try:
        outliers_data = {
            "total_outliers": 0,
            "outliers_percentage": 0,
            "methods": {},
            "data": {}
        }
        
        for symbol in returns_df.columns:
            symbol_returns = returns_df[symbol].dropna()
            symbol_outliers = []
            symbol_normal = []
            
            # Método 1: Z-Score
            z_scores = np.abs((symbol_returns - symbol_returns.mean()) / symbol_returns.std())
            z_outliers = symbol_returns[z_scores > 3]
            
            # Método 2: IQR
            Q1 = symbol_returns.quantile(0.25)
            Q3 = symbol_returns.quantile(0.75)
            IQR = Q3 - Q1
            iqr_outliers = symbol_returns[(symbol_returns < Q1 - 1.5 * IQR) | 
                                        (symbol_returns > Q3 + 1.5 * IQR)]
            
            # Combinar outliers (union de métodos)
            outlier_indices = set(z_outliers.index) | set(iqr_outliers.index)
            
            # Preparar datos para gráfica
            dates = price_df.index if hasattr(price_df.index, 'tolist') else list(range(len(symbol_returns)))
            
            for i, (date, return_val) in enumerate(zip(dates[-len(symbol_returns):], symbol_returns)):
                point = {"date": str(date), "return": float(return_val)}
                
                if i in outlier_indices:
                    symbol_outliers.append(point)
                else:
                    symbol_normal.append(point)
            
            outliers_data["data"][symbol] = {
                "outliers": symbol_outliers,
                "normal": symbol_normal
            }
            
            # Contar outliers por método
            outliers_data["methods"][f"{symbol}_zscore"] = len(z_outliers)
            outliers_data["methods"][f"{symbol}_iqr"] = len(iqr_outliers)
        
        # Estadísticas generales
        total_points = sum(len(outliers_data["data"][symbol]["outliers"]) + 
                         len(outliers_data["data"][symbol]["normal"]) 
                         for symbol in outliers_data["data"])
        total_outliers = sum(len(outliers_data["data"][symbol]["outliers"]) 
                           for symbol in outliers_data["data"])
        
        outliers_data["total_outliers"] = total_outliers
        outliers_data["outliers_percentage"] = (total_outliers / total_points * 100) if total_points > 0 else 0
        
        return outliers_data
        
    except Exception as e:
        return {"error": f"Error detecting outliers: {str(e)}"}


@router.post("/portfolio/optimize")
def optimize_portfolio(req: PortfolioOptimizationRequest):
    """
    Optimiza un portafolio usando múltiples metodologías.
    
    Request:
    - assets: Lista de activos con símbolos y pesos [{"symbol": "AAPL", "weight": 25.0}]
    - period: Período de análisis histórico
    - objective: Objetivo de optimización (max_sharpe, min_volatility, target_return, max_diversification)
    - target_return: Retorno objetivo (solo para target_return)
    - risk_free_rate: Tasa libre de riesgo
    - optimization_methods: Métodos a utilizar
    
    Response:
    - Resultados de optimización para cada método
    - Selección óptima automática
    - Recomendaciones y sugerencias
    """
    try:
        # Validar inputs
        if not req.assets or len(req.assets) < 2:
            raise HTTPException(status_code=400, detail="Se requieren al menos 2 activos para optimización de portafolio")
        
        if len(req.assets) > 20:
            raise HTTPException(status_code=400, detail="Máximo 20 activos permitidos en el portafolio")
        
        # Obtener datos de cada activo
        portfolio_data = {}
        for asset in req.assets:
            symbol = asset["symbol"].upper()
            try:
                stock_data = obtener_datos_accion_json(
                    nombre_accion=symbol,
                    periodo=req.period,
                    intervalo="1d"
                )
                
                if not stock_data or "data" not in stock_data or not stock_data["data"]:
                    continue
                    
                portfolio_data[symbol] = {
                    "data": stock_data["data"],
                    "info": stock_data.get("info", {})
                }
                
            except Exception as e:
                print(f"Error getting data for {symbol}: {e}")
                continue
        
        if len(portfolio_data) < 2:
            raise HTTPException(status_code=400, detail="No se pudieron obtener datos suficientes para la optimización")
        
        # Preparar datos para optimización
        import pandas as pd
        import numpy as np
        from scipy.optimize import minimize
        
        # Crear DataFrame con precios de cierre
        price_data = {}
        dates = None
        
        for symbol, data in portfolio_data.items():
            prices = []
            symbol_dates = []
            
            for point in data["data"]:
                if point.get("Close") and point.get("Date"):
                    prices.append(float(point["Close"]))
                    symbol_dates.append(point["Date"])
            
            if prices:
                price_data[symbol] = prices
                if dates is None:
                    dates = symbol_dates
        
        # Crear DataFrame y calcular retornos
        min_length = min(len(prices) for prices in price_data.values())
        df = pd.DataFrame({symbol: prices[-min_length:] for symbol, prices in price_data.items()})
        returns = df.pct_change().dropna()
        
        # Calcular estadísticas básicas
        mean_returns = returns.mean() * 252  # Anualizado
        cov_matrix = returns.cov() * 252  # Anualizado
        symbols = list(returns.columns)
        n_assets = len(symbols)
        
        # Resultado base
        result = {
            "success": True,
            "period": req.period,
            "objective": req.objective,
            "assets_optimized": len(symbols),
            "symbols": symbols
        }
        
        # 1. Risk Parity Optimization
        if "risk_parity" in req.optimization_methods:
            result["risk_parity"] = optimize_risk_parity(returns, mean_returns, cov_matrix, req.risk_free_rate)
        
        # 2. Markowitz Optimization
        if "markowitz" in req.optimization_methods:
            result["markowitz"] = optimize_markowitz(mean_returns, cov_matrix, req.objective, req.target_return, req.risk_free_rate)
        
        # 3. Hybrid Optimization
        if "hybrid" in req.optimization_methods:
            rp_weights = result.get("risk_parity", {}).get("weights", {})
            mv_weights = result.get("markowitz", {}).get("weights", {})
            result["hybrid"] = optimize_hybrid(rp_weights, mv_weights, mean_returns, cov_matrix, req.risk_free_rate)
        
        # 4. Black-Litterman Optimization
        if "black_litterman" in req.optimization_methods:
            result["black_litterman"] = optimize_black_litterman(mean_returns, cov_matrix, symbols, req.risk_free_rate)
        
        # 5. Determinar selección óptima
        result["optimal_selection"] = determine_optimal_selection(result, req.objective)
        
        # 6. Generar recomendaciones
        result["recommendations"] = generate_optimization_recommendations(result, req)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error optimizing portfolio: {str(e)}")


def optimize_risk_parity(returns, mean_returns, cov_matrix, risk_free_rate):
    """
    Optimización Risk Parity - igual contribución de riesgo.
    """
    try:
        import numpy as np
        from scipy.optimize import minimize
        
        n_assets = len(returns.columns)
        
        def risk_budget_objective(weights, cov_matrix):
            """
            Función objetivo para Risk Parity
            """
            weights = np.array(weights)
            portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
            
            # Contribución marginal de riesgo
            marginal_contrib = np.dot(cov_matrix, weights)
            contrib = weights * marginal_contrib / portfolio_variance
            
            # Minimizar la suma de las diferencias al cuadrado de las contribuciones
            target_contrib = 1.0 / n_assets
            return np.sum((contrib - target_contrib) ** 2)
        
        # Restricciones
        constraints = {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
        bounds = tuple((0.01, 0.8) for _ in range(n_assets))  # Min 1%, Max 80%
        
        # Inicialización igual peso
        x0 = np.array([1.0 / n_assets] * n_assets)
        
        # Optimización
        result_opt = minimize(
            risk_budget_objective,
            x0,
            args=(cov_matrix.values,),
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000}
        )
        
        if result_opt.success:
            weights = result_opt.x
            weights_dict = {symbol: float(weight) for symbol, weight in zip(returns.columns, weights)}
            
            # Calcular métricas
            portfolio_return = np.sum(mean_returns * weights)
            portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
            
            return {
                "weights": weights_dict,
                "expected_return": float(portfolio_return),
                "volatility": float(portfolio_volatility),
                "sharpe_ratio": float(sharpe_ratio),
                "methodology": "Equal Risk Contribution"
            }
        else:
            return {"error": "Risk Parity optimization failed to converge"}
            
    except Exception as e:
        return {"error": f"Error in Risk Parity optimization: {str(e)}"}


def optimize_markowitz(mean_returns, cov_matrix, objective, target_return, risk_free_rate):
    """
    Optimización de Markowitz (Mean-Variance).
    """
    try:
        import numpy as np
        from scipy.optimize import minimize
        
        n_assets = len(mean_returns)
        
        def portfolio_stats(weights):
            """
            Calcula estadísticas del portafolio
            """
            weights = np.array(weights)
            portfolio_return = np.sum(mean_returns * weights)
            portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
            portfolio_volatility = np.sqrt(portfolio_variance)
            sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
            return portfolio_return, portfolio_volatility, sharpe_ratio
        
        # Función objetivo según el objetivo
        if objective == "max_sharpe":
            def objective_function(weights):
                _, volatility, sharpe = portfolio_stats(weights)
                return -sharpe  # Negativo para maximizar
        elif objective == "min_volatility":
            def objective_function(weights):
                _, volatility, _ = portfolio_stats(weights)
                return volatility
        elif objective == "target_return":
            def objective_function(weights):
                _, volatility, _ = portfolio_stats(weights)
                return volatility
        else:  # max_diversification
            def objective_function(weights):
                weights = np.array(weights)
                weighted_volatilities = np.sum(weights * np.sqrt(np.diag(cov_matrix)))
                portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
                diversification_ratio = weighted_volatilities / portfolio_volatility
                return -diversification_ratio  # Negativo para maximizar
        
        # Restricciones
        constraints = [{'type': 'eq', 'fun': lambda x: np.sum(x) - 1}]
        
        if objective == "target_return":
            constraints.append({
                'type': 'eq',
                'fun': lambda x: np.sum(mean_returns * x) - target_return
            })
        
        bounds = tuple((0.01, 0.8) for _ in range(n_assets))  # Min 1%, Max 80%
        
        # Inicialización igual peso
        x0 = np.array([1.0 / n_assets] * n_assets)
        
        # Optimización
        result_opt = minimize(
            objective_function,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000}
        )
        
        if result_opt.success:
            weights = result_opt.x
            weights_dict = {symbol: float(weight) for symbol, weight in zip(mean_returns.index, weights)}
            
            # Calcular métricas finales
            portfolio_return, portfolio_volatility, sharpe_ratio = portfolio_stats(weights)
            
            return {
                "weights": weights_dict,
                "expected_return": float(portfolio_return),
                "volatility": float(portfolio_volatility),
                "sharpe_ratio": float(sharpe_ratio),
                "objective": objective,
                "target_return": target_return if objective == "target_return" else None
            }
        else:
            return {"error": f"Markowitz optimization failed to converge for objective: {objective}"}
            
    except Exception as e:
        return {"error": f"Error in Markowitz optimization: {str(e)}"}


def optimize_hybrid(rp_weights, mv_weights, mean_returns, cov_matrix, risk_free_rate):
    """
    Optimización híbrida combinando Risk Parity y Markowitz.
    """
    try:
        import numpy as np
        
        if not rp_weights or not mv_weights:
            return {"error": "Se requieren tanto Risk Parity como Markowitz para optimización híbrida"}
        
        # Combinar pesos (50% cada método)
        hybrid_weights = {}
        
        for symbol in rp_weights.keys():
            if symbol in mv_weights:
                hybrid_weights[symbol] = (rp_weights[symbol] + mv_weights[symbol]) / 2
        
        if not hybrid_weights:
            return {"error": "No hay símbolos comunes entre Risk Parity y Markowitz"}
        
        # Normalizar pesos para que sumen 1
        total_weight = sum(hybrid_weights.values())
        hybrid_weights = {symbol: weight / total_weight for symbol, weight in hybrid_weights.items()}
        
        # Calcular métricas
        weights_array = np.array([hybrid_weights[symbol] for symbol in mean_returns.index])
        portfolio_return = np.sum(mean_returns * weights_array)
        portfolio_volatility = np.sqrt(np.dot(weights_array.T, np.dot(cov_matrix, weights_array)))
        sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
        
        return {
            "weights": hybrid_weights,
            "expected_return": float(portfolio_return),
            "volatility": float(portfolio_volatility),
            "sharpe_ratio": float(sharpe_ratio),
            "methodology": "Promedio ponderado 50/50 de Risk Parity y Markowitz"
        }
        
    except Exception as e:
        return {"error": f"Error in Hybrid optimization: {str(e)}"}


def optimize_black_litterman(mean_returns, cov_matrix, symbols, risk_free_rate):
    """
    Optimización Black-Litterman (versión simplificada).
    """
    try:
        import numpy as np
        from scipy.optimize import minimize
        
        n_assets = len(symbols)
        
        # Parámetros Black-Litterman
        tau = 0.025  # Factor de incertidumbre
        
        # Pesos de mercado (igual peso como aproximación)
        market_weights = np.array([1.0 / n_assets] * n_assets)
        
        # Retornos implícitos del mercado
        risk_aversion = 3.0  # Aversión al riesgo típica
        implied_returns = risk_aversion * np.dot(cov_matrix, market_weights)
        
        # Matrix de incertidumbre de los retornos implícitos
        tau_cov = tau * cov_matrix
        
        # Sin vistas específicas, usar retornos implícitos como estimación
        # En una implementación completa, aquí se incorporarían las vistas del inversor
        
        # Nuevos retornos esperados (Black-Litterman)
        bl_returns = implied_returns  # Simplificado sin vistas
        
        # Nueva matriz de covarianza
        bl_cov = cov_matrix + tau_cov
        
        # Optimización con nuevos parámetros
        def objective_function(weights):
            weights = np.array(weights)
            portfolio_variance = np.dot(weights.T, np.dot(bl_cov, weights))
            portfolio_return = np.sum(bl_returns * weights)
            return portfolio_variance - risk_aversion * portfolio_return
        
        # Restricciones
        constraints = {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
        bounds = tuple((0.01, 0.8) for _ in range(n_assets))
        
        # Inicialización con pesos de mercado
        x0 = market_weights
        
        # Optimización
        result_opt = minimize(
            objective_function,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 1000}
        )
        
        if result_opt.success:
            weights = result_opt.x
            weights_dict = {symbol: float(weight) for symbol, weight in zip(symbols, weights)}
            
            # Calcular métricas con retornos originales para comparación
            portfolio_return = np.sum(mean_returns * weights)
            portfolio_volatility = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
            sharpe_ratio = (portfolio_return - risk_free_rate) / portfolio_volatility if portfolio_volatility > 0 else 0
            
            return {
                "weights": weights_dict,
                "expected_return": float(portfolio_return),
                "volatility": float(portfolio_volatility),
                "sharpe_ratio": float(sharpe_ratio),
                "tau": tau,
                "risk_aversion": risk_aversion,
                "confidence": 0.75  # Confianza media sin vistas específicas
            }
        else:
            return {"error": "Black-Litterman optimization failed to converge"}
            
    except Exception as e:
        return {"error": f"Error in Black-Litterman optimization: {str(e)}"}


def determine_optimal_selection(optimization_results, objective):
    """
    Determina la selección óptima entre los métodos de optimización.
    """
    try:
        methods = ['risk_parity', 'markowitz', 'hybrid', 'black_litterman']
        scores = {}
        
        for method in methods:
            if method in optimization_results and "error" not in optimization_results[method]:
                data = optimization_results[method]
                
                # Sistema de puntuación basado en múltiples criterios
                sharpe_score = (data.get("sharpe_ratio", 0) * 25)  # 25 puntos max
                return_score = (data.get("expected_return", 0) * 100)  # Retorno en %
                volatility_score = max(0, 25 - (data.get("volatility", 1) * 100))  # Penalizar alta volatilidad
                
                # Bonificaciones por método
                method_bonus = {
                    'risk_parity': 5,    # Bonus por diversificación
                    'markowitz': 8,      # Bonus por optimización matemática
                    'hybrid': 10,        # Bonus por combinar enfoques
                    'black_litterman': 7 # Bonus por sofisticación
                }.get(method, 0)
                
                total_score = sharpe_score + return_score + volatility_score + method_bonus
                scores[method] = {
                    "score": total_score,
                    "data": data
                }
        
        if not scores:
            return {"error": "No hay métodos válidos para selección óptima"}
        
        # Seleccionar el mejor método
        best_method = max(scores.keys(), key=lambda x: scores[x]["score"])
        best_data = scores[best_method]["data"]
        
        # Generar comparación
        method_comparison = []
        for method, score_data in scores.items():
            method_comparison.append({
                "name": method.replace('_', ' ').title(),
                "score": score_data["score"]
            })
        
        method_comparison.sort(key=lambda x: x["score"], reverse=True)
        
        return {
            "best_method": best_method.replace('_', ' ').title(),
            "optimal_weights": best_data["weights"],
            "expected_return": best_data["expected_return"],
            "volatility": best_data["volatility"],
            "total_score": scores[best_method]["score"],
            "reason": f"Mejor puntuación total ({scores[best_method]['score']:.2f}) basada en Sharpe ratio, retorno esperado, volatilidad y características del método",
            "method_comparison": method_comparison
        }
        
    except Exception as e:
        return {"error": f"Error determining optimal selection: {str(e)}"}


def generate_optimization_recommendations(optimization_results, request):
    """
    Genera recomendaciones basadas en los resultados de optimización.
    """
    try:
        suggestions = []
        
        # Analizar resultados
        valid_methods = [method for method in ['risk_parity', 'markowitz', 'hybrid', 'black_litterman'] 
                        if method in optimization_results and "error" not in optimization_results[method]]
        
        if len(valid_methods) < 2:
            suggestions.append({
                "type": "warning",
                "title": "Métodos Limitados",
                "message": "Solo se pudieron calcular algunos métodos de optimización. Considera revisar los datos de entrada."
            })
        
        # Analizar volatilidades
        volatilities = [optimization_results[method]["volatility"] for method in valid_methods 
                       if "volatility" in optimization_results[method]]
        
        if volatilities:
            avg_volatility = sum(volatilities) / len(volatilities)
            if avg_volatility > 0.25:  # 25% anual
                suggestions.append({
                    "type": "warning",
                    "title": "Alta Volatilidad",
                    "message": f"El portafolio muestra alta volatilidad promedio ({avg_volatility*100:.1f}%). Considera añadir activos menos correlacionados."
                })
            elif avg_volatility < 0.10:  # 10% anual
                suggestions.append({
                    "type": "success",
                    "title": "Baja Volatilidad",
                    "message": f"Excelente control de riesgo con volatilidad promedio de {avg_volatility*100:.1f}%."
                })
        
        # Analizar Sharpe ratios
        sharpe_ratios = [optimization_results[method]["sharpe_ratio"] for method in valid_methods 
                        if "sharpe_ratio" in optimization_results[method]]
        
        if sharpe_ratios:
            best_sharpe = max(sharpe_ratios)
            if best_sharpe > 1.5:
                suggestions.append({
                    "type": "success",
                    "title": "Excelente Ratio Sharpe",
                    "message": f"El mejor método alcanza un Sharpe de {best_sharpe:.2f}, indicando excelente retorno ajustado por riesgo."
                })
            elif best_sharpe < 0.5:
                suggestions.append({
                    "type": "info",
                    "title": "Ratio Sharpe Bajo",
                    "message": f"El mejor Sharpe es {best_sharpe:.2f}. Considera revisar la selección de activos o el período de análisis."
                })
        
        # Recomendaciones específicas por número de activos
        n_assets = len(request.assets)
        if n_assets < 5:
            suggestions.append({
                "type": "info",
                "title": "Diversificación Limitada",
                "message": f"Con {n_assets} activos, considera añadir más para mejorar la diversificación."
            })
        elif n_assets > 15:
            suggestions.append({
                "type": "info",
                "title": "Portafolio Complejo",
                "message": f"Con {n_assets} activos, el portafolio puede ser complejo de gestionar. Considera consolidar posiciones similares."
            })
        
        # Evaluación de riesgo general
        if volatilities:
            risk_level = "ALTO" if avg_volatility > 0.20 else "MEDIO" if avg_volatility > 0.12 else "BAJO"
            risk_description = {
                "ALTO": "Portafolio con alto potencial de retorno pero también alto riesgo. Apropiado para inversores con alta tolerancia al riesgo.",
                "MEDIO": "Portafolio balanceado con riesgo moderado. Apropiado para la mayoría de inversores.",
                "BAJO": "Portafolio conservador con bajo riesgo. Apropiado para inversores con baja tolerancia al riesgo."
            }[risk_level]
        else:
            risk_level = "MEDIO"
            risk_description = "No se pudo determinar el nivel de riesgo con precisión."
        
        return {
            "suggestions": suggestions,
            "rebalancing_advice": "Revisa y rebalancea el portafolio cada 3-6 meses o cuando las desviaciones superen el 5% de los pesos objetivo.",
            "risk_assessment": {
                "level": risk_level,
                "description": risk_description
            }
        }
        
    except Exception as e:
        return {"error": f"Error generating recommendations: {str(e)}"}
