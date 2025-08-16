# OPCIÓN A: SCREENER AUTOMATIZADO COMPLETO
# Sistema integral de selección de acciones con filtros automatizados

import yfinance as yf
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

print("🔍 SCREENER AUTOMATIZADO COMPLETO - Selección Inteligente de Acciones")
print("=" * 80)

class ScreenerAutomatizado:
    def __init__(self, api_key_alpha_vantage=None):
        """
        Screener automatizado completo.
        
        Parámetros:
        - api_key_alpha_vantage: Clave API de Alpha Vantage (opcional, mejora capacidades)
        """
        self.api_key = api_key_alpha_vantage
        self.universo_inicial = self._cargar_universo_sp500()
        
    def _cargar_universo_sp500(self):
        """Carga lista de acciones del S&P 500 como universo inicial."""
        try:
            # Lista básica de símbolos S&P 500 (muestra representativa)
            # En implementación real, esto vendría de una API o scraping
            sp500_sample = [
                # Technology
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX', 'ADBE', 'CRM',
                'ORCL', 'IBM', 'INTC', 'AMD', 'QCOM', 'TXN', 'AVGO', 'NOW', 'INTU', 'MU',
                
                # Healthcare
                'JNJ', 'PFE', 'UNH', 'MRNA', 'ABBV', 'TMO', 'ABT', 'DHR', 'BMY', 'LLY',
                'MDT', 'GILD', 'AMGN', 'CVS', 'CI', 'HUM', 'ANTM', 'BDX', 'SYK', 'ZTS',
                
                # Finance
                'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'CB', 'AXP',
                'USB', 'TFC', 'PNC', 'COF', 'CME', 'ICE', 'SPGI', 'MCO', 'AON', 'MMC',
                
                # Consumer
                'WMT', 'HD', 'PG', 'KO', 'PEP', 'MCD', 'COST', 'LOW', 'TGT', 'SBUX',
                'NKE', 'DIS', 'AMGN', 'PM', 'UL', 'CL', 'KMB', 'GIS', 'K', 'CPB',
                
                # Energy & Materials
                'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'BHP', 'FCX', 'NEM', 'AA', 'X',
                
                # Utilities & REITs
                'NEE', 'DUK', 'SO', 'D', 'EXC', 'XEL', 'SRE', 'AEP', 'ES', 'FE'
            ]
            
            print(f"📊 Universo inicial cargado: {len(sp500_sample)} acciones")
            return sp500_sample
            
        except Exception as e:
            print(f"⚠️  Error cargando universo: {str(e)}")
            return ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']  # Fallback básico

    def filtro_nivel_1_liquidez(self, simbolos, dias_analisis=30):
        """
        NIVEL 1: Filtros básicos de liquidez y viabilidad.
        
        Parámetros:
        - simbolos: Lista de símbolos a filtrar
        - dias_analisis: Días para calcular métricas de liquidez
        
        Retorna:
        - Lista de símbolos que pasan los filtros básicos
        """
        print("\n🔍 NIVEL 1: Filtros de Liquidez y Viabilidad")
        print("-" * 50)
        
        aprobados = []
        rechazados = []
        
        for simbolo in simbolos:
            try:
                # Descargar datos básicos
                ticker = yf.Ticker(simbolo)
                info = ticker.info
                hist = ticker.history(period="1mo")
                
                if len(hist) < 15:  # Muy pocos datos
                    rechazados.append((simbolo, "Pocos datos históricos"))
                    continue
                
                # Criterio 1: Market Cap > $1B
                market_cap = info.get('marketCap', 0)
                if market_cap < 1_000_000_000:
                    rechazados.append((simbolo, f"Market cap: ${market_cap/1e9:.1f}B"))
                    continue
                
                # Criterio 2: Volumen promedio > $10M diarios
                precio_promedio = hist['Close'].mean()
                volumen_promedio = hist['Volume'].mean()
                volumen_dolares = precio_promedio * volumen_promedio
                
                if volumen_dolares < 10_000_000:
                    rechazados.append((simbolo, f"Volumen: ${volumen_dolares/1e6:.1f}M"))
                    continue
                
                # Criterio 3: Precio > $5 (evitar penny stocks)
                precio_actual = hist['Close'].iloc[-1]
                if precio_actual < 5:
                    rechazados.append((simbolo, f"Precio: ${precio_actual:.2f}"))
                    continue
                
                # Criterio 4: Sector válido (no vacío)
                sector = info.get('sector', 'Unknown')
                if sector in ['Unknown', '', None]:
                    rechazados.append((simbolo, "Sector desconocido"))
                    continue
                
                aprobados.append(simbolo)
                print(f"✅ {simbolo}: ${market_cap/1e9:.1f}B cap, ${volumen_dolares/1e6:.0f}M vol, {sector}")
                
            except Exception as e:
                rechazados.append((simbolo, f"Error: {str(e)[:30]}"))
                continue
        
        print(f"\n📊 RESULTADO NIVEL 1:")
        print(f"✅ Aprobados: {len(aprobados)}")
        print(f"❌ Rechazados: {len(rechazados)}")
        
        if len(rechazados) > 0:
            print("Top rechazos:")
            for simbolo, razon in rechazados[:5]:
                print(f"  {simbolo}: {razon}")
        
        return aprobados

    def filtro_nivel_2_fundamental(self, simbolos):
        """
        NIVEL 2: Análisis fundamental - métricas de calidad financiera.
        """
        print("\n📈 NIVEL 2: Análisis Fundamental")
        print("-" * 50)
        
        candidatos_con_scores = []
        
        for simbolo in simbolos:
            try:
                ticker = yf.Ticker(simbolo)
                info = ticker.info
                
                # Extraer métricas fundamentales
                roe = info.get('returnOnEquity', 0) * 100 if info.get('returnOnEquity') else 0
                roa = info.get('returnOnAssets', 0) * 100 if info.get('returnOnAssets') else 0
                debt_to_equity = info.get('debtToEquity', 100) / 100 if info.get('debtToEquity') else 1
                operating_margin = info.get('operatingMargins', 0) * 100 if info.get('operatingMargins') else 0
                revenue_growth = info.get('revenueGrowth', 0) * 100 if info.get('revenueGrowth') else 0
                current_ratio = info.get('currentRatio', 1) if info.get('currentRatio') else 1
                
                # Calcular score fundamental (0-100)
                score_roe = min(100, max(0, roe * 2))  # ROE 50% = score 100
                score_roa = min(100, max(0, roa * 4))  # ROA 25% = score 100
                score_debt = min(100, max(0, (2 - debt_to_equity) * 50))  # Debt/Eq 0 = score 100
                score_margin = min(100, max(0, operating_margin * 2))  # Margin 50% = score 100
                score_growth = min(100, max(0, revenue_growth * 2))  # Growth 50% = score 100
                score_liquidity = min(100, max(0, (current_ratio - 1) * 50))  # Ratio 3 = score 100
                
                score_fundamental = (score_roe + score_roa + score_debt + 
                                   score_margin + score_growth + score_liquidity) / 6
                
                # Filtros mínimos de calidad
                cumple_filtros = (
                    roe >= 10 and  # ROE mínimo 10%
                    debt_to_equity <= 3 and  # Deuda controlada
                    operating_margin >= 5 and  # Margen operativo mínimo
                    current_ratio >= 1  # Liquidez básica
                )
                
                if cumple_filtros:
                    candidatos_con_scores.append({
                        'simbolo': simbolo,
                        'score_fundamental': score_fundamental,
                        'roe': roe,
                        'roa': roa,
                        'debt_to_equity': debt_to_equity,
                        'operating_margin': operating_margin,
                        'revenue_growth': revenue_growth,
                        'current_ratio': current_ratio,
                        'sector': info.get('sector', 'Unknown')
                    })
                    
                    print(f"✅ {simbolo}: Score {score_fundamental:.1f} | ROE {roe:.1f}% | Debt/Eq {debt_to_equity:.1f}")
                else:
                    print(f"❌ {simbolo}: No cumple filtros mínimos")
                
            except Exception as e:
                print(f"⚠️  {simbolo}: Error - {str(e)[:50]}")
                continue
        
        # Ordenar por score fundamental
        candidatos_con_scores.sort(key=lambda x: x['score_fundamental'], reverse=True)
        
        print(f"\n📊 RESULTADO NIVEL 2:")
        print(f"✅ Candidatos con métricas sólidas: {len(candidatos_con_scores)}")
        
        return candidatos_con_scores

    def filtro_nivel_3_tecnico(self, candidatos_fundamental, dias_analisis=60):
        """
        NIVEL 3: Análisis técnico - momentum y tendencias.
        """
        print("\n📊 NIVEL 3: Análisis Técnico")
        print("-" * 50)
        
        candidatos_finales = []
        
        for candidato in candidatos_fundamental:
            simbolo = candidato['simbolo']
            
            try:
                # Descargar datos históricos
                ticker = yf.Ticker(simbolo)
                hist = ticker.history(period="6mo")
                
                if len(hist) < 100:
                    print(f"⚠️  {simbolo}: Pocos datos técnicos")
                    continue
                
                # Calcular indicadores técnicos
                closes = hist['Close']
                volumes = hist['Volume']
                
                # Medias móviles
                ma_20 = closes.rolling(20).mean()
                ma_50 = closes.rolling(50).mean()
                
                # RSI
                delta = closes.diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                rs = gain / loss
                rsi = 100 - (100 / (1 + rs))
                
                # Valores actuales
                precio_actual = closes.iloc[-1]
                ma_20_actual = ma_20.iloc[-1]
                ma_50_actual = ma_50.iloc[-1]
                rsi_actual = rsi.iloc[-1]
                volumen_actual = volumes.iloc[-20:].mean()  # Promedio 20 días
                
                # Calcular score técnico
                score_trend = 0
                if precio_actual > ma_20_actual > ma_50_actual:
                    score_trend = 100
                elif precio_actual > ma_20_actual:
                    score_trend = 70
                elif precio_actual > ma_50_actual:
                    score_trend = 40
                else:
                    score_trend = 10
                
                # RSI score (preferir 30-70, evitar extremos)
                if 30 <= rsi_actual <= 70:
                    score_rsi = 100
                elif 20 <= rsi_actual < 30 or 70 < rsi_actual <= 80:
                    score_rsi = 70
                else:
                    score_rsi = 30
                
                # Volumen score (consistencia)
                volumen_ma = volumes.rolling(50).mean()
                volumen_ratio = volumen_actual / volumen_ma.iloc[-1] if volumen_ma.iloc[-1] > 0 else 1
                score_volumen = min(100, max(50, volumen_ratio * 100))
                
                score_tecnico = (score_trend * 0.5 + score_rsi * 0.3 + score_volumen * 0.2)
                
                # Criterios de aprobación técnica
                aprobacion_tecnica = (
                    precio_actual > ma_50_actual and  # Tendencia positiva
                    30 <= rsi_actual <= 70 and  # RSI no extremo
                    volumen_ratio >= 0.8  # Volumen decente
                )
                
                if aprobacion_tecnica:
                    candidato['score_tecnico'] = score_tecnico
                    candidato['precio_actual'] = precio_actual
                    candidato['tendencia'] = 'Alcista' if precio_actual > ma_20_actual > ma_50_actual else 'Neutral'
                    candidato['rsi'] = rsi_actual
                    candidato['score_total'] = (candidato['score_fundamental'] + score_tecnico) / 2
                    
                    candidatos_finales.append(candidato)
                    print(f"✅ {simbolo}: Score Téc {score_tecnico:.1f} | {candidato['tendencia']} | RSI {rsi_actual:.1f}")
                else:
                    print(f"❌ {simbolo}: No pasa filtros técnicos")
                
            except Exception as e:
                print(f"⚠️  {simbolo}: Error técnico - {str(e)[:50]}")
                continue
        
        # Ordenar por score total
        candidatos_finales.sort(key=lambda x: x['score_total'], reverse=True)
        
        print(f"\n📊 RESULTADO NIVEL 3:")
        print(f"✅ Finalistas con análisis técnico: {len(candidatos_finales)}")
        
        return candidatos_finales

    def filtro_nivel_4_sectorial(self, candidatos_finales, max_por_sector=3):
        """
        NIVEL 4: Balance sectorial y diversificación.
        """
        print("\n🏭 NIVEL 4: Balance Sectorial")
        print("-" * 50)
        
        # Agrupar por sector
        por_sector = {}
        for candidato in candidatos_finales:
            sector = candidato['sector']
            if sector not in por_sector:
                por_sector[sector] = []
            por_sector[sector].append(candidato)
        
        # Seleccionar mejores por sector
        seleccionados = []
        
        for sector, candidatos in por_sector.items():
            # Ordenar por score total dentro del sector
            candidatos.sort(key=lambda x: x['score_total'], reverse=True)
            # Tomar máximo permitido por sector
            seleccionados_sector = candidatos[:max_por_sector]
            seleccionados.extend(seleccionados_sector)
            
            print(f"🏭 {sector}: {len(seleccionados_sector)} seleccionados de {len(candidatos)} candidatos")
            for candidato in seleccionados_sector:
                print(f"   {candidato['simbolo']}: Score {candidato['score_total']:.1f}")
        
        print(f"\n📊 RESULTADO NIVEL 4:")
        print(f"✅ Selección balanceada: {len(seleccionados)} acciones")
        print(f"🏭 Sectores representados: {len(por_sector)}")
        
        return seleccionados

    def generar_ranking_final(self, candidatos_balanceados, top_n=15):
        """
        NIVEL 5: Ranking final y recomendaciones.
        """
        print("\n🏆 NIVEL 5: Ranking Final")
        print("-" * 50)
        
        # Ordenar por score total
        ranking_final = sorted(candidatos_balanceados, 
                             key=lambda x: x['score_total'], reverse=True)
        
        # Tomar top N
        top_picks = ranking_final[:top_n]
        
        print("🏆 TOP PICKS PARA PORTAFOLIO:")
        print("=" * 70)
        print(f"{'#':<3} {'Símbolo':<8} {'Score':<6} {'Sector':<20} {'ROE':<6} {'Tend':<8} {'RSI':<6}")
        print("-" * 70)
        
        for i, candidato in enumerate(top_picks, 1):
            emoji = "🥇" if i <= 3 else "🥈" if i <= 8 else "🥉"
            print(f"{emoji}{i:<2} {candidato['simbolo']:<8} "
                  f"{candidato['score_total']:<6.1f} "
                  f"{candidato['sector'][:18]:<20} "
                  f"{candidato['roe']:<6.1f} "
                  f"{candidato['tendencia']:<8} "
                  f"{candidato['rsi']:<6.1f}")
        
        return top_picks

    def ejecutar_screener_completo(self, filtro_personalizado=None, top_n=15):
        """
        Ejecuta el pipeline completo de selección.
        
        Parámetros:
        - filtro_personalizado: Función personalizada de filtrado
        - top_n: Número de acciones finales a seleccionar
        
        Retorna:
        - Lista de top picks con todos los datos
        """
        print("🚀 EJECUTANDO SCREENER AUTOMATIZADO COMPLETO")
        print("=" * 80)
        
        # Pipeline completo
        simbolos_iniciales = self.universo_inicial
        print(f"📊 Universo inicial: {len(simbolos_iniciales)} acciones")
        
        # Nivel 1: Liquidez
        aprobados_nivel_1 = self.filtro_nivel_1_liquidez(simbolos_iniciales)
        
        # Nivel 2: Fundamental
        candidatos_nivel_2 = self.filtro_nivel_2_fundamental(aprobados_nivel_1)
        
        # Nivel 3: Técnico
        candidatos_nivel_3 = self.filtro_nivel_3_tecnico(candidatos_nivel_2)
        
        # Nivel 4: Sectorial
        candidatos_nivel_4 = self.filtro_nivel_4_sectorial(candidatos_nivel_3)
        
        # Nivel 5: Ranking final
        top_picks = self.generar_ranking_final(candidatos_nivel_4, top_n)
        
        # Resumen final
        print(f"\n✅ SCREENER COMPLETADO:")
        print(f"📊 Universo inicial: {len(simbolos_iniciales)}")
        print(f"🔍 Aprobaron liquidez: {len(aprobados_nivel_1)}")
        print(f"📈 Aprobaron fundamental: {len(candidatos_nivel_2)}")
        print(f"📊 Aprobaron técnico: {len(candidatos_nivel_3)}")
        print(f"🏭 Balanceados sectorialmente: {len(candidatos_nivel_4)}")
        print(f"🏆 TOP PICKS FINALES: {len(top_picks)}")
        
        return top_picks

