"""
Advanced Analytics Service for Stock Market Analysis
Provides predictive analytics, trend analysis, and advanced technical indicators
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from scipy import stats
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import yfinance as yf
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

def analyze_advanced_patterns(symbol: str, period: str = "1y", interval: str = "1d") -> Dict:
    """
    Analiza patrones avanzados como ondas de Elliott, fractales, divergencias
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        
        if data.empty:
            return {"error": f"No data available for {symbol}"}
        
        # Calculate advanced technical indicators
        data = calculate_advanced_indicators(data)
        
        # Detect patterns
        patterns = {
            "elliott_waves": detect_elliott_waves(data),
            "fractals": detect_fractals(data),
            "divergences": detect_divergences(data),
            "chart_patterns": detect_chart_patterns(data),
            "harmonic_patterns": detect_harmonic_patterns(data)
        }
        
        # Market structure analysis
        market_structure = analyze_market_structure(data)
        
        # Volume analysis
        volume_analysis = analyze_volume_patterns(data)
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "patterns": patterns,
            "market_structure": market_structure,
            "volume_analysis": volume_analysis,
            "data_points": len(data)
        }
        
    except Exception as e:
        return {"error": f"Error analyzing patterns for {symbol}: {str(e)}"}

def predict_stock_trends(symbol: str, period: str = "1y", forecast_days: int = 30) -> Dict:
    """
    Predice tendencias futuras usando múltiples modelos de machine learning
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval="1d")
        
        if data.empty or len(data) < 30:
            return {"error": f"Insufficient data for prediction of {symbol}"}
        
        # Prepare features
        features_df = prepare_ml_features(data)
        
        # Multiple prediction models
        predictions = {}
        
        # Linear trend prediction
        linear_pred = linear_trend_prediction(data, forecast_days)
        predictions["linear_trend"] = linear_pred
        
        # Moving averages prediction
        ma_pred = moving_average_prediction(data, forecast_days)
        predictions["moving_average"] = ma_pred
        
        # Random Forest prediction
        rf_pred = random_forest_prediction(features_df, forecast_days)
        predictions["random_forest"] = rf_pred
        
        # ARIMA-like simple prediction
        arima_pred = simple_arima_prediction(data, forecast_days)
        predictions["arima_simple"] = arima_pred
        
        # Ensemble prediction (weighted average)
        ensemble_pred = create_ensemble_prediction(predictions, forecast_days)
        
        # Calculate prediction confidence
        confidence_metrics = calculate_prediction_confidence(data, predictions)
        
        # Support and resistance levels for future
        future_levels = predict_support_resistance(data, forecast_days)
        
        return {
            "symbol": symbol,
            "forecast_period": forecast_days,
            "current_price": float(data['Close'].iloc[-1]),
            "predictions": predictions,
            "ensemble_prediction": ensemble_pred,
            "confidence_metrics": confidence_metrics,
            "future_support_resistance": future_levels,
            "trend_analysis": analyze_current_trend(data),
            "volatility_forecast": forecast_volatility(data, forecast_days)
        }
        
    except Exception as e:
        return {"error": f"Error predicting trends for {symbol}: {str(e)}"}

def calculate_technical_indicators(symbol: str, period: str = "6mo", interval: str = "1d") -> Dict:
    """
    Calcula indicadores técnicos avanzados y osciladores
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        
        if data.empty:
            return {"error": f"No data available for {symbol}"}
        
        indicators = {}
        
        # Basic indicators
        indicators["sma"] = calculate_sma(data)
        indicators["ema"] = calculate_ema(data)
        indicators["rsi"] = calculate_rsi(data)
        indicators["macd"] = calculate_macd(data)
        indicators["bollinger_bands"] = calculate_bollinger_bands(data)
        
        # Advanced oscillators
        indicators["stochastic"] = calculate_stochastic(data)
        indicators["williams_r"] = calculate_williams_r(data)
        indicators["commodity_channel_index"] = calculate_cci(data)
        indicators["average_true_range"] = calculate_atr(data)
        
        # Momentum indicators
        indicators["momentum"] = calculate_momentum(data)
        indicators["rate_of_change"] = calculate_roc(data)
        indicators["awesome_oscillator"] = calculate_awesome_oscillator(data)
        
        # Volume indicators
        indicators["volume_sma"] = calculate_volume_sma(data)
        indicators["volume_weighted_average_price"] = calculate_vwap(data)
        indicators["on_balance_volume"] = calculate_obv(data)
        
        # Trend indicators
        indicators["parabolic_sar"] = calculate_parabolic_sar(data)
        indicators["ichimoku"] = calculate_ichimoku(data)
        
        # Current signals
        current_signals = generate_technical_signals(indicators, data)
        
        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "indicators": indicators,
            "current_signals": current_signals,
            "last_updated": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {"error": f"Error calculating indicators for {symbol}: {str(e)}"}

