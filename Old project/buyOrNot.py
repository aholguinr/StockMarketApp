import numpy as np
import pandas as pd
import yfinance as yf
from scipy import stats
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import warnings
warnings.filterwarnings('ignore')

def analyze_stock_decision(symbol, detailed_output=True, period="6mo"):
    """
    Analiza una acción y genera recomendación de compra/venta basada en análisis estadístico
    
    Parameters:
    -----------
    symbol : str
        Símbolo de la acción (ej: "AAPL", "TSLA")
    detailed_output : bool
        True: Retorna análisis completo con todos los detalles
        False: Retorna solo la recomendación final y métricas clave
    period : str
        Período de datos históricos ("6mo", "1y", "2y")
    
    Returns:
    --------
    dict: Resultado del análisis según el parámetro detailed_output
    """
    
    try:
        # Obtener datos históricos
        stock = yf.Ticker(symbol)
        df = stock.history(period=period)
        
        if df.empty:
            return {"error": f"No se pudieron obtener datos para {symbol}"}
        
        # Calcular indicadores técnicos
        df = calculate_technical_indicators(df)
        
        # Realizar análisis estadístico
        technical_analysis = analyze_technical_indicators(df)
        momentum_analysis = analyze_momentum(df)
        statistical_patterns = analyze_statistical_patterns(df)
        risk_metrics = calculate_risk_metrics(df)
        ml_insights = perform_ml_analysis(df)
        
        # Calcular scoring ponderado
        scoring = calculate_weighted_scoring(
            technical_analysis, momentum_analysis, statistical_patterns, 
            risk_metrics, ml_insights
        )
        
        # Generar recomendación
        recommendation = generate_recommendation(scoring['final_score'])
        entry_price, stop_loss, take_profit = calculate_price_levels(df, recommendation)
        
        # Generar razones del análisis
        reasoning = generate_reasoning(technical_analysis, momentum_analysis, statistical_patterns, scoring)
        
        current_price = df['Close'].iloc[-1]
        
        if detailed_output:
            return {
                "symbol": symbol.upper(),
                "current_price": round(current_price, 2),
                "recommendation": recommendation['action'],
                "confidence": round(scoring['final_score'], 1),
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                
                "technical_indicators": technical_analysis,
                "momentum_analysis": momentum_analysis,
                "statistical_patterns": statistical_patterns,
                "risk_metrics": risk_metrics,
                "ml_insights": ml_insights,
                "scoring_breakdown": scoring,
                "reasoning": reasoning
            }
        else:
            return {
                "symbol": symbol.upper(),
                "current_price": round(current_price, 2),
                "recommendation": recommendation['action'],
                "confidence": round(scoring['final_score'], 1),
                "entry_price": entry_price,
                "stop_loss": stop_loss,
                "take_profit": take_profit,
                "risk_level": recommendation['risk_level'],
                "time_horizon": recommendation['time_horizon'],
                "key_reason": reasoning[0] if reasoning else "Análisis técnico integral"
            }
            
    except Exception as e:
        return {"error": f"Error en el análisis: {str(e)}"}

