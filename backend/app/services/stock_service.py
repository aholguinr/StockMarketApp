from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd


def extraer_datos_accion(nombre_accion: str, fecha_final: str | None = None, dias_pasado: int = 30) -> str:
    """
    Extrae datos históricos de una acción y los guarda en un archivo CSV.

    Parámetros:
    - nombre_accion (str): Ticker de la acción (ej: 'AAPL', 'GOOGL')
    - fecha_final (str | None): Fecha final en formato 'YYYY-MM-DD'. Si es None, se toma la fecha actual.
    - dias_pasado (int): Cantidad de días hacia atrás desde la fecha final.

    Retorna:
    - str: Ruta o nombre del archivo CSV creado
    """

    # 1. Procesar fecha final (actual si no se envía)
    if fecha_final is None:
        fecha_final_dt = datetime.now()
    else:
        fecha_final_dt = datetime.strptime(fecha_final, "%Y-%m-%d")

    # 2. Calcular la fecha inicial restando días
    fecha_inicio = fecha_final_dt - timedelta(days=dias_pasado)

    # 3. Preparar nombre del archivo con formato ddmmyy
    fecha_inicio_str = fecha_inicio.strftime("%d%m%y")
    fecha_final_str = fecha_final_dt.strftime("%d%m%y")
    nombre_archivo = f"{nombre_accion.upper()}-{fecha_inicio_str}-{fecha_final_str}.csv"

    # 4. Descargar datos históricos desde Yahoo Finance
    ticker = yf.Ticker(nombre_accion.upper())
    datos = ticker.history(
        start=fecha_inicio.strftime("%Y-%m-%d"),
        end=(fecha_final_dt + timedelta(days=1)).strftime("%Y-%m-%d")  # +1 día para incluir fecha_final
    )

    # Validar si no hay datos
    if datos.empty:
        raise ValueError(f"No se encontraron datos para la acción {nombre_accion.upper()}")

    # 5. Resetear índice para tener la fecha como columna normal
    datos.reset_index(inplace=True)

    # 6. Normalizar timezone si viene en la columna 'Date'
    if "Date" in datos.columns:
        if hasattr(datos["Date"].dtype, "tz") and datos["Date"].dt.tz is not None:
            datos["Date"] = datos["Date"].dt.tz_localize(None)

    # 7. Guardar resultado en CSV
    datos.to_csv(nombre_archivo, index=False)

    return nombre_archivo
