# OPCIÓN C: UNIVERSOS PRE-DEFINIDOS (Simple)
# Sistema simple pero efectivo basado en universos temáticos pre-curados

import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

print("🌟 UNIVERSOS PRE-DEFINIDOS - Simplicidad y Efectividad")
print("=" * 80)

class UniversosPredefinidos:
    def __init__(self):
        """
        Sistema de selección basado en universos temáticos pre-curados.
        """
        self.universos = self._crear_universos_predefinidos()
        
    def _crear_universos_predefinidos(self):
        """
        Crea universos temáticos basados en ETFs exitosos y análisis de mercado.
        """
        universos = {
            # UNIVERSOS CONSERVADORES
            'dividend_kings': {
                'descripcion': 'Dividend Kings - 50+ años de dividendos consecutivos',
                'simbolos': ['KO', 'PG', 'JNJ', 'MMM', 'CAT', 'CVX', 'XOM', 'WMT', 'MCD', 'IBM'],
                'perfil': 'conservador',
                'objetivo': 'Ingresos estables y crecimiento de dividendos',
                'riesgo': 'Bajo',
                'sector_principal': 'Consumer Staples, Utilities'
            },
            
            'utilities_reits': {
                'descripcion': 'Utilities & REITs - Ingresos predecibles',
                'simbolos': ['NEE', 'DUK', 'SO', 'D', 'EXC', 'O', 'SPG', 'PLD', 'CCI', 'AMT'],
                'perfil': 'conservador',
                'objetivo': 'Ingresos altos y estables',
                'riesgo': 'Bajo',
                'sector_principal': 'Utilities, Real Estate'
            },
            
            'defensive_stocks': {
                'descripcion': 'Acciones Defensivas - Resistentes a recesiones',
                'simbolos': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'JNJ', 'UNH', 'MRK', 'PFE', 'CL'],
                'perfil': 'conservador',
                'objetivo': 'Preservación de capital en mercados bajistas',
                'riesgo': 'Bajo',
                'sector_principal': 'Consumer Staples, Healthcare'
            },
            
            # UNIVERSOS MODERADOS
            'sp500_core': {
                'descripcion': 'S&P 500 Core Holdings - Lo mejor del mercado estadounidense',
                'simbolos': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK-B', 'UNH', 'JPM',
                           'JNJ', 'V', 'PG', 'HD', 'MA'],
                'perfil': 'moderado',
                'objetivo': 'Crecimiento consistente a largo plazo',
                'riesgo': 'Medio',
                'sector_principal': 'Technology, Healthcare, Finance'
            },
            
            'quality_growth': {
                'descripcion': 'Quality Growth - Empresas con crecimiento sostenible',
                'simbolos': ['MSFT', 'AAPL', 'GOOGL', 'UNH', 'V', 'MA', 'COST', 'HD', 'LOW', 'INTU',
                           'ADBE', 'CRM', 'NOW', 'TMO', 'DHR'],
                'perfil': 'moderado',
                'objetivo': 'Crecimiento de calidad con riesgo controlado',
                'riesgo': 'Medio',
                'sector_principal': 'Technology, Healthcare, Consumer'
            },
            
            'international_developed': {
                'descripcion': 'Mercados Desarrollados Internacionales',
                'simbolos': ['ASML', 'TSM', 'NVO', 'SAP', 'TM', 'NESN', 'RHHBY', 'UL', 'SONY', 'NVS'],
                'perfil': 'moderado',
                'objetivo': 'Diversificación geográfica',
                'riesgo': 'Medio',
                'sector_principal': 'Technology, Healthcare, Consumer'
            },
            
            # UNIVERSOS AGRESIVOS
            'high_growth_tech': {
                'descripcion': 'High Growth Technology - El futuro digital',
                'simbolos': ['NVDA', 'AMD', 'PLTR', 'SNOW', 'NET', 'DDOG', 'CRWD', 'ZS', 'MDB', 'OKTA',
                           'FSLY', 'ESTC', 'SPLK', 'PANW', 'FTNT'],
                'perfil': 'agresivo',
                'objetivo': 'Crecimiento exponencial en tecnología',
                'riesgo': 'Alto',
                'sector_principal': 'Technology - Software, Cybersecurity, AI'
            },
            
            'disruptive_innovation': {
                'descripcion': 'Innovación Disruptiva - Tecnologías revolucionarias',
                'simbolos': ['TSLA', 'MRNA', 'NVDA', 'SQ', 'SHOP', 'ROKU', 'ZOOM', 'PTON', 'TDOC', 'ZM',
                           'DOCU', 'TWLO', 'PINS', 'UBER', 'LYFT'],
                'perfil': 'agresivo',
                'objetivo': 'Capturar disrupciones tecnológicas',
                'riesgo': 'Alto',
                'sector_principal': 'Technology, Healthcare, Transportation'
            },
            
            'emerging_themes': {
                'descripcion': 'Temas Emergentes - Megatendencias del futuro',
                'simbolos': ['ENPH', 'SEDG', 'BE', 'PLUG', 'FSLR', 'SPWR', 'ICLN', 'LIT', 'ARKG', 'ARKK',
                           'CRISPR', 'EDIT', 'NTLA', 'BEAM', 'PACB'],
                'perfil': 'agresivo',
                'objetivo': 'Exposición a megatendencias',
                'riesgo': 'Muy Alto',
                'sector_principal': 'Clean Energy, Genomics, Space'
            },
            
            # UNIVERSOS SECTORIALES
            'faang_plus': {
                'descripcion': 'FAANG+ - Gigantes tecnológicos dominantes',
                'simbolos': ['AAPL', 'AMZN', 'GOOGL', 'META', 'NFLX', 'MSFT', 'TSLA', 'NVDA'],
                'perfil': 'moderado',
                'objetivo': 'Liderazgo tecnológico establecido',
                'riesgo': 'Medio-Alto',
                'sector_principal': 'Technology - Large Cap'
            },
            
            'healthcare_innovation': {
                'descripcion': 'Innovación en Salud - Biotecnología y dispositivos',
                'simbolos': ['JNJ', 'UNH', 'PFE', 'MRNA', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY', 'LLY',
                           'GILD', 'AMGN', 'MDT', 'SYK', 'ZTS'],
                'perfil': 'moderado',
                'objetivo': 'Innovación en salud y envejecimiento poblacional',
                'riesgo': 'Medio',
                'sector_principal': 'Healthcare, Biotechnology'
            },
            
            'financial_leaders': {
                'descripcion': 'Líderes Financieros - Bancos y servicios financieros',
                'simbolos': ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'COF',
                           'BLK', 'SCHW', 'CME', 'ICE', 'SPGI'],
                'perfil': 'moderado',
                'objetivo': 'Beneficiarse del crecimiento económico',
                'riesgo': 'Medio',
                'sector_principal': 'Financial Services'
            },
            
            'consumer_champions': {
                'descripcion': 'Campeones del Consumidor - Marcas icónicas',
                'simbolos': ['AMZN', 'WMT', 'HD', 'COST', 'LOW', 'TGT', 'SBUX', 'MCD', 'NKE', 'DIS',
                           'TSLA', 'F', 'GM', 'CCL', 'RCL'],
                'perfil': 'moderado',
                'objetivo': 'Poder del consumidor estadounidense',
                'riesgo': 'Medio',
                'sector_principal': 'Consumer Discretionary'
            }
        }
        
        return universos
    
    def mostrar_universos_disponibles(self):
        """
        Muestra todos los universos disponibles organizados por perfil.
        """
        print("🌟 UNIVERSOS DISPONIBLES")
        print("=" * 80)
        
        perfiles = {'conservador': '🛡️', 'moderado': '⚖️', 'agresivo': '🚀'}
        
        for perfil, emoji in perfiles.items():
            print(f"\n{emoji} PERFIL {perfil.upper()}")
            print("-" * 60)
            
            universos_perfil = {k: v for k, v in self.universos.items() if v['perfil'] == perfil}
            
            for nombre, universo in universos_perfil.items():
                print(f"🎯 {nombre.upper()}")
                print(f"   📋 {universo['descripcion']}")
                print(f"   📊 {len(universo['simbolos'])} acciones")
                print(f"   🏭 {universo['sector_principal']}")
                print(f"   🎲 Riesgo: {universo['riesgo']}")
                print(f"   📈 Objetivo: {universo['objetivo']}")
                print(f"   💼 Muestra: {', '.join(universo['simbolos'][:5])}")
                print()
    
    def obtener_universo(self, nombre_universo):
        """
        Obtiene un universo específico por nombre.
        """
        if nombre_universo not in self.universos:
            print(f"❌ Universo '{nombre_universo}' no encontrado")
            print(f"📋 Disponibles: {list(self.universos.keys())}")
            return None
        
        universo = self.universos[nombre_universo]
        print(f"🎯 UNIVERSO SELECCIONADO: {nombre_universo.upper()}")
        print(f"📋 {universo['descripcion']}")
        print(f"📊 {len(universo['simbolos'])} acciones")
        print(f"🎲 Perfil de riesgo: {universo['riesgo']}")
        
        return universo
    
    def analizar_universo(self, nombre_universo, incluir_metricas=True):
        """
        Analiza un universo específico con métricas básicas.
        """
        universo = self.obtener_universo(nombre_universo)
        if not universo:
            return None
        
        simbolos = universo['simbolos']
        
        if not incluir_metricas:
            return {'universo': universo, 'simbolos': simbolos, 'analisis': None}
        
        print(f"\n📊 ANALIZANDO UNIVERSO: {nombre_universo.upper()}")
        print("-" * 50)
        
        analisis_acciones = []
        
        for simbolo in simbolos:
            try:
                ticker = yf.Ticker(simbolo)
                info = ticker.info
                hist = ticker.history(period="1y")
                
                if len(hist) < 50:
                    print(f"⚠️  {simbolo}: Datos insuficientes")
                    continue
                
                # Métricas básicas
                precio_actual = hist['Close'].iloc[-1]
                precio_1y = hist['Close'].iloc[0]
                rendimiento_1y = ((precio_actual / precio_1y) - 1) * 100
                
                market_cap = info.get('marketCap', 0)
                dividend_yield = info.get('dividendYield', 0) * 100 if info.get('dividendYield') else 0
                pe_ratio = info.get('trailingPE', 0)
                
                # Volatilidad
                retornos = hist['Close'].pct_change().dropna()
                volatilidad = retornos.std() * np.sqrt(252) * 100
                
                analisis = {
                    'simbolo': simbolo,
                    'precio_actual': precio_actual,
                    'rendimiento_1y': rendimiento_1y,
                    'market_cap': market_cap,
                    'dividend_yield': dividend_yield,
                    'pe_ratio': pe_ratio,
                    'volatilidad': volatilidad,
                    'sector': info.get('sector', 'Unknown')
                }
                
                analisis_acciones.append(analisis)
                print(f"✅ {simbolo}: ${precio_actual:.2f} | {rendimiento_1y:+.1f}% | Vol {volatilidad:.0f}%")
                
            except Exception as e:
                print(f"❌ {simbolo}: Error - {str(e)[:50]}")
                continue
        
        # Estadísticas del universo
        if analisis_acciones:
            rendimientos = [a['rendimiento_1y'] for a in analisis_acciones]
            volatilidades = [a['volatilidad'] for a in analisis_acciones if a['volatilidad'] > 0]
            dividendos = [a['dividend_yield'] for a in analisis_acciones if a['dividend_yield'] > 0]
            
            print(f"\n📈 ESTADÍSTICAS DEL UNIVERSO:")
            print(f"• Acciones analizadas: {len(analisis_acciones)}")
            print(f"• Rendimiento promedio 1Y: {np.mean(rendimientos):+.1f}%")
            print(f"• Volatilidad promedio: {np.mean(volatilidades):.1f}%")
            if dividendos:
                print(f"• Dividend yield promedio: {np.mean(dividendos):.1f}%")
            print(f"• Mejor performer: {max(analisis_acciones, key=lambda x: x['rendimiento_1y'])['simbolo']}")
            print(f"• Menor volatilidad: {min(analisis_acciones, key=lambda x: x['volatilidad'])['simbolo']}")
        
        return {
            'universo': universo,
            'simbolos': simbolos,
            'analisis': analisis_acciones
        }
    
    def combinar_universos(self, nombres_universos, pesos=None, max_acciones=20):
        """
        Combina múltiples universos con pesos específicos.
        """
        print(f"🔀 COMBINANDO {len(nombres_universos)} UNIVERSOS")
        print("-" * 50)
        
        if pesos is None:
            pesos = [1/len(nombres_universos)] * len(nombres_universos)
        
        if len(pesos) != len(nombres_universos):
            print("❌ Error: Número de pesos debe coincidir con número de universos")
            return None
        
        simbolos_combinados = {}
        peso_total = 0
        
        for i, nombre in enumerate(nombres_universos):
            universo = self.obtener_universo(nombre)
            if not universo:
                continue
            
            peso = pesos[i]
            acciones_del_universo = int(max_acciones * peso)
            
            print(f"🎯 {nombre}: {peso*100:.0f}% peso → {acciones_del_universo} acciones")
            
            # Tomar las primeras N acciones de cada universo
            for simbolo in universo['simbolos'][:acciones_del_universo]:
                if simbolo not in simbolos_combinados:
                    simbolos_combinados[simbolo] = {
                        'universos': [nombre],
                        'peso_total': peso
                    }
                else:
                    simbolos_combinados[simbolo]['universos'].append(nombre)
                    simbolos_combinados[simbolo]['peso_total'] += peso
        
        # Ordenar por peso total (acciones que aparecen en múltiples universos)
        simbolos_ordenados = sorted(simbolos_combinados.items(), 
                                  key=lambda x: x[1]['peso_total'], reverse=True)
        
        # Tomar top acciones hasta el límite
        seleccion_final = simbolos_ordenados[:max_acciones]
        simbolos_finales = [item[0] for item in seleccion_final]
        
        print(f"\n✅ COMBINACIÓN COMPLETADA:")
        print(f"📊 Acciones únicas combinadas: {len(simbolos_combinados)}")
        print(f"🎯 Selección final: {len(simbolos_finales)} acciones")
        
        print(f"\n🏆 TOP SELECCIONADOS:")
        for simbolo, data in seleccion_final[:10]:
            universos_str = ', '.join(data['universos'])
            print(f"• {simbolo}: {universos_str} (peso {data['peso_total']:.1f})")
        
        return simbolos_finales, simbolos_combinados
    
    def crear_portafolio_tematico(self, tema, incluir_analisis=True):
        """
        Crea portafolios temáticos predefinidos populares.
        """
        portafolios_tematicos = {
            'tech_giants': {
                'universos': ['faang_plus', 'high_growth_tech'],
                'pesos': [0.7, 0.3],
                'descripcion': 'Gigantes tecnológicos + innovación'
            },
            'dividend_income': {
                'universos': ['dividend_kings', 'utilities_reits'],
                'pesos': [0.6, 0.4],
                'descripcion': 'Ingresos por dividendos estables'
            },
            'balanced_growth': {
                'universos': ['sp500_core', 'quality_growth', 'international_developed'],
                'pesos': [0.5, 0.3, 0.2],
                'descripcion': 'Crecimiento balanceado y diversificado'
            },
            'aggressive_growth': {
                'universos': ['high_growth_tech', 'disruptive_innovation', 'emerging_themes'],
                'pesos': [0.4, 0.4, 0.2],
                'descripcion': 'Máximo crecimiento, alto riesgo'
            },
            'defensive_income': {
                'universos': ['defensive_stocks', 'utilities_reits', 'dividend_kings'],
                'pesos': [0.4, 0.3, 0.3],
                'descripcion': 'Defensivo con ingresos predecibles'
            },
            'sector_rotation': {
                'universos': ['financial_leaders', 'healthcare_innovation', 'consumer_champions'],
                'pesos': [0.35, 0.35, 0.3],
                'descripcion': 'Rotación sectorial balanceada'
            }
        }
        
        if tema not in portafolios_tematicos:
            print(f"❌ Tema '{tema}' no disponible")
            print(f"📋 Temas disponibles: {list(portafolios_tematicos.keys())}")
            return None
        
        config = portafolios_tematicos[tema]
        print(f"🎨 CREANDO PORTAFOLIO TEMÁTICO: {tema.upper()}")
        print(f"📋 {config['descripcion']}")
        
        simbolos, detalle = self.combinar_universos(
            config['universos'], 
            config['pesos'], 
            max_acciones=20
        )
        
        if incluir_analisis and simbolos:
            print(f"\n📊 Analizando portafolio temático...")
            # Análisis rápido del portafolio combinado
            try:
                analisis_conjunto = []
                for simbolo in simbolos[:15]:  # Analizar top 15
                    ticker = yf.Ticker(simbolo)
                    hist = ticker.history(period="6mo")
                    if len(hist) > 50:
                        rendimiento = ((hist['Close'].iloc[-1] / hist['Close'].iloc[0]) - 1) * 100
                        analisis_conjunto.append(rendimiento)
                
                if analisis_conjunto:
                    print(f"📈 Rendimiento promedio 6M: {np.mean(analisis_conjunto):+.1f}%")
                    print(f"📊 Mejor performer 6M: {max(analisis_conjunto):+.1f}%")
                    print(f"📉 Peor performer 6M: {min(analisis_conjunto):+.1f}%")
            except:
                print("⚠️  No se pudo completar análisis de rendimiento")
        
        return {
            'tema': tema,
            'descripcion': config['descripcion'],
            'simbolos': simbolos,
            'universos_utilizados': config['universos'],
            'pesos': config['pesos'],
            'detalle_seleccion': detalle
        }
    
    def recomendar_por_perfil(self, perfil_riesgo, objetivo_inversion=None):
        """
        Recomienda universos apropiados según perfil de riesgo y objetivo.
        """
        print(f"🎯 RECOMENDACIONES PARA PERFIL: {perfil_riesgo.upper()}")
        print("-" * 50)
        
        recomendaciones = {
            'conservador': {
                'principales': ['dividend_kings', 'utilities_reits', 'defensive_stocks'],
                'secundarios': ['sp500_core'],
                'tematicos': ['dividend_income', 'defensive_income']
            },
            'moderado': {
                'principales': ['sp500_core', 'quality_growth', 'faang_plus'],
                'secundarios': ['healthcare_innovation', 'financial_leaders'],
                'tematicos': ['balanced_growth', 'sector_rotation']
            },
            'agresivo': {
                'principales': ['high_growth_tech', 'disruptive_innovation'],
                'secundarios': ['emerging_themes', 'faang_plus'],
                'tematicos': ['tech_giants', 'aggressive_growth']
            }
        }
        
        if perfil_riesgo not in recomendaciones:
            print(f"❌ Perfil '{perfil_riesgo}' no reconocido")
            return None
        
        rec = recomendaciones[perfil_riesgo]
        
        print(f"🏆 UNIVERSOS PRINCIPALES:")
        for universo in rec['principales']:
            info = self.universos[universo]
            print(f"• {universo}: {info['descripcion']}")
        
        print(f"\n🥈 UNIVERSOS SECUNDARIOS:")
        for universo in rec['secundarios']:
            info = self.universos[universo]
            print(f"• {universo}: {info['descripcion']}")
        
        print(f"\n🎨 PORTAFOLIOS TEMÁTICOS SUGERIDOS:")
        for tematico in rec['tematicos']:
            print(f"• {tematico}: Usar crear_portafolio_tematico('{tematico}')")
        
        return rec

