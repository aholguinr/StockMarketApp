# Stock Market Analyzer - Frontend

Frontend web desarrollado con Bootstrap 5 para consumir la API de análisis de acciones.

## 🌟 Características

- **Interfaz intuitiva** con Bootstrap 5
- **Análisis en tiempo real** de acciones
- **Configuración flexible** de períodos de análisis
- **Visualización detallada** de indicadores técnicos
- **Responsive design** compatible con móviles
- **Sistema de recomendaciones** (COMPRAR/VENDER/MANTENER)

## 📋 Requisitos

- Python 3.7+ (para el servidor local)
- Backend ejecutándose en `http://localhost:8000`
- Navegador web moderno

## 🚀 Instrucciones de Uso

### Paso 1: Iniciar el Backend

Primero, asegúrate de que el backend de FastAPI esté ejecutándose:

```bash
# Desde la carpeta raíz del proyecto
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend debe estar disponible en: `http://localhost:8000`

### Paso 2: Iniciar el Frontend

#### Opción A: Usando el servidor Python incluido (Recomendado)

```bash
# Desde la carpeta frontend
cd frontend
python serve.py
```

Esto iniciará automáticamente:
- Un servidor HTTP en `http://localhost:3000`
- Abrirá el navegador automáticamente
- Mostrará mensajes informativos en la consola

#### Opción B: Usando Python directamente

```bash
# Desde la carpeta frontend
cd frontend
python -m http.server 3000
```

Luego abre manualmente: `http://localhost:3000`

#### Opción C: Abrir directamente en el navegador

Si prefieres no usar un servidor local, puedes abrir directamente el archivo `index.html` en tu navegador, pero necesitarás:

1. Deshabilitar CORS en tu navegador, o
2. Configurar el backend para permitir el origen `file://`

### Paso 3: Usar la Aplicación

1. **Símbolo de Acción**: Ingresa el ticker (ej: AAPL, TSLA, GOOGL)
2. **Tipo de Análisis**: 
   - ✅ Activado = Análisis detallado completo
   - ❌ Desactivado = Resumen ejecutivo
3. **Período**: Selecciona cantidad y unidad (meses/años)
4. **Analizar**: Haz clic en "Analizar Acción"

## 📊 Funcionalidades del Frontend

### Formulario de Análisis
- Campo para símbolo de acción (auto-uppercase)
- Toggle para análisis detallado
- Selector de período configurable
- Validación de campos

### Resultados
- **Resumen Ejecutivo**: Recomendación, precios, niveles de riesgo
- **Análisis Detallado**: Indicadores técnicos, momentum, métricas de riesgo
- **Indicadores Visuales**: Badges de colores para señales
- **Responsive**: Se adapta a pantallas móviles

### Estados de la UI
- Loading spinner durante análisis
- Manejo de errores con mensajes informativos
- Animaciones suaves para mejor UX

## 🛠️ Estructura de Archivos

```
frontend/
├── index.html              # Página principal
├── static/
│   ├── css/
│   │   └── style.css       # Estilos personalizados
│   └── js/
│       └── app.js          # Lógica de la aplicación
├── serve.py                # Servidor HTTP simple
└── README.md              # Este archivo
```

## ⚙️ Configuración

### Cambiar la URL del Backend

Si tu backend no está en `http://localhost:8000`, edita el archivo `static/js/app.js`:

```javascript
const API_BASE_URL = 'http://tu-servidor:puerto';
```

### Personalizar Estilos

Modifica `static/css/style.css` para cambiar colores, fuentes, o layout.

## 🔧 Solución de Problemas

### Error: "Error al conectar con el servidor"
- ✅ Verifica que el backend esté ejecutándose en `http://localhost:8000`
- ✅ Comprueba que no haya errores en la consola del backend
- ✅ Revisa la consola del navegador (F12) para más detalles

### Error: "Puerto ya está en uso"
- ✅ Cambia el puerto en `serve.py`: `PORT = 3001`
- ✅ O detén el proceso que usa el puerto 3000

### El frontend no carga correctamente
- ✅ Asegúrate de estar en la carpeta `frontend`
- ✅ Verifica que todos los archivos estén presentes
- ✅ Prueba abrir directamente `index.html`

### Problemas de CORS
- ✅ Usa el servidor Python (`python serve.py`)
- ✅ No abras `index.html` directamente desde el explorador de archivos

## 📱 Compatibilidad

- ✅ Chrome/Chromium 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Dispositivos móviles

## 🎨 Tecnologías Utilizadas

- **Bootstrap 5.3.0**: Framework CSS
- **Bootstrap Icons**: Iconografía
- **JavaScript ES6+**: Lógica de aplicación
- **Fetch API**: Consumo de la API REST
- **CSS3**: Animaciones y estilos personalizados

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs del backend
3. Asegúrate de que ambos servicios estén ejecutándose
4. Comprueba la conectividad de red

¡Disfruta analizando acciones! 📈