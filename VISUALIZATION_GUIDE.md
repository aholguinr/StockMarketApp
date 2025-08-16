# 📊 Stock Visualization Guide

## ✅ Implementación Completada

Se ha implementado exitosamente la funcionalidad de visualización de acciones con intervalos flexibles.

## 🆕 Nuevas Funcionalidades

### 1. **Backend Actualizado**

#### Función `extraer_datos_accion` Mejorada:
```python
def extraer_datos_accion(
    nombre_accion: str, 
    fecha_final: str | None = None, 
    dias_pasado: int = 30,
    periodo: str | None = None,
    intervalo: str = "1d"
) -> str:
```

**Nuevos parámetros:**
- `periodo`: Período predefinido ("1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "ytd", "max")
- `intervalo`: Intervalo de tiempo ("1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h", "1d", "5d", "1wk", "1mo", "3mo")

#### Nueva Función `obtener_datos_accion_json`:
- Retorna datos en formato JSON para APIs
- Incluye información de la empresa
- Validaciones automáticas de restricciones de Yahoo Finance

### 2. **Nuevos Endpoints API**

#### `POST /stocks/get_stock_data`
```json
{
  "symbol": "AAPL",
  "period": "1mo", 
  "interval": "1d"
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "period": "1mo",
  "interval": "1d",
  "data_points": 22,
  "company_name": "Apple Inc.",
  "currency": "USD",
  "exchange": "NASDAQ",
  "data": [...]
}
```

#### `GET /stocks/get_available_intervals`
Retorna intervalos disponibles, períodos válidos y restricciones.

### 3. **Frontend de Visualización**

#### Nueva página: `visualization.html`
- **URL**: `http://localhost:3000/visualization.html`
- **Tecnologías**: Chart.js, Bootstrap 5, JavaScript ES6+

#### Características:
- ✅ **Selección flexible** de símbolo, período e intervalo
- ✅ **Configuraciones rápidas** (Intraday, Day Trading, Swing Trading, etc.)
- ✅ **Gráficas interactivas** con Chart.js
- ✅ **Modo Candlestick** (High/Low/Close)
- ✅ **Gráfica de volumen** opcional
- ✅ **Estadísticas automáticas** del período
- ✅ **Validación de restricciones** de Yahoo Finance
- ✅ **Responsive design** compatible con móviles

## 🎯 Intervalos y Períodos Soportados

### Intervalos Disponibles:
- **Minutos**: 1m, 2m, 5m, 15m, 30m, 60m, 90m
- **Horas**: 1h
- **Días**: 1d, 5d
- **Semanas**: 1wk
- **Meses**: 1mo, 3mo

### Períodos Disponibles:
- **Corto plazo**: 1d, 5d
- **Mediano plazo**: 1mo, 3mo, 6mo
- **Largo plazo**: 1y, 2y, 5y, 10y
- **Especiales**: ytd (año actual), max (máximo disponible)

## ⚠️ Restricciones de Yahoo Finance

### Intervalos de Minutos:
- **Limitación**: Solo períodos de 1d o 5d
- **Máximo**: 7 días de datos
- **Ejemplo válido**: 5m con 1d ✅
- **Ejemplo inválido**: 5m con 1mo ❌

### Intervalo de 1 Hora:
- **Limitación**: Máximo 2 años de datos
- **Ejemplo válido**: 1h con 1y ✅
- **Ejemplo inválido**: 1h con 5y ❌

### Intervalos Diarios o Mayores:
- **Sin restricciones** de período
- **Recomendado** para análisis de largo plazo

## 🚀 Configuraciones Rápidas

| Tipo | Intervalo | Período | Uso |
|------|-----------|---------|-----|
| **Intraday** | 1m | 1d | Trading intradía |
| **Day Trading** | 5m | 5d | Trading de día |
| **Swing Trading** | 1h | 1mo | Trading de swing |
| **Position Trading** | 1d | 1y | Trading de posición |
| **Long Term** | 1wk | 5y | Análisis largo plazo |

## 📱 Cómo Usar la Visualización

### 1. **Acceso**:
```bash
# Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend
python serve.py
```

### 2. **Navegación**:
- Página principal: `http://localhost:3000`
- Visualización: `http://localhost:3000/visualization.html`
- O clic en botón "Visualización" en la página principal

### 3. **Uso**:
1. **Símbolo**: Ingresa ticker (ej: AAPL, TSLA, GOOGL)
2. **Período**: Selecciona rango temporal
3. **Intervalo**: Elige granularidad de datos
4. **Configuración rápida**: O usa botones de preset
5. **Cargar**: Haz clic en "Cargar Datos"

### 4. **Funciones**:
- **Toggle Volumen**: Muestra/oculta gráfica de volumen
- **Toggle Candlestick**: Cambia entre línea simple y vista OHLC
- **Estadísticas**: Automáticas del período seleccionado

## 🔧 Validaciones Automáticas

El sistema valida automáticamente:
- ✅ Combinaciones válidas de período/intervalo
- ✅ Restricciones de Yahoo Finance
- ✅ Límites de datos históricos
- ✅ Formatos de entrada

## 🎨 Características Visuales

### Gráficas:
- **Línea simple**: Precio de cierre
- **Candlestick**: High, Low, Close con relleno
- **Volumen**: Barras de volumen de transacciones
- **Interactivas**: Zoom, hover, tooltip

### Estadísticas:
- Precio actual, máximo, mínimo
- Precio promedio del período
- Variación porcentual (con colores)
- Volumen promedio

### Responsive:
- ✅ Desktop optimizado
- ✅ Tablet compatible
- ✅ Mobile adaptado

## 🔗 URLs de la API

- **Análisis**: `POST /stocks/analyze_decision`
- **Datos para gráficas**: `POST /stocks/get_stock_data`
- **Intervalos disponibles**: `GET /stocks/get_available_intervals`
- **Extraer a CSV**: `POST /stocks/extraer`
- **Graficar CSV**: `POST /stocks/graficar_accion`
- **Análisis completo**: `POST /stocks/analizar_accion`

## 📊 Ejemplos de Uso

### Trading Intradía:
```
Símbolo: AAPL
Período: 1d
Intervalo: 1m
```

### Análisis Semanal:
```
Símbolo: TSLA
Período: 1mo
Intervalo: 1h
```

### Inversión a Largo Plazo:
```
Símbolo: GOOGL
Período: 5y
Intervalo: 1wk
```

## 🛠️ Tecnologías Utilizadas

### Backend:
- **FastAPI**: Framework web
- **yfinance**: Datos de Yahoo Finance
- **pandas**: Manipulación de datos
- **CORS**: Middleware para frontend

### Frontend:
- **Chart.js 4.4.0**: Gráficas interactivas
- **Bootstrap 5.3.0**: UI Framework
- **JavaScript ES6+**: Lógica de aplicación
- **HTML5/CSS3**: Estructura y estilos

## ✅ Todo Implementado

La funcionalidad está 100% completa y lista para usar. El sistema ahora permite:

1. ✅ **Función actualizada** con soporte completo de intervalos
2. ✅ **API validada** con nuevos endpoints
3. ✅ **Frontend funcional** con visualización avanzada
4. ✅ **Integración completa** entre backend y frontend
5. ✅ **Validaciones automáticas** de restricciones
6. ✅ **Documentación completa** de uso

¡Disfruta visualizando el mercado de valores! 📈📊