# Funciones de conveniencia
def obtener_universo_simple(nombre):
    """Función simple para obtener un universo."""
    up = UniversosPredefinidos()
    resultado = up.analizar_universo(nombre, incluir_metricas=False)
    return resultado['simbolos'] if resultado else None

def crear_portafolio_rapido(perfil):
    """Crea un portafolio rápido según perfil."""
    up = UniversosPredefinidos()
    
    portafolios_rapidos = {
        'conservador': 'dividend_income',
        'moderado': 'balanced_growth', 
        'agresivo': 'tech_giants'
    }
    
    tema = portafolios_rapidos.get(perfil, 'balanced_growth')
    resultado = up.crear_portafolio_tematico(tema, incluir_analisis=False)
    return resultado['simbolos'] if resultado else None

# Función para integrar con optimización existente
def pipeline_universos_predefinidos(perfil='moderado', tema=None, capital=50000):
    """
    Pipeline completo usando universos predefinidos + optimización.
    """
    print("🌟 PIPELINE: UNIVERSOS PREDEFINIDOS + OPTIMIZACIÓN")
    print("=" * 80)
    
    up = UniversosPredefinidos()
    
    if tema:
        # Usar tema específico
        resultado = up.crear_portafolio_tematico(tema)
        simbolos = resultado['simbolos'] if resultado else None
    else:
        # Usar recomendación por perfil
        simbolos = crear_portafolio_rapido(perfil)
    
    if simbolos:
        print(f"\n🔗 Conectando con optimización de portafolio...")
        print(f"📋 Símbolos seleccionados: {simbolos}")
        
        # Aquí conectaría con tu sistema de optimización:
        # resultado_optimizacion = optimizacion_portafolio_completa(simbolos, capital=capital)
    
    return simbolos

# Ejemplo de uso
if __name__ == "__main__":
    print("🌟 DEMO: Universos Predefinidos")
    print("=" * 50)
    
    # Crear instancia
    up = UniversosPredefinidos()
    
    # Mostrar todos los universos
    up.mostrar_universos_disponibles()
    
    # Ejemplo: Analizar universo tech
    print(f"\n" + "="*60)
    resultado_tech = up.analizar_universo('high_growth_tech')
    
    # Ejemplo: Crear portafolio temático
    print(f"\n" + "="*60)
    portafolio = up.crear_portafolio_tematico('balanced_growth')
    
    if portafolio:
        print(f"\n💎 PORTAFOLIO CREADO:")
        print(f"📋 Símbolos: {portafolio['simbolos']}")
        print(f"🚀 Listo para optimización!")