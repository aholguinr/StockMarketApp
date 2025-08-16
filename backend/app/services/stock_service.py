from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
from typing import Optional, Union


def extraer_datos_accion(
    nombre_accion: str, 
    fecha_final: str | None = None, 
    dias_pasado: int = 30,
    periodo: str | None = None,
    intervalo: str = "1d"
) -> str:
    """
    Extrae datos históricos de una acción con soporte para intervalos flexibles.

    Parámetros:
    - nombre_accion (str): Ticker de la acción (ej: 'AAPL', 'GOOGL')
    - fecha_final (str | None): Fecha final en formato 'YYYY-MM-DD'. Si es None, se toma la fecha actual.
    - dias_pasado (int): Cantidad de días hacia atrás desde la fecha final (solo si periodo es None)
    - periodo (str | None): Período predefinido de yfinance ("1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max")
    - intervalo (str): Intervalo de tiempo ("1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo")

    Retorna:
    - str: Ruta o nombre del archivo CSV creado
    """

    # Validar intervalo
    intervalos_validos = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]
    if intervalo not in intervalos_validos:
        raise ValueError(f"Intervalo '{intervalo}' no válido. Válidos: {intervalos_validos}")

    # Validar período si se proporciona
    periodos_validos = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
    if periodo and periodo not in periodos_validos:
        raise ValueError(f"Período '{periodo}' no válido. Válidos: {periodos_validos}")

    # Validar limitaciones de Yahoo Finance para intervalos pequeños
    if intervalo in ["1m", "2m", "5m", "15m", "30m", "60m", "90m"]:
        if periodo and periodo not in ["1d", "5d"]:
            # Para intervalos de minutos, usar período máximo permitido
            if dias_pasado > 7:
                dias_pasado = 7
                print(f"⚠️  Intervalo {intervalo} limitado a máximo 7 días")
    elif intervalo in ["1h"]:
        if periodo and periodo not in ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y"]:
            if dias_pasado > 730:
                dias_pasado = 730
                print(f"⚠️  Intervalo {intervalo} limitado a máximo 730 días")

    # Crear objeto ticker
    ticker = yf.Ticker(nombre_accion.upper())

    try:
        # Obtener datos usando período predefinido o fechas específicas
        if periodo:
            datos = ticker.history(period=periodo, interval=intervalo)
            timestamp_suffix = f"{periodo}_{intervalo}"
        else:
            # Usar fechas específicas
            if fecha_final is None:
                fecha_final_dt = datetime.now()
            else:
                fecha_final_dt = datetime.strptime(fecha_final, "%Y-%m-%d")

            fecha_inicio = fecha_final_dt - timedelta(days=dias_pasado)
            
            datos = ticker.history(
                start=fecha_inicio.strftime("%Y-%m-%d"),
                end=(fecha_final_dt + timedelta(days=1)).strftime("%Y-%m-%d"),
                interval=intervalo
            )
            
            fecha_inicio_str = fecha_inicio.strftime("%d%m%y")
            fecha_final_str = fecha_final_dt.strftime("%d%m%y")
            timestamp_suffix = f"{fecha_inicio_str}_{fecha_final_str}_{intervalo}"

        # Validar si no hay datos
        if datos.empty:
            raise ValueError(f"No se encontraron datos para {nombre_accion.upper()} con período '{periodo}' e intervalo '{intervalo}'")

        # Resetear índice para tener la fecha como columna normal
        datos.reset_index(inplace=True)

        # Normalizar timezone si viene en la columna 'Date' o 'Datetime'
        date_column = None
        if "Date" in datos.columns:
            date_column = "Date"
        elif "Datetime" in datos.columns:
            date_column = "Datetime"

        if date_column:
            if hasattr(datos[date_column].dtype, "tz") and datos[date_column].dt.tz is not None:
                datos[date_column] = datos[date_column].dt.tz_localize(None)

        # Preparar nombre del archivo
        nombre_archivo = f"{nombre_accion.upper()}_{timestamp_suffix}.csv"

        # Guardar resultado en CSV
        datos.to_csv(nombre_archivo, index=False)

        print(f"✅ Datos extraídos: {len(datos)} registros guardados en {nombre_archivo}")
        return nombre_archivo

    except Exception as e:
        raise ValueError(f"Error al extraer datos para {nombre_accion.upper()}: {str(e)}")


def obtener_datos_accion_json(
    nombre_accion: str,
    periodo: str = "1mo",
    intervalo: str = "1d"
) -> dict:
    """
    Extrae datos históricos de una acción y los retorna como JSON para APIs.

    Parámetros:
    - nombre_accion (str): Ticker de la acción
    - periodo (str): Período predefinido de yfinance
    - intervalo (str): Intervalo de tiempo

    Retorna:
    - dict: Datos de la acción en formato JSON
    """
    
    # Validaciones
    intervalos_validos = ["1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo"]
    if intervalo not in intervalos_validos:
        raise ValueError(f"Intervalo '{intervalo}' no válido. Válidos: {intervalos_validos}")

    periodos_validos = ["1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max"]
    if periodo not in periodos_validos:
        raise ValueError(f"Período '{periodo}' no válido. Válidos: {periodos_validos}")

    # Validar limitaciones de Yahoo Finance
    if intervalo in ["1m", "2m", "5m", "15m", "30m", "60m", "90m"] and periodo not in ["1d", "5d"]:
        raise ValueError(f"Para intervalo {intervalo}, usar período '1d' o '5d' solamente")
    
    if intervalo == "1h" and periodo in ["5y", "10y", "max"]:
        raise ValueError(f"Para intervalo {intervalo}, período {periodo} no está permitido (máximo 2y)")

    try:
        # Obtener datos
        ticker = yf.Ticker(nombre_accion.upper())
        datos = ticker.history(period=periodo, interval=intervalo)

        if datos.empty:
            raise ValueError(f"No se encontraron datos para {nombre_accion.upper()}")

        # Resetear índice
        datos.reset_index(inplace=True)

        # Normalizar timezone
        date_column = "Date" if "Date" in datos.columns else "Datetime"
        if date_column in datos.columns:
            if hasattr(datos[date_column].dtype, "tz") and datos[date_column].dt.tz is not None:
                datos[date_column] = datos[date_column].dt.tz_localize(None)
            # Convertir a string para JSON
            datos[date_column] = datos[date_column].dt.strftime("%Y-%m-%d %H:%M:%S")

        # Convertir a diccionario
        datos_dict = datos.to_dict('records')

        # Obtener información adicional del ticker
        info = ticker.info
        
        return {
            "symbol": nombre_accion.upper(),
            "period": periodo,
            "interval": intervalo,
            "data_points": len(datos_dict),
            "company_name": info.get("longName", "N/A"),
            "currency": info.get("currency", "USD"),
            "exchange": info.get("exchange", "N/A"),
            "data": datos_dict
        }

    except Exception as e:
        raise ValueError(f"Error al obtener datos para {nombre_accion.upper()}: {str(e)}")


# Función de compatibilidad con código existente
def extraer_datos_accion_legacy(nombre_accion: str, fecha_final: str | None = None, dias_pasado: int = 30) -> str:
    """
    Función de compatibilidad con el código existente.
    Mantiene la funcionalidad original mientras permite migración gradual.
    """
    return extraer_datos_accion(
        nombre_accion=nombre_accion,
        fecha_final=fecha_final,
        dias_pasado=dias_pasado,
        periodo=None,
        intervalo="1d"
    )