def calculate_technical_indicators(df):
    """Calcula indicadores técnicos principales"""
    
    # RSI
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD
    exp1 = df['Close'].ewm(span=12).mean()
    exp2 = df['Close'].ewm(span=26).mean()
    df['MACD'] = exp1 - exp2
    df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
    df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
    
    # Medias móviles
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    df['SMA_200'] = df['Close'].rolling(window=200).mean()
    df['EMA_12'] = df['Close'].ewm(span=12).mean()
    
    # Bandas de Bollinger
    df['BB_Middle'] = df['Close'].rolling(window=20).mean()
    bb_std = df['Close'].rolling(window=20).std()
    df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
    df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
    df['BB_Position'] = (df['Close'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'])
    
    # ATR (Average True Range)
    high_low = df['High'] - df['Low']
    high_close = np.abs(df['High'] - df['Close'].shift())
    low_close = np.abs(df['Low'] - df['Close'].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    df['ATR'] = true_range.rolling(14).mean()
    
    # Stochastic
    df['Stoch_K'] = ((df['Close'] - df['Low'].rolling(14).min()) / 
                     (df['High'].rolling(14).max() - df['Low'].rolling(14).min())) * 100
    df['Stoch_D'] = df['Stoch_K'].rolling(3).mean()
    
    # OBV (On-Balance Volume)
    df['OBV'] = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()
    
    return df

def analyze_technical_indicators(df):
    """Analiza los indicadores técnicos"""
    current = df.iloc[-1]
    
    # RSI Analysis
    rsi_signal = "neutral"
    if current['RSI'] > 70:
        rsi_signal = "overbought"
    elif current['RSI'] < 30:
        rsi_signal = "oversold"
    elif current['RSI'] > 50:
        rsi_signal = "bullish"
    else:
        rsi_signal = "bearish"
    
    # MACD Analysis
    macd_signal = "neutral"
    if current['MACD'] > current['MACD_Signal']:
        macd_signal = "bullish"
    else:
        macd_signal = "bearish"
    
    # Moving Average Analysis
    sma_cross = {}
    if len(df) > 50:
        if current['Close'] > current['SMA_20'] > current['SMA_50']:
            sma_cross['20_50'] = "bullish"
        elif current['Close'] < current['SMA_20'] < current['SMA_50']:
            sma_cross['20_50'] = "bearish"
        else:
            sma_cross['20_50'] = "neutral"
    
    if len(df) > 200:
        if current['SMA_50'] > current['SMA_200']:
            sma_cross['50_200'] = "bullish"
        else:
            sma_cross['50_200'] = "bearish"
    
    # Bollinger Bands
    bb_signal = "neutral"
    if current['BB_Position'] > 0.8:
        bb_signal = "upper_band"
    elif current['BB_Position'] < 0.2:
        bb_signal = "lower_band"
    
    return {
        "rsi": {"value": round(current['RSI'], 1), "signal": rsi_signal, "weight": 0.15},
        "macd": {"value": round(current['MACD'], 3), "signal": macd_signal, "weight": 0.20},
        "bollinger_position": {"value": round(current['BB_Position'], 2), "signal": bb_signal, "weight": 0.10},
        "sma_cross": {**sma_cross, "weight": 0.25},
        "stochastic": {"k": round(current['Stoch_K'], 1), "d": round(current['Stoch_D'], 1), "weight": 0.10}
    }

def analyze_momentum(df):
    """Analiza el momentum de la acción"""
    
    # Calcular retornos
    df['Returns'] = df['Close'].pct_change()
    
    # Trend strength
    recent_returns = df['Returns'].tail(20)
    trend_strength = np.sign(recent_returns.mean()) * min(abs(recent_returns.mean()) * 1000, 10)
    
    # Momentum score
    price_momentum = (df['Close'].iloc[-1] / df['Close'].iloc[-20] - 1) * 100
    
    # Volume analysis
    avg_volume = df['Volume'].tail(50).mean()
    recent_volume = df['Volume'].tail(10).mean()
    volume_ratio = recent_volume / avg_volume
    
    volume_confirmation = "weak"
    if volume_ratio > 1.2:
        volume_confirmation = "strong"
    elif volume_ratio > 1.05:
        volume_confirmation = "moderate"
    
    # Price momentum classification
    momentum_class = "neutral"
    if price_momentum > 5:
        momentum_class = "accelerating"
    elif price_momentum > 0:
        momentum_class = "positive"
    elif price_momentum < -5:
        momentum_class = "declining"
    else:
        momentum_class = "negative"
    
    return {
        "trend_strength": round(trend_strength, 1),
        "momentum_score": round(price_momentum, 1),
        "volume_confirmation": volume_confirmation,
        "volume_ratio": round(volume_ratio, 2),
        "price_momentum": momentum_class
    }

def analyze_statistical_patterns(df):
    """Analiza patrones estadísticos"""
    
    prices = df['Close']
    
    # Mean reversion analysis
    mean_price = prices.tail(50).mean()
    current_price = prices.iloc[-1]
    std_price = prices.tail(50).std()
    z_score = (current_price - mean_price) / std_price
    
    # Volatility regime
    recent_vol = prices.tail(20).std()
    historical_vol = prices.std()
    vol_ratio = recent_vol / historical_vol
    
    volatility_regime = "normal"
    if vol_ratio > 1.5:
        volatility_regime = "high"
    elif vol_ratio < 0.7:
        volatility_regime = "low"
    
    # Support and resistance levels
    recent_prices = prices.tail(50)
    support_levels = []
    resistance_levels = []
    
    # Calcular niveles de soporte y resistencia simples
    price_ranges = np.percentile(recent_prices, [10, 25, 75, 90])
    support_levels = [round(price_ranges[0], 2), round(price_ranges[1], 2)]
    resistance_levels = [round(price_ranges[2], 2), round(price_ranges[3], 2)]
    
    return {
        "mean_reversion_score": round(z_score, 2),
        "volatility_regime": volatility_regime,
        "volatility_ratio": round(vol_ratio, 2),
        "support_levels": support_levels,
        "resistance_levels": resistance_levels,
        "price_distribution": {
            "skewness": round(stats.skew(recent_prices), 2),
            "kurtosis": round(stats.kurtosis(recent_prices), 2)
        }
    }

def calculate_risk_metrics(df):
    """Calcula métricas de riesgo"""
    
    returns = df['Close'].pct_change().dropna()
    
    # VaR (Value at Risk) 5%
    var_5 = np.percentile(returns, 5) * 100
    
    # Sharpe Ratio (anualizado)
    if returns.std() != 0:
        sharpe_ratio = (returns.mean() / returns.std()) * np.sqrt(252)
    else:
        sharpe_ratio = 0
    
    # Maximum Drawdown
    cumulative = (1 + returns).cumprod()
    running_max = cumulative.expanding().max()
    drawdown = (cumulative / running_max - 1)
    max_drawdown = drawdown.min() * 100
    
    # Beta (vs SPY aproximado)
    beta = 1.0  # Simplificado para este ejemplo
    
    return {
        "var_1day_5%": round(var_5, 2),
        "sharpe_ratio": round(sharpe_ratio, 2),
        "max_drawdown": round(max_drawdown, 2),
        "beta": beta,
        "daily_volatility": round(returns.std() * 100, 2)
    }

def perform_ml_analysis(df):
    """Realiza análisis básico de machine learning"""
    
    # Preparar features para ML
    features = ['RSI', 'MACD', 'BB_Position', 'Stoch_K', 'Volume']
    ml_df = df[features].dropna()
    
    if len(ml_df) < 20:
        return {
            "regime_classification": "insufficient_data",
            "pattern_similarity": 0.5,
            "forecast_direction": "neutral",
            "feature_importance": {"insufficient": "data"}
        }
    
    # Clustering para identificar regímenes
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(ml_df.tail(50))
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(scaled_features)
    current_regime = clusters[-1]
    
    regime_names = {0: "consolidation", 1: "growth_phase", 2: "correction_phase"}
    
    # Pattern similarity (simplificado)
    recent_pattern = scaled_features[-10:]
    historical_patterns = scaled_features[:-10]
    
    if len(historical_patterns) > 10:
        similarities = []
        for i in range(len(historical_patterns) - 10):
            pattern = historical_patterns[i:i+10]
            similarity = np.corrcoef(recent_pattern.flatten(), pattern.flatten())[0,1]
            if not np.isnan(similarity):
                similarities.append(abs(similarity))
        
        pattern_similarity = np.mean(similarities) if similarities else 0.5
    else:
        pattern_similarity = 0.5
    
    # Forecast direction (simplificado)
    recent_trend = np.polyfit(range(10), df['Close'].tail(10), 1)[0]
    forecast_direction = "upward" if recent_trend > 0 else "downward"
    
    return {
        "regime_classification": regime_names.get(current_regime, "unknown"),
        "pattern_similarity": round(pattern_similarity, 2),
        "forecast_direction": forecast_direction,
        "feature_importance": {
            "volume": 0.25, "momentum": 0.30, "trend": 0.45
        }
    }

def calculate_weighted_scoring(technical, momentum, patterns, risk, ml):
    """Calcula el scoring ponderado final"""
    
    # Scoring individual de cada componente (0-10)
    technical_score = calculate_technical_score(technical)
    momentum_score = calculate_momentum_score(momentum)
    risk_score = calculate_risk_score(risk)
    pattern_score = calculate_pattern_score(patterns)
    volume_score = calculate_volume_score(momentum)
    
    # Pesos para el scoring final
    weights = {
        'technical': 0.25,
        'momentum': 0.25,
        'risk': 0.20,
        'pattern': 0.20,
        'volume': 0.10
    }
    
    # Score final ponderado (0-100)
    final_score = (
        technical_score * weights['technical'] +
        momentum_score * weights['momentum'] +
        risk_score * weights['risk'] +
        pattern_score * weights['pattern'] +
        volume_score * weights['volume']
    ) * 10
    
    return {
        "technical_score": round(technical_score, 1),
        "momentum_score": round(momentum_score, 1),
        "risk_score": round(risk_score, 1),
        "pattern_score": round(pattern_score, 1),
        "volume_score": round(volume_score, 1),
        "final_score": round(final_score, 1)
    }

def calculate_technical_score(technical):
    """Calcula score basado en indicadores técnicos"""
    score = 5.0  # Base neutral
    
    # RSI
    rsi_signal = technical['rsi']['signal']
    if rsi_signal == 'bullish':
        score += 1.0
    elif rsi_signal == 'bearish':
        score -= 1.0
    elif rsi_signal == 'oversold':
        score += 1.5
    elif rsi_signal == 'overbought':
        score -= 1.5
    
    # MACD
    if technical['macd']['signal'] == 'bullish':
        score += 1.5
    elif technical['macd']['signal'] == 'bearish':
        score -= 1.5
    
    # Moving averages
    sma_cross = technical['sma_cross']
    if sma_cross.get('20_50') == 'bullish':
        score += 1.0
    elif sma_cross.get('20_50') == 'bearish':
        score -= 1.0
    
    if sma_cross.get('50_200') == 'bullish':
        score += 1.0
    elif sma_cross.get('50_200') == 'bearish':
        score -= 1.0
    
    return max(0, min(10, score))

def calculate_momentum_score(momentum):
    """Calcula score basado en momentum"""
    score = 5.0
    
    # Trend strength
    if momentum['trend_strength'] > 3:
        score += 2.0
    elif momentum['trend_strength'] > 0:
        score += 1.0
    elif momentum['trend_strength'] < -3:
        score -= 2.0
    elif momentum['trend_strength'] < 0:
        score -= 1.0
    
    # Price momentum
    if momentum['price_momentum'] == 'accelerating':
        score += 2.0
    elif momentum['price_momentum'] == 'positive':
        score += 1.0
    elif momentum['price_momentum'] == 'declining':
        score -= 2.0
    elif momentum['price_momentum'] == 'negative':
        score -= 1.0
    
    return max(0, min(10, score))

def calculate_risk_score(risk):
    """Calcula score basado en métricas de riesgo (invertido - menor riesgo = mayor score)"""
    score = 5.0
    
    # Sharpe ratio
    if risk['sharpe_ratio'] > 1.0:
        score += 2.0
    elif risk['sharpe_ratio'] > 0.5:
        score += 1.0
    elif risk['sharpe_ratio'] < -0.5:
        score -= 2.0
    elif risk['sharpe_ratio'] < 0:
        score -= 1.0
    
    # VaR
    if risk['var_1day_5%'] > -2:
        score += 1.0
    elif risk['var_1day_5%'] < -5:
        score -= 1.0
    
    # Max drawdown
    if risk['max_drawdown'] > -10:
        score += 1.0
    elif risk['max_drawdown'] < -25:
        score -= 2.0
    elif risk['max_drawdown'] < -15:
        score -= 1.0
    
    return max(0, min(10, score))

def calculate_pattern_score(patterns):
    """Calcula score basado en patrones estadísticos"""
    score = 5.0
    
    # Mean reversion
    z_score = patterns['mean_reversion_score']
    if -1 < z_score < 1:
        score += 1.0  # Precio cerca de la media es estable
    elif z_score < -2:
        score += 1.5  # Oversold, potencial rebote
    elif z_score > 2:
        score -= 1.5  # Overbought, potencial corrección
    
    # Volatility regime
    if patterns['volatility_regime'] == 'low':
        score += 1.0  # Baja volatilidad es positiva
    elif patterns['volatility_regime'] == 'high':
        score -= 1.0  # Alta volatilidad aumenta riesgo
    
    return max(0, min(10, score))

def calculate_volume_score(momentum):
    """Calcula score basado en análisis de volumen"""
    score = 5.0
    
    if momentum['volume_confirmation'] == 'strong':
        score += 3.0
    elif momentum['volume_confirmation'] == 'moderate':
        score += 1.0
    elif momentum['volume_confirmation'] == 'weak':
        score -= 1.0
    
    return max(0, min(10, score))

def generate_recommendation(final_score):
    """Genera recomendación basada en el score final"""
    
    if final_score >= 75:
        action = "COMPRAR"
        risk_level = "BAJO"
        time_horizon = "2-8 semanas"
    elif final_score >= 60:
        action = "COMPRAR"
        risk_level = "MEDIO"
        time_horizon = "3-6 semanas"
    elif final_score >= 40:
        action = "MANTENER"
        risk_level = "MEDIO"
        time_horizon = "1-4 semanas"
    elif final_score >= 25:
        action = "VENDER"
        risk_level = "ALTO"
        time_horizon = "1-3 semanas"
    else:
        action = "VENDER"
        risk_level = "ALTO"
        time_horizon = "Inmediato"
    
    return {
        "action": action,
        "risk_level": risk_level,
        "time_horizon": time_horizon
    }

def calculate_price_levels(df, recommendation):
    """Calcula niveles de entrada, stop loss y take profit"""
    current_price = df['Close'].iloc[-1]
    atr = df['ATR'].iloc[-1]
    
    if recommendation['action'] == "COMPRAR":
        entry_price = round(current_price * 0.998, 2)  # Ligeramente por debajo del precio actual
        stop_loss = round(current_price - (atr * 1.5), 2)
        take_profit = round(current_price + (atr * 2.5), 2)
    elif recommendation['action'] == "VENDER":
        entry_price = round(current_price * 1.002, 2)  # Ligeramente por encima para venta
        stop_loss = round(current_price + (atr * 1.5), 2)
        take_profit = round(current_price - (atr * 2.5), 2)
    else:  # MANTENER
        entry_price = round(current_price, 2)
        stop_loss = round(current_price - (atr * 1.0), 2)
        take_profit = round(current_price + (atr * 1.5), 2)
    
    return entry_price, stop_loss, take_profit

def generate_reasoning(technical, momentum, patterns, scoring):
    """Genera las razones principales del análisis"""
    reasons = []
    
    # Razones técnicas
    if technical['macd']['signal'] == 'bullish' and scoring['technical_score'] > 6:
        reasons.append("MACD muestra señal alcista con momentum positivo")
    elif technical['macd']['signal'] == 'bearish' and scoring['technical_score'] < 4:
        reasons.append("MACD indica debilidad técnica con presión bajista")
    
    # Razones de volumen
    if momentum['volume_confirmation'] == 'strong':
        reasons.append(f"Volumen confirma el movimiento ({momentum['volume_ratio']}x superior a media)")
    elif momentum['volume_confirmation'] == 'weak':
        reasons.append("Falta confirmación de volumen en el movimiento actual")
    
    # Razones de momentum
    if momentum['price_momentum'] == 'accelerating':
        reasons.append("Momentum de precio en aceleración alcista")
    elif momentum['price_momentum'] == 'declining':
        reasons.append("Momentum de precio en declive preocupante")
    
    # Razones de RSI
    rsi_val = technical['rsi']['value']
    if rsi_val < 35:
        reasons.append(f"RSI en zona de sobreventa ({rsi_val}) sugiere potencial rebote")
    elif rsi_val > 65:
        reasons.append(f"RSI en zona de sobrecompra ({rsi_val}) indica posible corrección")
    
    # Razones de tendencia
    sma_cross = technical['sma_cross']
    if sma_cross.get('20_50') == 'bullish' and sma_cross.get('50_200') == 'bullish':
        reasons.append("Configuración alcista en medias móviles confirma tendencia")
    elif sma_cross.get('20_50') == 'bearish':
        reasons.append("Ruptura bajista de medias móviles señala debilidad")
    
    # Si no hay razones específicas, agregar razón general
    if not reasons:
        if scoring['final_score'] > 60:
            reasons.append("Análisis técnico integral muestra fortaleza general")
        else:
            reasons.append("Análisis técnico integral indica cautela")
    
    return reasons[:5]  # Máximo 5 razones

# Función de ejemplo para probar
def test_analyzer(ticker):
    """Función de prueba para el analizador"""
    print("=== PRUEBA RÁPIDA ===")
    result_quick = analyze_stock_decision(ticker, detailed_output=False)
    print(f"Símbolo: {result_quick.get('symbol', 'N/A')}")
    print(f"Recomendación: {result_quick.get('recommendation', 'N/A')}")
    print(f"Confianza: {result_quick.get('confidence', 'N/A')}%")
    print(f"Razón clave: {result_quick.get('key_reason', 'N/A')}")
    
    print("\n=== PRUEBA DETALLADA ===")
    result_detailed = analyze_stock_decision(ticker, detailed_output=True)
    print(f"Score breakdown: {result_detailed.get('scoring_breakdown', {})}")
    print(f"Razones completas: {result_detailed.get('reasoning', [])}")

# Ejecutar prueba si se ejecuta directamente
if __name__ == "__main__":
    test_analyzer("AMD")