def analyze_market_sentiment(symbol: str, period: str = "3mo") -> Dict:
    """
    Analiza el sentiment del mercado basado en patrones de precio y volumen
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval="1d")
        
        if data.empty:
            return {"error": f"No data available for {symbol}"}
        
        # Price action sentiment
        price_sentiment = analyze_price_sentiment(data)
        
        # Volume sentiment
        volume_sentiment = analyze_volume_sentiment(data)
        
        # Volatility sentiment
        volatility_sentiment = analyze_volatility_sentiment(data)
        
        # Market regime detection
        market_regime = detect_market_regime(data)
        
        # Fear and greed indicators
        fear_greed = calculate_fear_greed_indicators(data)
        
        # Overall sentiment score
        overall_sentiment = calculate_overall_sentiment(
            price_sentiment, volume_sentiment, volatility_sentiment
        )
        
        return {
            "symbol": symbol,
            "period": period,
            "price_sentiment": price_sentiment,
            "volume_sentiment": volume_sentiment,
            "volatility_sentiment": volatility_sentiment,
            "market_regime": market_regime,
            "fear_greed_indicators": fear_greed,
            "overall_sentiment": overall_sentiment,
            "sentiment_score": overall_sentiment["score"],
            "sentiment_label": overall_sentiment["label"]
        }
        
    except Exception as e:
        return {"error": f"Error analyzing sentiment for {symbol}: {str(e)}"}

def detect_support_resistance(symbol: str, period: str = "6mo", interval: str = "1d") -> Dict:
    """
    Detecta niveles de soporte y resistencia automáticamente
    """
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period, interval=interval)
        
        if data.empty:
            return {"error": f"No data available for {symbol}"}
        
        # Detect support and resistance levels
        support_levels = find_support_levels(data)
        resistance_levels = find_resistance_levels(data)
        
        # Dynamic levels (based on recent price action)
        dynamic_levels = find_dynamic_levels(data)
        
        # Fibonacci retracements
        fibonacci_levels = calculate_fibonacci_levels(data)
        
        # Pivot points
        pivot_points = calculate_pivot_points(data)
        
        # Level strength analysis
        level_strength = analyze_level_strength(data, support_levels, resistance_levels)
        
        # Current position analysis
        current_price = float(data['Close'].iloc[-1])
        position_analysis = analyze_current_position(
            current_price, support_levels, resistance_levels
        )
        
        return {
            "symbol": symbol,
            "current_price": current_price,
            "support_levels": support_levels,
            "resistance_levels": resistance_levels,
            "dynamic_levels": dynamic_levels,
            "fibonacci_levels": fibonacci_levels,
            "pivot_points": pivot_points,
            "level_strength": level_strength,
            "position_analysis": position_analysis,
            "key_levels": identify_key_levels(support_levels, resistance_levels, current_price)
        }
        
    except Exception as e:
        return {"error": f"Error detecting support/resistance for {symbol}: {str(e)}"}

# =====================================
# Helper Functions for Advanced Analytics
# =====================================

def calculate_advanced_indicators(data: pd.DataFrame) -> pd.DataFrame:
    """Calculate advanced technical indicators for pattern detection"""
    df = data.copy()
    
    # Add basic moving averages
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['EMA_12'] = df['Close'].ewm(span=12).mean()
    df['EMA_26'] = df['Close'].ewm(span=26).mean()
    
    # RSI
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # MACD
    df['MACD'] = df['EMA_12'] - df['EMA_26']
    df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
    df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
    
    return df

def detect_elliott_waves(data: pd.DataFrame) -> Dict:
    """Simplified Elliott Wave detection"""
    try:
        highs = data['High'].values
        lows = data['Low'].values
        closes = data['Close'].values
        
        # Find potential wave points (simplified)
        peaks = []
        troughs = []
        
        for i in range(2, len(highs) - 2):
            if highs[i] > highs[i-1] and highs[i] > highs[i+1] and highs[i] > highs[i-2] and highs[i] > highs[i+2]:
                peaks.append({"index": i, "price": highs[i], "type": "peak"})
            if lows[i] < lows[i-1] and lows[i] < lows[i+1] and lows[i] < lows[i-2] and lows[i] < lows[i+2]:
                troughs.append({"index": i, "price": lows[i], "type": "trough"})
        
        # Basic wave analysis
        wave_analysis = "inconclusive"
        if len(peaks) >= 3 and len(troughs) >= 2:
            if peaks[-1]["price"] > peaks[-2]["price"] > peaks[-3]["price"]:
                wave_analysis = "bullish_impulse_pattern"
            elif peaks[-1]["price"] < peaks[-2]["price"] < peaks[-3]["price"]:
                wave_analysis = "bearish_impulse_pattern"
        
        return {
            "peaks": peaks[-5:],  # Last 5 peaks
            "troughs": troughs[-5:],  # Last 5 troughs
            "wave_analysis": wave_analysis,
            "confidence": 0.6 if wave_analysis != "inconclusive" else 0.3
        }
    except:
        return {"error": "Could not detect Elliott waves"}

def detect_fractals(data: pd.DataFrame) -> Dict:
    """Detect fractal patterns"""
    try:
        highs = data['High'].values
        lows = data['Low'].values
        
        fractal_highs = []
        fractal_lows = []
        
        for i in range(2, len(highs) - 2):
            # Fractal high: current high is higher than 2 highs on each side
            if all(highs[i] >= highs[i-j] for j in range(1, 3)) and all(highs[i] >= highs[i+j] for j in range(1, 3)):
                fractal_highs.append({"index": i, "price": highs[i]})
            
            # Fractal low: current low is lower than 2 lows on each side
            if all(lows[i] <= lows[i-j] for j in range(1, 3)) and all(lows[i] <= lows[i+j] for j in range(1, 3)):
                fractal_lows.append({"index": i, "price": lows[i]})
        
        return {
            "fractal_highs": fractal_highs[-10:],  # Last 10 fractal highs
            "fractal_lows": fractal_lows[-10:],   # Last 10 fractal lows
            "total_fractals": len(fractal_highs) + len(fractal_lows)
        }
    except:
        return {"error": "Could not detect fractals"}

def detect_divergences(data: pd.DataFrame) -> Dict:
    """Detect RSI and MACD divergences"""
    try:
        if 'RSI' not in data.columns or 'MACD' not in data.columns:
            return {"error": "Required indicators not available"}
        
        price_peaks = []
        price_troughs = []
        rsi_peaks = []
        rsi_troughs = []
        
        # Simple peak/trough detection for last 50 periods
        recent_data = data.tail(50)
        
        for i in range(2, len(recent_data) - 2):
            idx = recent_data.index[i]
            
            # Price peaks/troughs
            if (recent_data['High'].iloc[i] > recent_data['High'].iloc[i-1] and 
                recent_data['High'].iloc[i] > recent_data['High'].iloc[i+1]):
                price_peaks.append({"date": idx, "price": recent_data['High'].iloc[i], "rsi": recent_data['RSI'].iloc[i]})
            
            if (recent_data['Low'].iloc[i] < recent_data['Low'].iloc[i-1] and 
                recent_data['Low'].iloc[i] < recent_data['Low'].iloc[i+1]):
                price_troughs.append({"date": idx, "price": recent_data['Low'].iloc[i], "rsi": recent_data['RSI'].iloc[i]})
        
        # Detect divergences
        bullish_divergence = False
        bearish_divergence = False
        
        # Check for bullish divergence (price makes lower low, RSI makes higher low)
        if len(price_troughs) >= 2:
            last_two_troughs = price_troughs[-2:]
            if (last_two_troughs[1]["price"] < last_two_troughs[0]["price"] and
                last_two_troughs[1]["rsi"] > last_two_troughs[0]["rsi"]):
                bullish_divergence = True
        
        # Check for bearish divergence (price makes higher high, RSI makes lower high)
        if len(price_peaks) >= 2:
            last_two_peaks = price_peaks[-2:]
            if (last_two_peaks[1]["price"] > last_two_peaks[0]["price"] and
                last_two_peaks[1]["rsi"] < last_two_peaks[0]["rsi"]):
                bearish_divergence = True
        
        return {
            "bullish_divergence": bullish_divergence,
            "bearish_divergence": bearish_divergence,
            "price_peaks": price_peaks[-5:],
            "price_troughs": price_troughs[-5:],
            "divergence_strength": "strong" if bullish_divergence or bearish_divergence else "none"
        }
    except:
        return {"error": "Could not detect divergences"}

def detect_chart_patterns(data: pd.DataFrame) -> Dict:
    """Detect common chart patterns"""
    try:
        patterns = {
            "head_and_shoulders": False,
            "double_top": False,
            "double_bottom": False,
            "triangle": "none",
            "flag": False,
            "wedge": "none"
        }
        
        # Simplified pattern detection
        recent_data = data.tail(20)
        highs = recent_data['High'].values
        lows = recent_data['Low'].values
        
        # Double top detection (simplified)
        if len(highs) >= 10:
            max_indices = np.argsort(highs)[-3:]  # Top 3 highs
            if len(max_indices) >= 2:
                highest_two = sorted(highs[max_indices[-2:]])
                if abs(highest_two[1] - highest_two[0]) / highest_two[0] < 0.02:  # Within 2%
                    patterns["double_top"] = True
        
        # Double bottom detection (simplified)
        if len(lows) >= 10:
            min_indices = np.argsort(lows)[:3]  # Bottom 3 lows
            if len(min_indices) >= 2:
                lowest_two = sorted(lows[min_indices[:2]])
                if abs(lowest_two[1] - lowest_two[0]) / lowest_two[0] < 0.02:  # Within 2%
                    patterns["double_bottom"] = True
        
        # Triangle pattern (ascending/descending/symmetrical)
        if len(recent_data) >= 15:
            slope_highs = np.polyfit(range(len(highs)), highs, 1)[0]
            slope_lows = np.polyfit(range(len(lows)), lows, 1)[0]
            
            if abs(slope_highs) < 0.01 and slope_lows > 0.01:
                patterns["triangle"] = "ascending"
            elif slope_highs < -0.01 and abs(slope_lows) < 0.01:
                patterns["triangle"] = "descending"
            elif abs(slope_highs - (-slope_lows)) < 0.005:
                patterns["triangle"] = "symmetrical"
        
        return patterns
    except:
        return {"error": "Could not detect chart patterns"}

def detect_harmonic_patterns(data: pd.DataFrame) -> Dict:
    """Detect harmonic patterns (Gartley, Butterfly, etc.)"""
    # Simplified harmonic pattern detection
    try:
        return {
            "gartley": False,
            "butterfly": False,
            "bat": False,
            "crab": False,
            "pattern_strength": "weak",
            "note": "Harmonic pattern detection is simplified"
        }
    except:
        return {"error": "Could not detect harmonic patterns"}

def analyze_market_structure(data: pd.DataFrame) -> Dict:
    """Analyze market structure (trends, cycles, etc.)"""
    try:
        # Trend analysis
        close_prices = data['Close'].values
        trend_slope = np.polyfit(range(len(close_prices)), close_prices, 1)[0]
        
        trend_direction = "uptrend" if trend_slope > 0 else "downtrend" if trend_slope < 0 else "sideways"
        trend_strength = min(abs(trend_slope) * 100, 100)  # Normalize to 0-100
        
        # Market phases
        recent_volatility = data['Close'].pct_change().tail(20).std() * 100
        avg_volatility = data['Close'].pct_change().std() * 100
        
        if recent_volatility > avg_volatility * 1.5:
            market_phase = "high_volatility"
        elif recent_volatility < avg_volatility * 0.5:
            market_phase = "low_volatility"
        else:
            market_phase = "normal"
        
        # Cycle analysis (simplified)
        cycle_length = estimate_cycle_length(data)
        
        return {
            "trend_direction": trend_direction,
            "trend_strength": round(trend_strength, 2),
            "market_phase": market_phase,
            "volatility_regime": "high" if recent_volatility > avg_volatility * 1.2 else "normal",
            "estimated_cycle_length": cycle_length,
            "structure_quality": "good" if trend_strength > 10 else "weak"
        }
    except:
        return {"error": "Could not analyze market structure"}

def analyze_volume_patterns(data: pd.DataFrame) -> Dict:
    """Analyze volume patterns and anomalies"""
    try:
        volume = data['Volume'].values
        close = data['Close'].values
        
        # Volume trend
        volume_slope = np.polyfit(range(len(volume)), volume, 1)[0]
        volume_trend = "increasing" if volume_slope > 0 else "decreasing"
        
        # Volume spikes
        avg_volume = np.mean(volume)
        volume_spikes = np.where(volume > avg_volume * 2)[0]
        
        # Price-volume correlation
        price_changes = np.diff(close)
        volume_changes = np.diff(volume)
        if len(price_changes) > 1 and len(volume_changes) > 1:
            correlation = np.corrcoef(price_changes, volume_changes[:-1] if len(volume_changes) > len(price_changes) else volume_changes)[0, 1]
        else:
            correlation = 0
        
        # On-Balance Volume analysis
        obv = calculate_simple_obv(data)
        obv_trend = "bullish" if obv[-1] > obv[-10] else "bearish"
        
        return {
            "volume_trend": volume_trend,
            "avg_volume": int(avg_volume),
            "recent_volume": int(volume[-1]),
            "volume_ratio": round(volume[-1] / avg_volume, 2),
            "price_volume_correlation": round(correlation, 3),
            "volume_spikes_count": len(volume_spikes),
            "obv_trend": obv_trend,
            "volume_strength": "strong" if volume[-1] > avg_volume * 1.5 else "normal"
        }
    except:
        return {"error": "Could not analyze volume patterns"}

# =====================================
# Prediction Helper Functions
# =====================================

def prepare_ml_features(data: pd.DataFrame) -> pd.DataFrame:
    """Prepare features for machine learning models"""
    df = data.copy()
    
    # Price features
    df['returns'] = df['Close'].pct_change()
    df['log_returns'] = np.log(df['Close'] / df['Close'].shift(1))
    
    # Moving averages
    for window in [5, 10, 20, 50]:
        df[f'sma_{window}'] = df['Close'].rolling(window=window).mean()
        df[f'close_sma_{window}_ratio'] = df['Close'] / df[f'sma_{window}']
    
    # Volatility
    df['volatility'] = df['returns'].rolling(window=20).std()
    
    # Volume features
    df['volume_sma'] = df['Volume'].rolling(window=20).mean()
    df['volume_ratio'] = df['Volume'] / df['volume_sma']
    
    # Lag features
    for lag in [1, 2, 3, 5]:
        df[f'close_lag_{lag}'] = df['Close'].shift(lag)
        df[f'returns_lag_{lag}'] = df['returns'].shift(lag)
    
    return df.dropna()

def linear_trend_prediction(data: pd.DataFrame, forecast_days: int) -> Dict:
    """Simple linear trend prediction"""
    try:
        close_prices = data['Close'].values
        x = np.arange(len(close_prices)).reshape(-1, 1)
        
        model = LinearRegression()
        model.fit(x, close_prices)
        
        # Predict future values
        future_x = np.arange(len(close_prices), len(close_prices) + forecast_days).reshape(-1, 1)
        future_prices = model.predict(future_x)
        
        # Calculate trend metrics
        slope = model.coef_[0]
        r_squared = model.score(x, close_prices)
        
        return {
            "method": "linear_trend",
            "predictions": future_prices.tolist(),
            "trend_slope": float(slope),
            "r_squared": float(r_squared),
            "confidence": min(r_squared, 0.95)
        }
    except:
        return {"error": "Linear trend prediction failed"}

def moving_average_prediction(data: pd.DataFrame, forecast_days: int) -> Dict:
    """Moving average based prediction"""
    try:
        close_prices = data['Close'].values
        
        # Use multiple moving averages
        sma_5 = np.mean(close_prices[-5:])
        sma_10 = np.mean(close_prices[-10:])
        sma_20 = np.mean(close_prices[-20:])
        
        # Weighted prediction
        weights = [0.5, 0.3, 0.2]
        predicted_price = weights[0] * sma_5 + weights[1] * sma_10 + weights[2] * sma_20
        
        # Assume slight trend continuation
        recent_trend = (close_prices[-1] - close_prices[-5]) / 5
        
        predictions = []
        for i in range(forecast_days):
            pred_price = predicted_price + (recent_trend * i * 0.5)  # Damped trend
            predictions.append(pred_price)
        
        return {
            "method": "moving_average",
            "predictions": predictions,
            "base_prediction": float(predicted_price),
            "trend_component": float(recent_trend),
            "confidence": 0.7
        }
    except:
        return {"error": "Moving average prediction failed"}

def random_forest_prediction(features_df: pd.DataFrame, forecast_days: int) -> Dict:
    """Random Forest based prediction"""
    try:
        if len(features_df) < 50:
            return {"error": "Insufficient data for Random Forest"}
        
        # Prepare features (exclude future-looking columns)
        feature_cols = [col for col in features_df.columns if not col.startswith('close_lag_') and col != 'Close']
        feature_cols = [col for col in feature_cols if features_df[col].notna().sum() > len(features_df) * 0.8]
        
        if len(feature_cols) < 5:
            return {"error": "Insufficient valid features"}
        
        X = features_df[feature_cols].fillna(features_df[feature_cols].mean())
        y = features_df['Close']
        
        # Split data
        split_idx = int(len(X) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Train model
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)
        
        # Test score
        score = model.score(X_test, y_test)
        
        # Predict future (use last known values and extrapolate)
        last_features = X.iloc[-1:].copy()
        predictions = []
        
        for i in range(forecast_days):
            pred = model.predict(last_features)[0]
            predictions.append(pred)
            
            # Update features for next prediction (simplified)
            if i < forecast_days - 1:
                # This is a simplified update - in practice, you'd need more sophisticated feature engineering
                last_features = last_features.copy()
        
        return {
            "method": "random_forest",
            "predictions": predictions,
            "model_score": float(score),
            "confidence": min(max(score, 0.1), 0.9),
            "features_used": len(feature_cols)
        }
    except Exception as e:
        return {"error": f"Random Forest prediction failed: {str(e)}"}

def simple_arima_prediction(data: pd.DataFrame, forecast_days: int) -> Dict:
    """Simplified ARIMA-like prediction"""
    try:
        close_prices = data['Close'].values
        
        # Simple differencing for stationarity
        diff_prices = np.diff(close_prices)
        
        # Use last few differences to predict future differences
        recent_diffs = diff_prices[-5:]
        avg_diff = np.mean(recent_diffs)
        
        # Predict future prices
        predictions = []
        last_price = close_prices[-1]
        
        for i in range(forecast_days):
            # Add some noise reduction
            next_diff = avg_diff * (0.95 ** i)  # Damping factor
            last_price += next_diff
            predictions.append(last_price)
        
        # Calculate prediction stability
        diff_std = np.std(recent_diffs)
        confidence = max(0.3, 1 - (diff_std / abs(avg_diff)) if avg_diff != 0 else 0.3)
        
        return {
            "method": "arima_simple",
            "predictions": predictions,
            "average_difference": float(avg_diff),
            "difference_std": float(diff_std),
            "confidence": min(confidence, 0.8)
        }
    except:
        return {"error": "ARIMA-like prediction failed"}

def create_ensemble_prediction(predictions: Dict, forecast_days: int) -> Dict:
    """Create ensemble prediction from multiple models"""
    try:
        valid_predictions = {}
        weights = {}
        
        # Collect valid predictions and their weights based on confidence
        for method, pred_data in predictions.items():
            if "predictions" in pred_data and "confidence" in pred_data:
                valid_predictions[method] = pred_data["predictions"]
                weights[method] = pred_data["confidence"]
        
        if not valid_predictions:
            return {"error": "No valid predictions to ensemble"}
        
        # Normalize weights
        total_weight = sum(weights.values())
        if total_weight > 0:
            weights = {k: v/total_weight for k, v in weights.items()}
        else:
            weights = {k: 1/len(weights) for k in weights.keys()}
        
        # Calculate weighted average predictions
        ensemble_pred = []
        for day in range(forecast_days):
            day_prediction = 0
            valid_methods = 0
            
            for method, preds in valid_predictions.items():
                if day < len(preds):
                    day_prediction += preds[day] * weights[method]
                    valid_methods += 1
            
            if valid_methods > 0:
                ensemble_pred.append(day_prediction)
            else:
                # If no prediction available, use last available
                ensemble_pred.append(ensemble_pred[-1] if ensemble_pred else 0)
        
        # Calculate ensemble confidence
        ensemble_confidence = sum(weights.values()) / len(weights)
        
        return {
            "method": "ensemble",
            "predictions": ensemble_pred,
            "component_weights": weights,
            "confidence": min(ensemble_confidence, 0.85),
            "methods_used": list(valid_predictions.keys())
        }
    except:
        return {"error": "Ensemble prediction failed"}

def calculate_prediction_confidence(data: pd.DataFrame, predictions: Dict) -> Dict:
    """Calculate confidence metrics for predictions"""
    try:
        # Volatility-based confidence
        recent_volatility = data['Close'].pct_change().tail(20).std()
        volatility_confidence = max(0.1, 1 - (recent_volatility * 10))  # Higher volatility = lower confidence
        
        # Trend consistency confidence
        close_prices = data['Close'].values
        trend_slope = np.polyfit(range(len(close_prices[-20:])), close_prices[-20:], 1)[0]
        trend_consistency = abs(trend_slope) / (np.std(close_prices[-20:]) + 1e-6)
        trend_confidence = min(trend_consistency, 1.0)
        
        # Model agreement
        valid_methods = sum(1 for pred in predictions.values() if "predictions" in pred)
        agreement_confidence = min(valid_methods / 4, 1.0)  # Higher when more models agree
        
        # Overall confidence
        overall_confidence = (volatility_confidence + trend_confidence + agreement_confidence) / 3
        
        return {
            "volatility_confidence": round(volatility_confidence, 3),
            "trend_confidence": round(trend_confidence, 3),
            "agreement_confidence": round(agreement_confidence, 3),
            "overall_confidence": round(overall_confidence, 3),
            "confidence_level": "high" if overall_confidence > 0.7 else "medium" if overall_confidence > 0.4 else "low"
        }
    except:
        return {"error": "Could not calculate confidence metrics"}

# =====================================
# Additional Helper Functions
# =====================================

def calculate_sma(data: pd.DataFrame, periods=[20, 50, 200]) -> Dict:
    """Calculate Simple Moving Averages"""
    sma_data = {}
    for period in periods:
        if len(data) >= period:
            sma_data[f"sma_{period}"] = data['Close'].rolling(window=period).mean().iloc[-1]
    return sma_data

def calculate_ema(data: pd.DataFrame, periods=[12, 26, 50]) -> Dict:
    """Calculate Exponential Moving Averages"""
    ema_data = {}
    for period in periods:
        if len(data) >= period:
            ema_data[f"ema_{period}"] = data['Close'].ewm(span=period).mean().iloc[-1]
    return ema_data

def calculate_rsi(data: pd.DataFrame, period=14) -> Dict:
    """Calculate RSI"""
    try:
        delta = data['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        
        return {
            "current": float(rsi.iloc[-1]),
            "signal": "oversold" if rsi.iloc[-1] < 30 else "overbought" if rsi.iloc[-1] > 70 else "neutral"
        }
    except:
        return {"error": "Could not calculate RSI"}

def calculate_macd(data: pd.DataFrame) -> Dict:
    """Calculate MACD"""
    try:
        ema_12 = data['Close'].ewm(span=12).mean()
        ema_26 = data['Close'].ewm(span=26).mean()
        macd = ema_12 - ema_26
        signal = macd.ewm(span=9).mean()
        histogram = macd - signal
        
        return {
            "macd": float(macd.iloc[-1]),
            "signal": float(signal.iloc[-1]),
            "histogram": float(histogram.iloc[-1]),
            "trend": "bullish" if macd.iloc[-1] > signal.iloc[-1] else "bearish"
        }
    except:
        return {"error": "Could not calculate MACD"}

def calculate_bollinger_bands(data: pd.DataFrame, period=20, std_dev=2) -> Dict:
    """Calculate Bollinger Bands"""
    try:
        sma = data['Close'].rolling(window=period).mean()
        std = data['Close'].rolling(window=period).std()
        
        upper_band = sma + (std * std_dev)
        lower_band = sma - (std * std_dev)
        
        current_price = data['Close'].iloc[-1]
        position = (current_price - lower_band.iloc[-1]) / (upper_band.iloc[-1] - lower_band.iloc[-1])
        
        return {
            "upper_band": float(upper_band.iloc[-1]),
            "middle_band": float(sma.iloc[-1]),
            "lower_band": float(lower_band.iloc[-1]),
            "position": float(position),
            "signal": "overbought" if position > 0.8 else "oversold" if position < 0.2 else "neutral"
        }
    except:
        return {"error": "Could not calculate Bollinger Bands"}

def calculate_stochastic(data: pd.DataFrame, k_period=14, d_period=3) -> Dict:
    """Calculate Stochastic Oscillator"""
    try:
        high_n = data['High'].rolling(window=k_period).max()
        low_n = data['Low'].rolling(window=k_period).min()
        
        k_percent = 100 * ((data['Close'] - low_n) / (high_n - low_n))
        d_percent = k_percent.rolling(window=d_period).mean()
        
        return {
            "k_percent": float(k_percent.iloc[-1]),
            "d_percent": float(d_percent.iloc[-1]),
            "signal": "oversold" if k_percent.iloc[-1] < 20 else "overbought" if k_percent.iloc[-1] > 80 else "neutral"
        }
    except:
        return {"error": "Could not calculate Stochastic"}

def calculate_williams_r(data: pd.DataFrame, period=14) -> Dict:
    """Calculate Williams %R"""
    try:
        high_n = data['High'].rolling(window=period).max()
        low_n = data['Low'].rolling(window=period).min()
        
        williams_r = -100 * ((high_n - data['Close']) / (high_n - low_n))
        
        return {
            "williams_r": float(williams_r.iloc[-1]),
            "signal": "oversold" if williams_r.iloc[-1] < -80 else "overbought" if williams_r.iloc[-1] > -20 else "neutral"
        }
    except:
        return {"error": "Could not calculate Williams %R"}

def calculate_cci(data: pd.DataFrame, period=20) -> Dict:
    """Calculate Commodity Channel Index"""
    try:
        typical_price = (data['High'] + data['Low'] + data['Close']) / 3
        sma_tp = typical_price.rolling(window=period).mean()
        mean_deviation = typical_price.rolling(window=period).apply(lambda x: np.mean(np.abs(x - x.mean())))
        
        cci = (typical_price - sma_tp) / (0.015 * mean_deviation)
        
        return {
            "cci": float(cci.iloc[-1]),
            "signal": "oversold" if cci.iloc[-1] < -100 else "overbought" if cci.iloc[-1] > 100 else "neutral"
        }
    except:
        return {"error": "Could not calculate CCI"}

def calculate_atr(data: pd.DataFrame, period=14) -> Dict:
    """Calculate Average True Range"""
    try:
        high_low = data['High'] - data['Low']
        high_close = np.abs(data['High'] - data['Close'].shift())
        low_close = np.abs(data['Low'] - data['Close'].shift())
        
        true_range = np.maximum(high_low, np.maximum(high_close, low_close))
        atr = true_range.rolling(window=period).mean()
        
        return {
            "atr": float(atr.iloc[-1]),
            "atr_percentage": float((atr.iloc[-1] / data['Close'].iloc[-1]) * 100)
        }
    except:
        return {"error": "Could not calculate ATR"}

def calculate_momentum(data: pd.DataFrame, period=10) -> Dict:
    """Calculate Price Momentum"""
    try:
        momentum = data['Close'] - data['Close'].shift(period)
        
        return {
            "momentum": float(momentum.iloc[-1]),
            "momentum_percentage": float((momentum.iloc[-1] / data['Close'].shift(period).iloc[-1]) * 100)
        }
    except:
        return {"error": "Could not calculate Momentum"}

def calculate_roc(data: pd.DataFrame, period=10) -> Dict:
    """Calculate Rate of Change"""
    try:
        roc = ((data['Close'] - data['Close'].shift(period)) / data['Close'].shift(period)) * 100
        
        return {
            "roc": float(roc.iloc[-1]),
            "signal": "bullish" if roc.iloc[-1] > 0 else "bearish"
        }
    except:
        return {"error": "Could not calculate ROC"}

def calculate_awesome_oscillator(data: pd.DataFrame) -> Dict:
    """Calculate Awesome Oscillator"""
    try:
        median_price = (data['High'] + data['Low']) / 2
        ao = median_price.rolling(window=5).mean() - median_price.rolling(window=34).mean()
        
        return {
            "awesome_oscillator": float(ao.iloc[-1]),
            "signal": "bullish" if ao.iloc[-1] > ao.iloc[-2] else "bearish"
        }
    except:
        return {"error": "Could not calculate Awesome Oscillator"}

def calculate_volume_sma(data: pd.DataFrame, period=20) -> Dict:
    """Calculate Volume Simple Moving Average"""
    try:
        volume_sma = data['Volume'].rolling(window=period).mean()
        
        return {
            "volume_sma": float(volume_sma.iloc[-1]),
            "current_vs_average": float(data['Volume'].iloc[-1] / volume_sma.iloc[-1])
        }
    except:
        return {"error": "Could not calculate Volume SMA"}

def calculate_vwap(data: pd.DataFrame) -> Dict:
    """Calculate Volume Weighted Average Price"""
    try:
        typical_price = (data['High'] + data['Low'] + data['Close']) / 3
        vwap = (typical_price * data['Volume']).cumsum() / data['Volume'].cumsum()
        
        return {
            "vwap": float(vwap.iloc[-1]),
            "price_vs_vwap": float((data['Close'].iloc[-1] / vwap.iloc[-1]) - 1) * 100
        }
    except:
        return {"error": "Could not calculate VWAP"}

def calculate_obv(data: pd.DataFrame) -> Dict:
    """Calculate On-Balance Volume"""
    try:
        obv = []
        obv_value = 0
        
        for i in range(len(data)):
            if i == 0:
                obv.append(obv_value)
            else:
                if data['Close'].iloc[i] > data['Close'].iloc[i-1]:
                    obv_value += data['Volume'].iloc[i]
                elif data['Close'].iloc[i] < data['Close'].iloc[i-1]:
                    obv_value -= data['Volume'].iloc[i]
                obv.append(obv_value)
        
        obv_series = pd.Series(obv)
        obv_trend = "bullish" if obv_series.iloc[-1] > obv_series.iloc[-10] else "bearish"
        
        return {
            "obv": float(obv_series.iloc[-1]),
            "obv_trend": obv_trend
        }
    except:
        return {"error": "Could not calculate OBV"}

def calculate_parabolic_sar(data: pd.DataFrame) -> Dict:
    """Calculate Parabolic SAR (simplified)"""
    try:
        # Simplified Parabolic SAR calculation
        af = 0.02  # Acceleration factor
        af_max = 0.2
        af_step = 0.02
        
        sar = [data['Low'].iloc[0]]
        trend = 1  # 1 for uptrend, -1 for downtrend
        ep = data['High'].iloc[0] if trend == 1 else data['Low'].iloc[0]
        
        for i in range(1, len(data)):
            sar_value = sar[-1] + af * (ep - sar[-1])
            
            if trend == 1:  # Uptrend
                if data['Low'].iloc[i] <= sar_value:
                    trend = -1
                    sar_value = ep
                    ep = data['Low'].iloc[i]
                    af = af_step
                else:
                    if data['High'].iloc[i] > ep:
                        ep = data['High'].iloc[i]
                        af = min(af + af_step, af_max)
            else:  # Downtrend
                if data['High'].iloc[i] >= sar_value:
                    trend = 1
                    sar_value = ep
                    ep = data['High'].iloc[i]
                    af = af_step
                else:
                    if data['Low'].iloc[i] < ep:
                        ep = data['Low'].iloc[i]
                        af = min(af + af_step, af_max)
            
            sar.append(sar_value)
        
        return {
            "parabolic_sar": float(sar[-1]),
            "trend": "bullish" if trend == 1 else "bearish",
            "signal": "buy" if data['Close'].iloc[-1] > sar[-1] else "sell"
        }
    except:
        return {"error": "Could not calculate Parabolic SAR"}

def calculate_ichimoku(data: pd.DataFrame) -> Dict:
    """Calculate Ichimoku Cloud (simplified)"""
    try:
        # Conversion Line (Tenkan-sen): (9-period high + 9-period low)/2
        tenkan_sen = (data['High'].rolling(window=9).max() + data['Low'].rolling(window=9).min()) / 2
        
        # Base Line (Kijun-sen): (26-period high + 26-period low)/2
        kijun_sen = (data['High'].rolling(window=26).max() + data['Low'].rolling(window=26).min()) / 2
        
        # Leading Span A: (Conversion Line + Base Line)/2
        senkou_span_a = (tenkan_sen + kijun_sen) / 2
        
        # Leading Span B: (52-period high + 52-period low)/2
        senkou_span_b = (data['High'].rolling(window=52).max() + data['Low'].rolling(window=52).min()) / 2
        
        return {
            "tenkan_sen": float(tenkan_sen.iloc[-1]),
            "kijun_sen": float(kijun_sen.iloc[-1]),
            "senkou_span_a": float(senkou_span_a.iloc[-1]),
            "senkou_span_b": float(senkou_span_b.iloc[-1]),
            "signal": "bullish" if data['Close'].iloc[-1] > max(senkou_span_a.iloc[-1], senkou_span_b.iloc[-1]) else "bearish"
        }
    except:
        return {"error": "Could not calculate Ichimoku"}

def generate_technical_signals(indicators: Dict, data: pd.DataFrame) -> Dict:
    """Generate current trading signals from technical indicators"""
    signals = {
        "overall_signal": "neutral",
        "signal_strength": 0,
        "bullish_signals": [],
        "bearish_signals": [],
        "neutral_signals": []
    }
    
    try:
        bullish_count = 0
        bearish_count = 0
        total_signals = 0
        
        # RSI signals
        if "rsi" in indicators and "current" in indicators["rsi"]:
            rsi_val = indicators["rsi"]["current"]
            total_signals += 1
            if rsi_val < 30:
                signals["bullish_signals"].append("RSI oversold")
                bullish_count += 1
            elif rsi_val > 70:
                signals["bearish_signals"].append("RSI overbought")
                bearish_count += 1
            else:
                signals["neutral_signals"].append("RSI neutral")
        
        # MACD signals
        if "macd" in indicators and "trend" in indicators["macd"]:
            total_signals += 1
            if indicators["macd"]["trend"] == "bullish":
                signals["bullish_signals"].append("MACD bullish")
                bullish_count += 1
            else:
                signals["bearish_signals"].append("MACD bearish")
                bearish_count += 1
        
        # Bollinger Bands signals
        if "bollinger_bands" in indicators and "signal" in indicators["bollinger_bands"]:
            bb_signal = indicators["bollinger_bands"]["signal"]
            total_signals += 1
            if bb_signal == "oversold":
                signals["bullish_signals"].append("Bollinger Bands oversold")
                bullish_count += 1
            elif bb_signal == "overbought":
                signals["bearish_signals"].append("Bollinger Bands overbought")
                bearish_count += 1
            else:
                signals["neutral_signals"].append("Bollinger Bands neutral")
        
        # Stochastic signals
        if "stochastic" in indicators and "signal" in indicators["stochastic"]:
            stoch_signal = indicators["stochastic"]["signal"]
            total_signals += 1
            if stoch_signal == "oversold":
                signals["bullish_signals"].append("Stochastic oversold")
                bullish_count += 1
            elif stoch_signal == "overbought":
                signals["bearish_signals"].append("Stochastic overbought")
                bearish_count += 1
            else:
                signals["neutral_signals"].append("Stochastic neutral")
        
        # Calculate overall signal
        if total_signals > 0:
            bullish_ratio = bullish_count / total_signals
            bearish_ratio = bearish_count / total_signals
            
            if bullish_ratio > 0.6:
                signals["overall_signal"] = "bullish"
                signals["signal_strength"] = bullish_ratio
            elif bearish_ratio > 0.6:
                signals["overall_signal"] = "bearish"
                signals["signal_strength"] = bearish_ratio
            else:
                signals["overall_signal"] = "neutral"
                signals["signal_strength"] = 0.5
        
        signals["total_indicators"] = total_signals
        signals["bullish_count"] = bullish_count
        signals["bearish_count"] = bearish_count
        
        return signals
        
    except Exception as e:
        return {"error": f"Could not generate signals: {str(e)}"}

# =====================================
# Sentiment Analysis Functions
# =====================================

def analyze_price_sentiment(data: pd.DataFrame) -> Dict:
    """Analyze sentiment based on price action"""
    try:
        close_prices = data['Close'].values
        
        # Price trend
        recent_slope = np.polyfit(range(len(close_prices[-10:])), close_prices[-10:], 1)[0]
        medium_slope = np.polyfit(range(len(close_prices[-20:])), close_prices[-20:], 1)[0]
        
        # Price momentum
        momentum_5 = (close_prices[-1] - close_prices[-6]) / close_prices[-6] if len(close_prices) > 5 else 0
        momentum_10 = (close_prices[-1] - close_prices[-11]) / close_prices[-11] if len(close_prices) > 10 else 0
        
        # Higher highs and higher lows analysis
        recent_highs = data['High'].tail(10).values
        recent_lows = data['Low'].tail(10).values
        
        higher_highs = sum(1 for i in range(1, len(recent_highs)) if recent_highs[i] > recent_highs[i-1])
        higher_lows = sum(1 for i in range(1, len(recent_lows)) if recent_lows[i] > recent_lows[i-1])
        
        # Sentiment score
        trend_sentiment = 1 if recent_slope > 0 else -1
        momentum_sentiment = (momentum_5 + momentum_10) / 2
        structure_sentiment = (higher_highs + higher_lows) / 18 - 0.5  # Normalize to -0.5 to 0.5
        
        overall_sentiment = (trend_sentiment + momentum_sentiment + structure_sentiment) / 3
        
        return {
            "trend_sentiment": "bullish" if recent_slope > 0 else "bearish",
            "momentum_5d": round(momentum_5 * 100, 2),
            "momentum_10d": round(momentum_10 * 100, 2),
            "higher_highs_ratio": round(higher_highs / 9, 2),
            "higher_lows_ratio": round(higher_lows / 9, 2),
            "sentiment_score": round(overall_sentiment, 3),
            "sentiment_label": "bullish" if overall_sentiment > 0.1 else "bearish" if overall_sentiment < -0.1 else "neutral"
        }
    except:
        return {"error": "Could not analyze price sentiment"}

def analyze_volume_sentiment(data: pd.DataFrame) -> Dict:
    """Analyze sentiment based on volume patterns"""
    try:
        volume = data['Volume'].values
        close = data['Close'].values
        
        # Volume trend
        avg_volume = np.mean(volume[-20:]) if len(volume) >= 20 else np.mean(volume)
        recent_volume = np.mean(volume[-5:])
        volume_ratio = recent_volume / avg_volume
        
        # Volume-price correlation
        price_changes = np.diff(close[-10:])
        volume_changes = volume[-9:]  # Align with price changes
        
        if len(price_changes) > 0 and len(volume_changes) > 0:
            # Separate up days and down days
            up_days_volume = np.mean([volume_changes[i] for i in range(len(price_changes)) if price_changes[i] > 0])
            down_days_volume = np.mean([volume_changes[i] for i in range(len(price_changes)) if price_changes[i] < 0])
            
            volume_bias = up_days_volume / (down_days_volume + 1) if down_days_volume > 0 else 2
        else:
            volume_bias = 1
        
        return {
            "volume_trend": "increasing" if volume_ratio > 1.1 else "decreasing" if volume_ratio < 0.9 else "stable",
            "volume_ratio": round(volume_ratio, 2),
            "volume_bias": round(volume_bias, 2),
            "sentiment": "bullish" if volume_ratio > 1.2 and volume_bias > 1.2 else "bearish" if volume_ratio > 1.2 and volume_bias < 0.8 else "neutral"
        }
    except:
        return {"error": "Could not analyze volume sentiment"}

def analyze_volatility_sentiment(data: pd.DataFrame) -> Dict:
    """Analyze sentiment based on volatility patterns"""
    try:
        returns = data['Close'].pct_change().dropna()
        
        # Current volatility vs historical
        recent_vol = returns.tail(10).std()
        historical_vol = returns.std()
        vol_ratio = recent_vol / historical_vol
        
        # Volatility trend
        vol_5d = returns.tail(5).std()
        vol_20d = returns.tail(20).std() if len(returns) >= 20 else historical_vol
        vol_trend = vol_5d / vol_20d
        
        # Risk sentiment
        if vol_ratio > 1.5:
            risk_sentiment = "high_fear"
        elif vol_ratio > 1.2:
            risk_sentiment = "elevated_concern"
        elif vol_ratio < 0.7:
            risk_sentiment = "complacency"
        else:
            risk_sentiment = "normal"
        
        return {
            "volatility_ratio": round(vol_ratio, 2),
            "volatility_trend": "increasing" if vol_trend > 1.1 else "decreasing",
            "risk_sentiment": risk_sentiment,
            "current_volatility": round(recent_vol * 100, 2),
            "historical_volatility": round(historical_vol * 100, 2)
        }
    except:
        return {"error": "Could not analyze volatility sentiment"}

def detect_market_regime(data: pd.DataFrame) -> Dict:
    """Detect current market regime"""
    try:
        close_prices = data['Close'].values
        
        # Trend analysis (multiple timeframes)
        short_trend = np.polyfit(range(10), close_prices[-10:], 1)[0]
        medium_trend = np.polyfit(range(20), close_prices[-20:], 1)[0] if len(close_prices) >= 20 else short_trend
        long_trend = np.polyfit(range(50), close_prices[-50:], 1)[0] if len(close_prices) >= 50 else medium_trend
        
        # Volatility regime
        returns = np.diff(close_prices) / close_prices[:-1]
        current_vol = np.std(returns[-20:]) if len(returns) >= 20 else np.std(returns)
        historical_vol = np.std(returns)
        
        # Determine regime
        if short_trend > 0 and medium_trend > 0 and long_trend > 0:
            if current_vol < historical_vol * 0.8:
                regime = "bull_market_low_vol"
            else:
                regime = "bull_market_high_vol"
        elif short_trend < 0 and medium_trend < 0 and long_trend < 0:
            if current_vol > historical_vol * 1.2:
                regime = "bear_market_high_vol"
            else:
                regime = "bear_market_low_vol"
        else:
            if current_vol > historical_vol * 1.5:
                regime = "choppy_high_vol"
            else:
                regime = "sideways_consolidation"
        
        return {
            "regime": regime,
            "short_term_trend": "up" if short_trend > 0 else "down",
            "medium_term_trend": "up" if medium_trend > 0 else "down",
            "long_term_trend": "up" if long_trend > 0 else "down",
            "volatility_regime": "high" if current_vol > historical_vol * 1.2 else "low" if current_vol < historical_vol * 0.8 else "normal"
        }
    except:
        return {"error": "Could not detect market regime"}

def calculate_fear_greed_indicators(data: pd.DataFrame) -> Dict:
    """Calculate fear and greed indicators"""
    try:
        close_prices = data['Close'].values
        volume = data['Volume'].values
        
        # Price momentum (greed indicator)
        momentum_score = ((close_prices[-1] - close_prices[-20]) / close_prices[-20]) * 100 if len(close_prices) >= 20 else 0
        
        # Volatility (fear indicator)
        returns = np.diff(close_prices) / close_prices[:-1]
        volatility_score = np.std(returns[-20:]) * 100 if len(returns) >= 20 else 0
        
        # Volume surge (can indicate both fear and greed)
        avg_volume = np.mean(volume[-50:]) if len(volume) >= 50 else np.mean(volume)
        recent_volume = np.mean(volume[-5:])
        volume_surge = (recent_volume / avg_volume - 1) * 100
        
        # RSI-like momentum
        gains = [max(0, r) for r in returns[-14:]] if len(returns) >= 14 else []
        losses = [max(0, -r) for r in returns[-14:]] if len(returns) >= 14 else []
        
        if len(gains) > 0 and len(losses) > 0:
            avg_gain = np.mean(gains)
            avg_loss = np.mean(losses)
            if avg_loss > 0:
                rsi_like = 100 - (100 / (1 + avg_gain / avg_loss))
            else:
                rsi_like = 100
        else:
            rsi_like = 50
        
        # Composite fear/greed score (0-100, 50 is neutral)
        # Higher = more greed, Lower = more fear
        greed_score = min(100, max(0, 50 + momentum_score - volatility_score + (rsi_like - 50) / 2))
        
        if greed_score > 75:
            sentiment = "extreme_greed"
        elif greed_score > 60:
            sentiment = "greed"
        elif greed_score > 40:
            sentiment = "neutral"
        elif greed_score > 25:
            sentiment = "fear"
        else:
            sentiment = "extreme_fear"
        
        return {
            "fear_greed_score": round(greed_score, 1),
            "sentiment": sentiment,
            "momentum_component": round(momentum_score, 2),
            "volatility_component": round(volatility_score, 2),
            "volume_surge": round(volume_surge, 2),
            "rsi_component": round(rsi_like, 1)
        }
    except:
        return {"error": "Could not calculate fear/greed indicators"}

def calculate_overall_sentiment(price_sentiment: Dict, volume_sentiment: Dict, volatility_sentiment: Dict) -> Dict:
    """Calculate overall market sentiment"""
    try:
        scores = []
        
        # Price sentiment score
        if "sentiment_score" in price_sentiment:
            scores.append(price_sentiment["sentiment_score"])
        
        # Volume sentiment score
        if "sentiment" in volume_sentiment:
            if volume_sentiment["sentiment"] == "bullish":
                scores.append(0.5)
            elif volume_sentiment["sentiment"] == "bearish":
                scores.append(-0.5)
            else:
                scores.append(0)
        
        # Volatility sentiment score (inverted for fear)
        if "risk_sentiment" in volatility_sentiment:
            if volatility_sentiment["risk_sentiment"] == "high_fear":
                scores.append(-0.7)
            elif volatility_sentiment["risk_sentiment"] == "elevated_concern":
                scores.append(-0.3)
            elif volatility_sentiment["risk_sentiment"] == "complacency":
                scores.append(0.3)
            else:
                scores.append(0)
        
        if scores:
            overall_score = np.mean(scores)
            
            if overall_score > 0.3:
                label = "bullish"
            elif overall_score < -0.3:
                label = "bearish"
            else:
                label = "neutral"
        else:
            overall_score = 0
            label = "neutral"
        
        return {
            "score": round(overall_score, 3),
            "label": label,
            "confidence": min(abs(overall_score) * 2, 1),
            "components_used": len(scores)
        }
    except:
        return {"error": "Could not calculate overall sentiment"}

# =====================================
# Support/Resistance Functions
# =====================================

def find_support_levels(data: pd.DataFrame, min_touches=2) -> List[Dict]:
    """Find support levels in price data"""
    try:
        lows = data['Low'].values
        support_levels = []
        
        # Find local minima
        for i in range(2, len(lows) - 2):
            if (lows[i] <= lows[i-1] and lows[i] <= lows[i+1] and
                lows[i] <= lows[i-2] and lows[i] <= lows[i+2]):
                
                # Count touches near this level
                touches = sum(1 for price in lows if abs(price - lows[i]) / lows[i] < 0.02)
                
                if touches >= min_touches:
                    support_levels.append({
                        "level": float(lows[i]),
                        "touches": touches,
                        "strength": touches * 10,  # Simple strength calculation
                        "date_index": i
                    })
        
        # Remove duplicate levels (within 1% of each other)
        filtered_levels = []
        for level in sorted(support_levels, key=lambda x: x["level"]):
            if not any(abs(level["level"] - existing["level"]) / existing["level"] < 0.01 
                      for existing in filtered_levels):
                filtered_levels.append(level)
        
        return sorted(filtered_levels, key=lambda x: x["strength"], reverse=True)[:5]
    except:
        return []

def find_resistance_levels(data: pd.DataFrame, min_touches=2) -> List[Dict]:
    """Find resistance levels in price data"""
    try:
        highs = data['High'].values
        resistance_levels = []
        
        # Find local maxima
        for i in range(2, len(highs) - 2):
            if (highs[i] >= highs[i-1] and highs[i] >= highs[i+1] and
                highs[i] >= highs[i-2] and highs[i] >= highs[i+2]):
                
                # Count touches near this level
                touches = sum(1 for price in highs if abs(price - highs[i]) / highs[i] < 0.02)
                
                if touches >= min_touches:
                    resistance_levels.append({
                        "level": float(highs[i]),
                        "touches": touches,
                        "strength": touches * 10,
                        "date_index": i
                    })
        
        # Remove duplicate levels
        filtered_levels = []
        for level in sorted(resistance_levels, key=lambda x: x["level"]):
            if not any(abs(level["level"] - existing["level"]) / existing["level"] < 0.01 
                      for existing in filtered_levels):
                filtered_levels.append(level)
        
        return sorted(filtered_levels, key=lambda x: x["strength"], reverse=True)[:5]
    except:
        return []

def find_dynamic_levels(data: pd.DataFrame) -> Dict:
    """Find dynamic support/resistance levels (moving averages, trend lines)"""
    try:
        close_prices = data['Close'].values
        
        # Moving averages as dynamic levels
        sma_20 = data['Close'].rolling(window=20).mean().iloc[-1] if len(data) >= 20 else None
        sma_50 = data['Close'].rolling(window=50).mean().iloc[-1] if len(data) >= 50 else None
        ema_20 = data['Close'].ewm(span=20).mean().iloc[-1] if len(data) >= 20 else None
        
        # Trend line (simplified)
        if len(close_prices) >= 20:
            slope, intercept = np.polyfit(range(20), close_prices[-20:], 1)
            trend_line_current = slope * 20 + intercept
            trend_line_future_5 = slope * 25 + intercept
        else:
            trend_line_current = None
            trend_line_future_5 = None
        
        dynamic_levels = {}
        
        if sma_20:
            dynamic_levels["sma_20"] = {
                "level": float(sma_20),
                "type": "support" if close_prices[-1] > sma_20 else "resistance"
            }
        
        if sma_50:
            dynamic_levels["sma_50"] = {
                "level": float(sma_50),
                "type": "support" if close_prices[-1] > sma_50 else "resistance"
            }
        
        if ema_20:
            dynamic_levels["ema_20"] = {
                "level": float(ema_20),
                "type": "support" if close_prices[-1] > ema_20 else "resistance"
            }
        
        if trend_line_current:
            dynamic_levels["trend_line"] = {
                "current_level": float(trend_line_current),
                "future_5d_level": float(trend_line_future_5),
                "slope": float(slope),
                "type": "support" if slope > 0 else "resistance"
            }
        
        return dynamic_levels
    except:
        return {}

def calculate_fibonacci_levels(data: pd.DataFrame) -> Dict:
    """Calculate Fibonacci retracement levels"""
    try:
        # Find swing high and low for last 50 periods
        recent_data = data.tail(50)
        swing_high = recent_data['High'].max()
        swing_low = recent_data['Low'].min()
        
        diff = swing_high - swing_low
        
        fib_levels = {
            "100.0": float(swing_high),
            "78.6": float(swing_high - 0.786 * diff),
            "61.8": float(swing_high - 0.618 * diff),
            "50.0": float(swing_high - 0.5 * diff),
            "38.2": float(swing_high - 0.382 * diff),
            "23.6": float(swing_high - 0.236 * diff),
            "0.0": float(swing_low)
        }
        
        # Identify current position
        current_price = float(data['Close'].iloc[-1])
        
        # Find nearest Fibonacci levels
        distances = {level: abs(current_price - price) for level, price in fib_levels.items()}
        nearest_level = min(distances, key=distances.get)
        
        return {
            "swing_high": float(swing_high),
            "swing_low": float(swing_low),
            "levels": fib_levels,
            "current_price": current_price,
            "nearest_level": nearest_level,
            "nearest_level_price": fib_levels[nearest_level],
            "distance_to_nearest": round(distances[nearest_level], 2)
        }
    except:
        return {}

def calculate_pivot_points(data: pd.DataFrame) -> Dict:
    """Calculate pivot points for day trading"""
    try:
        # Use last complete day's data
        last_day = data.iloc[-1]
        high = float(last_day['High'])
        low = float(last_day['Low'])
        close = float(last_day['Close'])
        
        # Standard pivot point calculation
        pivot = (high + low + close) / 3
        
        # Resistance levels
        r1 = 2 * pivot - low
        r2 = pivot + (high - low)
        r3 = high + 2 * (pivot - low)
        
        # Support levels
        s1 = 2 * pivot - high
        s2 = pivot - (high - low)
        s3 = low - 2 * (high - pivot)
        
        return {
            "pivot": round(pivot, 2),
            "resistance_1": round(r1, 2),
            "resistance_2": round(r2, 2),
            "resistance_3": round(r3, 2),
            "support_1": round(s1, 2),
            "support_2": round(s2, 2),
            "support_3": round(s3, 2),
            "based_on": {
                "high": high,
                "low": low,
                "close": close
            }
        }
    except:
        return {}

def analyze_level_strength(data: pd.DataFrame, support_levels: List[Dict], resistance_levels: List[Dict]) -> Dict:
    """Analyze the strength of support and resistance levels"""
    try:
        all_prices = np.concatenate([data['High'].values, data['Low'].values, data['Close'].values])
        
        level_analysis = {
            "support_strength": {},
            "resistance_strength": {},
            "overall_strength": "medium"
        }
        
        # Analyze support levels
        for level in support_levels:
            price = level["level"]
            # Count how many times price approached this level
            approaches = sum(1 for p in all_prices if abs(p - price) / price < 0.01)
            # Count how many times it held
            held_count = sum(1 for low in data['Low'].values if low >= price * 0.99)
            
            strength_score = (level["touches"] * 2 + approaches + held_count) / 10
            
            level_analysis["support_strength"][price] = {
                "score": round(strength_score, 2),
                "touches": level["touches"],
                "approaches": approaches,
                "held_ratio": round(held_count / len(data), 2),
                "strength": "strong" if strength_score > 0.7 else "medium" if strength_score > 0.4 else "weak"
            }
        
        # Analyze resistance levels
        for level in resistance_levels:
            price = level["level"]
            approaches = sum(1 for p in all_prices if abs(p - price) / price < 0.01)
            rejected_count = sum(1 for high in data['High'].values if high <= price * 1.01)
            
            strength_score = (level["touches"] * 2 + approaches + rejected_count) / 10
            
            level_analysis["resistance_strength"][price] = {
                "score": round(strength_score, 2),
                "touches": level["touches"],
                "approaches": approaches,
                "rejection_ratio": round(rejected_count / len(data), 2),
                "strength": "strong" if strength_score > 0.7 else "medium" if strength_score > 0.4 else "weak"
            }
        
        # Overall strength assessment
        strong_levels = sum(1 for analysis in level_analysis["support_strength"].values() if analysis["strength"] == "strong")
        strong_levels += sum(1 for analysis in level_analysis["resistance_strength"].values() if analysis["strength"] == "strong")
        
        total_levels = len(support_levels) + len(resistance_levels)
        
        if total_levels > 0:
            strong_ratio = strong_levels / total_levels
            if strong_ratio > 0.6:
                level_analysis["overall_strength"] = "strong"
            elif strong_ratio < 0.3:
                level_analysis["overall_strength"] = "weak"
        
        return level_analysis
    except:
        return {"error": "Could not analyze level strength"}

def analyze_current_position(current_price: float, support_levels: List[Dict], resistance_levels: List[Dict]) -> Dict:
    """Analyze current price position relative to support and resistance"""
    try:
        position_analysis = {
            "nearest_support": None,
            "nearest_resistance": None,
            "support_distance": None,
            "resistance_distance": None,
            "position_type": "neutral"
        }
        
        # Find nearest support below current price
        supports_below = [level for level in support_levels if level["level"] < current_price]
        if supports_below:
            nearest_support = max(supports_below, key=lambda x: x["level"])
            position_analysis["nearest_support"] = nearest_support["level"]
            position_analysis["support_distance"] = round(((current_price - nearest_support["level"]) / current_price) * 100, 2)
        
        # Find nearest resistance above current price
        resistances_above = [level for level in resistance_levels if level["level"] > current_price]
        if resistances_above:
            nearest_resistance = min(resistances_above, key=lambda x: x["level"])
            position_analysis["nearest_resistance"] = nearest_resistance["level"]
            position_analysis["resistance_distance"] = round(((nearest_resistance["level"] - current_price) / current_price) * 100, 2)
        
        # Determine position type
        if position_analysis["support_distance"] and position_analysis["resistance_distance"]:
            if position_analysis["support_distance"] < 2:
                position_analysis["position_type"] = "near_support"
            elif position_analysis["resistance_distance"] < 2:
                position_analysis["position_type"] = "near_resistance"
            elif position_analysis["support_distance"] < position_analysis["resistance_distance"]:
                position_analysis["position_type"] = "closer_to_support"
            else:
                position_analysis["position_type"] = "closer_to_resistance"
        
        return position_analysis
    except:
        return {"error": "Could not analyze current position"}

def identify_key_levels(support_levels: List[Dict], resistance_levels: List[Dict], current_price: float) -> Dict:
    """Identify the most important key levels"""
    try:
        # Sort by strength
        key_supports = sorted(support_levels, key=lambda x: x["strength"], reverse=True)[:3]
        key_resistances = sorted(resistance_levels, key=lambda x: x["strength"], reverse=True)[:3]
        
        # Find immediate levels (closest to current price)
        supports_below = [level for level in support_levels if level["level"] < current_price]
        resistances_above = [level for level in resistance_levels if level["level"] > current_price]
        
        immediate_support = max(supports_below, key=lambda x: x["level"]) if supports_below else None
        immediate_resistance = min(resistances_above, key=lambda x: x["level"]) if resistances_above else None
        
        return {
            "key_supports": [{"level": level["level"], "strength": level["strength"]} for level in key_supports],
            "key_resistances": [{"level": level["level"], "strength": level["strength"]} for level in key_resistances],
            "immediate_support": immediate_support["level"] if immediate_support else None,
            "immediate_resistance": immediate_resistance["level"] if immediate_resistance else None,
            "current_price": current_price
        }
    except:
        return {}

# =====================================
# Additional Utility Functions
# =====================================

def calculate_simple_obv(data: pd.DataFrame) -> List[float]:
    """Calculate simple On-Balance Volume"""
    obv = [0]
    for i in range(1, len(data)):
        if data['Close'].iloc[i] > data['Close'].iloc[i-1]:
            obv.append(obv[-1] + data['Volume'].iloc[i])
        elif data['Close'].iloc[i] < data['Close'].iloc[i-1]:
            obv.append(obv[-1] - data['Volume'].iloc[i])
        else:
            obv.append(obv[-1])
    return obv

def estimate_cycle_length(data: pd.DataFrame) -> Optional[int]:
    """Estimate market cycle length (simplified)"""
    try:
        close_prices = data['Close'].values
        
        # Find peaks and troughs
        peaks = []
        troughs = []
        
        for i in range(2, len(close_prices) - 2):
            if (close_prices[i] > close_prices[i-1] and close_prices[i] > close_prices[i+1] and
                close_prices[i] > close_prices[i-2] and close_prices[i] > close_prices[i+2]):
                peaks.append(i)
            
            if (close_prices[i] < close_prices[i-1] and close_prices[i] < close_prices[i+1] and
                close_prices[i] < close_prices[i-2] and close_prices[i] < close_prices[i+2]):
                troughs.append(i)
        
        # Calculate average distance between peaks and troughs
        if len(peaks) >= 2:
            peak_distances = [peaks[i] - peaks[i-1] for i in range(1, len(peaks))]
            avg_peak_distance = np.mean(peak_distances)
        else:
            avg_peak_distance = None
        
        if len(troughs) >= 2:
            trough_distances = [troughs[i] - troughs[i-1] for i in range(1, len(troughs))]
            avg_trough_distance = np.mean(trough_distances)
        else:
            avg_trough_distance = None
        
        # Estimate cycle length
        distances = [d for d in [avg_peak_distance, avg_trough_distance] if d is not None]
        if distances:
            return int(np.mean(distances))
        else:
            return None
    except:
        return None

def predict_support_resistance(data: pd.DataFrame, forecast_days: int) -> Dict:
    """Predict future support and resistance levels"""
    try:
        # Current levels
        current_supports = find_support_levels(data)
        current_resistances = find_resistance_levels(data)
        
        # Dynamic levels projection
        dynamic_levels = find_dynamic_levels(data)
        
        future_levels = {
            "projected_supports": [],
            "projected_resistances": [],
            "dynamic_projections": {}
        }
        
        # Project current static levels (they typically remain relevant)
        for support in current_supports[:3]:  # Top 3 supports
            future_levels["projected_supports"].append({
                "level": support["level"],
                "strength": support["strength"] * 0.9,  # Slightly reduce strength over time
                "type": "static"
            })
        
        for resistance in current_resistances[:3]:  # Top 3 resistances
            future_levels["projected_resistances"].append({
                "level": resistance["level"],
                "strength": resistance["strength"] * 0.9,
                "type": "static"
            })
        
        # Project dynamic levels (moving averages, trend lines)
        if "trend_line" in dynamic_levels and "future_5d_level" in dynamic_levels["trend_line"]:
            trend_projection = dynamic_levels["trend_line"]["future_5d_level"]
            future_levels["dynamic_projections"]["trend_line"] = {
                "level": trend_projection,
                "type": dynamic_levels["trend_line"]["type"]
            }
        
        # Project moving averages (simplified - assume they continue their current trend)
        if "sma_20" in dynamic_levels:
            # Simple projection based on recent trend
            recent_sma_change = 0  # Would need more sophisticated calculation
            future_levels["dynamic_projections"]["sma_20_projected"] = {
                "level": dynamic_levels["sma_20"]["level"] + recent_sma_change,
                "type": dynamic_levels["sma_20"]["type"]
            }
        
        return future_levels
    except:
        return {"error": "Could not predict future support/resistance"}

def analyze_current_trend(data: pd.DataFrame) -> Dict:
    """Analyze current trend characteristics"""
    try:
        close_prices = data['Close'].values
        
        # Multiple timeframe trends
        short_trend = np.polyfit(range(10), close_prices[-10:], 1)[0]
        medium_trend = np.polyfit(range(20), close_prices[-20:], 1)[0] if len(close_prices) >= 20 else short_trend
        long_trend = np.polyfit(range(50), close_prices[-50:], 1)[0] if len(close_prices) >= 50 else medium_trend
        
        # Trend strength
        short_r2 = calculate_trend_r_squared(close_prices[-10:])
        medium_r2 = calculate_trend_r_squared(close_prices[-20:]) if len(close_prices) >= 20 else short_r2
        
        # Trend consistency
        trend_changes = 0
        for i in range(1, min(20, len(close_prices))):
            if ((close_prices[-i] > close_prices[-i-1]) != (close_prices[-i-1] > close_prices[-i-2])):
                trend_changes += 1
        
        consistency = 1 - (trend_changes / min(19, len(close_prices) - 2))
        
        return {
            "short_term_slope": round(short_trend, 4),
            "medium_term_slope": round(medium_trend, 4),
            "long_term_slope": round(long_trend, 4),
            "short_term_strength": round(short_r2, 3),
            "medium_term_strength": round(medium_r2, 3),
            "trend_consistency": round(consistency, 3),
            "overall_direction": "uptrend" if medium_trend > 0 else "downtrend",
            "trend_quality": "strong" if medium_r2 > 0.7 and consistency > 0.7 else "moderate" if medium_r2 > 0.4 else "weak"
        }
    except:
        return {"error": "Could not analyze current trend"}

def calculate_trend_r_squared(prices: np.ndarray) -> float:
    """Calculate R-squared for trend line fit"""
    try:
        if len(prices) < 3:
            return 0
        
        x = np.arange(len(prices))
        slope, intercept = np.polyfit(x, prices, 1)
        predicted = slope * x + intercept
        
        ss_res = np.sum((prices - predicted) ** 2)
        ss_tot = np.sum((prices - np.mean(prices)) ** 2)
        
        if ss_tot == 0:
            return 1 if ss_res == 0 else 0
        
        return 1 - (ss_res / ss_tot)
    except:
        return 0

def forecast_volatility(data: pd.DataFrame, forecast_days: int) -> Dict:
    """Forecast future volatility"""
    try:
        returns = data['Close'].pct_change().dropna()
        
        # Historical volatility
        historical_vol = returns.std()
        
        # Recent volatility trend
        recent_vol = returns.tail(20).std() if len(returns) >= 20 else historical_vol
        vol_trend = (recent_vol - historical_vol) / historical_vol
        
        # Simple volatility forecast (mean reverting)
        forecast_vol = recent_vol * (1 + vol_trend * 0.1)  # Damped trend
        
        # Volatility clustering effect (simplified)
        high_vol_days = sum(1 for r in returns.tail(10) if abs(r) > recent_vol)
        clustering_factor = high_vol_days / 10
        
        # Adjust forecast based on clustering
        if clustering_factor > 0.3:
            forecast_vol *= 1.1  # Expect continued high volatility
        
        return {
            "current_volatility": round(recent_vol * 100, 2),
            "historical_volatility": round(historical_vol * 100, 2),
            "forecast_volatility": round(forecast_vol * 100, 2),
            "volatility_trend": "increasing" if vol_trend > 0.05 else "decreasing" if vol_trend < -0.05 else "stable",
            "clustering_factor": round(clustering_factor, 2),
            "forecast_period_days": forecast_days
        }
    except:
        return {"error": "Could not forecast volatility"}