# Funciones de utilidad para diferentes perfiles
def screener_conservador():
    """Configuración para perfil conservador."""
    screener = ScreenerAutomatizado()
    # Modificar criterios para ser más conservadores
    print("🛡️  PERFIL CONSERVADOR: Priorizando estabilidad y dividendos")
    return screener.ejecutar_screener_completo(top_n=12)

def screener_moderado():
    """Configuración para perfil moderado."""
    screener = ScreenerAutomatizado()
    print("⚖️  PERFIL MODERADO: Balance riesgo-rendimiento")
    return screener.ejecutar_screener_completo(top_n=15)

def screener_agresivo():
    """Configuración para perfil agresivo."""
    screener = ScreenerAutomatizado()
    print("🚀 PERFIL AGRESIVO: Priorizando crecimiento y momentum")
    return screener.ejecutar_screener_completo(top_n=20)

# Ejemplo de uso
if __name__ == "__main__":
    print("🔍 DEMO: Screener Automatizado")
    print("=" * 50)
    
    # Crear screener
    screener = ScreenerAutomatizado()
    
    # Ejecutar pipeline completo
    top_picks = screener.ejecutar_screener_completo(top_n=15)
    
    # Mostrar símbolos para uso directo
    simbolos_seleccionados = [pick['simbolo'] for pick in top_picks]
    print(f"\n💎 ACCIONES SELECCIONADAS PARA PORTAFOLIO:")
    print(f"📋 {simbolos_seleccionados}")
    print(f"\n🚀 Listo para usar en optimizacion_portafolio_completa()!")