// Stock Market Analyzer - SAFE VERSION (Individual Analysis Only)
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global DOM elements - initialized on DOM ready
let stockForm, loadingSpinner, resultsSection, errorAlert;
let summaryCard, detailedCard, analyzeBtn;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Market Analyzer initialized (SAFE MODE)');
    
    // Get DOM elements
    stockForm = document.getElementById('stockAnalysisForm');
    loadingSpinner = document.getElementById('loadingSpinner');
    resultsSection = document.getElementById('singleResultsSection') || document.getElementById('resultsSection');
    errorAlert = document.getElementById('errorAlert');
    summaryCard = document.getElementById('summaryCard');
    detailedCard = document.getElementById('detailedCard');
    analyzeBtn = document.getElementById('analyzeBtn');
    
    // Verify all elements exist
    const elements = {
        stockForm,
        loadingSpinner,
        resultsSection,
        errorAlert,
        analyzeBtn
    };
    
    const missing = Object.entries(elements)
        .filter(([, element]) => !element)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.error('Missing elements:', missing);
        alert('Error: Página no cargada correctamente. Elementos faltantes: ' + missing.join(', '));
        return;
    }
    
    console.log('✅ All elements found successfully');
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Form submission
    stockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await analyzeStock();
    });
    
    // Auto-uppercase stock symbol input
    const stockSymbolInput = document.getElementById('stockSymbol');
    if (stockSymbolInput) {
        stockSymbolInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

async function analyzeStock() {
    // Get form values
    const symbol = document.getElementById('stockSymbol').value.trim();
    const detailedOutput = document.getElementById('detailedOutput').checked;
    const periodNumber = document.getElementById('periodNumber').value;
    const periodUnit = document.getElementById('periodUnit').value;
    
    // Validate inputs
    if (!symbol) {
        showError('Por favor ingresa un símbolo de acción válido');
        return;
    }

    // Build period string
    const period = periodNumber + periodUnit;

    // Prepare request data
    const requestData = {
        symbol: symbol,
        detailed_output: detailedOutput,
        period: period
    };

    try {
        // Show loading state
        showLoading(true);
        hideError();
        hideResults();

        console.log('Making API request:', requestData);

        // Make API call
        const response = await fetch(`${API_BASE_URL}/stocks/analyze_decision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error en la respuesta del servidor');
        }

        console.log('Analysis result:', data);

        // Show results
        displayResults(data, detailedOutput);

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al conectar con el servidor. Verifica que el backend esté ejecutándose.');
    } finally {
        showLoading(false);
    }
}

function displayResults(data, isDetailed) {
    // Clear previous results
    const summaryContent = document.getElementById('summaryContent');
    const detailedContent = document.getElementById('detailedContent');
    
    if (summaryContent) {
        summaryContent.innerHTML = '';
    }
    if (detailedContent) {
        detailedContent.innerHTML = '';
    }

    // Show summary
    displaySummary(data);

    // Show detailed results if requested
    if (isDetailed && data.technical_indicators) {
        displayDetailedResults(data);
        if (detailedCard) {
            detailedCard.style.display = 'block';
        }
    } else {
        if (detailedCard) {
            detailedCard.style.display = 'none';
        }
    }

    // Show results section
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
}

function displaySummary(data) {
    const summaryContent = document.getElementById('summaryContent');
    
    if (!summaryContent) {
        console.error('Summary content element not found');
        return;
    }
    
    // Determine recommendation color
    const recommendationColor = getRecommendationColor(data.recommendation);
    const riskColor = getRiskColor(data.risk_level || 'MEDIO');

    summaryContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="text-center p-3 border rounded mb-3">
                    <h2 class="text-primary">${data.symbol}</h2>
                    <h4 class="text-muted">$${data.current_price}</h4>
                </div>
            </div>
            <div class="col-md-6">
                <div class="text-center p-3 border rounded mb-3">
                    <h5>Recomendación</h5>
                    <span class="badge ${recommendationColor} fs-6 p-2">${data.recommendation}</span>
                    <div class="mt-2">
                        <small class="text-muted">Confianza: ${data.confidence}%</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-4">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-target"></i> Precio de Entrada</h6>
                    <strong class="text-success">$${data.entry_price}</strong>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-shield-exclamation"></i> Stop Loss</h6>
                    <strong class="text-danger">$${data.stop_loss}</strong>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-bullseye"></i> Take Profit</h6>
                    <strong class="text-success">$${data.take_profit}</strong>
                </div>
            </div>
        </div>

        ${data.risk_level ? `
        <div class="row mt-3">
            <div class="col-md-6">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-exclamation-triangle"></i> Nivel de Riesgo</h6>
                    <span class="badge ${riskColor}">${data.risk_level}</span>
                </div>
            </div>
            <div class="col-md-6">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-clock"></i> Horizonte Temporal</h6>
                    <strong>${data.time_horizon}</strong>
                </div>
            </div>
        </div>
        ` : ''}

        ${data.key_reason ? `
        <div class="mt-3">
            <div class="alert alert-info">
                <h6><i class="bi bi-lightbulb"></i> Razón Principal</h6>
                <p class="mb-0">${data.key_reason}</p>
            </div>
        </div>
        ` : ''}
    `;
}

function displayDetailedResults(data) {
    const detailedContent = document.getElementById('detailedContent');
    
    if (!detailedContent) {
        console.error('Detailed content element not found');
        return;
    }
    
    detailedContent.innerHTML = `
        <!-- Technical Indicators -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-graph-up"></i> Indicadores Técnicos</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Indicador</th>
                                <th>Valor</th>
                                <th>Señal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>RSI</td>
                                <td>${data.technical_indicators.rsi.value}</td>
                                <td><span class="badge ${getSignalColor(data.technical_indicators.rsi.signal)}">${data.technical_indicators.rsi.signal}</span></td>
                            </tr>
                            <tr>
                                <td>MACD</td>
                                <td>${data.technical_indicators.macd.value}</td>
                                <td><span class="badge ${getSignalColor(data.technical_indicators.macd.signal)}">${data.technical_indicators.macd.signal}</span></td>
                            </tr>
                            <tr>
                                <td>Bollinger Position</td>
                                <td>${data.technical_indicators.bollinger_position.value}</td>
                                <td><span class="badge ${getSignalColor(data.technical_indicators.bollinger_position.signal)}">${data.technical_indicators.bollinger_position.signal}</span></td>
                            </tr>
                            <tr>
                                <td>Stochastic K</td>
                                <td>${data.technical_indicators.stochastic.k}</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td>Stochastic D</td>
                                <td>${data.technical_indicators.stochastic.d}</td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Momentum Analysis -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-speedometer2"></i> Análisis de Momentum</h6>
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Fuerza de Tendencia</small>
                            <div><strong>${data.momentum_analysis.trend_strength}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Score Momentum</small>
                            <div><strong>${data.momentum_analysis.momentum_score}%</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Confirmación Volumen</small>
                            <div><span class="badge ${getVolumeColor(data.momentum_analysis.volume_confirmation)}">${data.momentum_analysis.volume_confirmation}</span></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Ratio Volumen</small>
                            <div><strong>${data.momentum_analysis.volume_ratio}x</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Risk Metrics -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-shield"></i> Métricas de Riesgo</h6>
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>VaR 1-día 5%</small>
                            <div><strong>${data.risk_metrics['var_1day_5%']}%</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Sharpe Ratio</small>
                            <div><strong>${data.risk_metrics.sharpe_ratio}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Max Drawdown</small>
                            <div><strong>${data.risk_metrics.max_drawdown}%</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Volatilidad Diaria</small>
                            <div><strong>${data.risk_metrics.daily_volatility}%</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ML Insights -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-cpu"></i> Insights de Machine Learning</h6>
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center p-2 border rounded">
                            <small>Clasificación de Régimen</small>
                            <div><strong>${data.ml_insights.regime_classification}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center p-2 border rounded">
                            <small>Similitud de Patrón</small>
                            <div><strong>${data.ml_insights.pattern_similarity}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center p-2 border rounded">
                            <small>Dirección Forecast</small>
                            <div><strong>${data.ml_insights.forecast_direction}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Scoring Breakdown -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-bar-chart"></i> Desglose de Scoring</h6>
                <div class="row">
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Técnico</small>
                            <div><strong>${data.scoring_breakdown.technical_score}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Momentum</small>
                            <div><strong>${data.scoring_breakdown.momentum_score}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Riesgo</small>
                            <div><strong>${data.scoring_breakdown.risk_score}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Patrones</small>
                            <div><strong>${data.scoring_breakdown.pattern_score}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Volumen</small>
                            <div><strong>${data.scoring_breakdown.volume_score}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded bg-primary text-white">
                            <small>Final</small>
                            <div><strong>${data.scoring_breakdown.final_score}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reasoning -->
        ${data.reasoning && data.reasoning.length > 0 ? `
        <div class="row">
            <div class="col-12">
                <h6><i class="bi bi-list-check"></i> Razones del Análisis</h6>
                <ul class="list-group">
                    ${data.reasoning.map(reason => `<li class="list-group-item">${reason}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}
    `;
}

// Helper functions for styling
function getRecommendationColor(recommendation) {
    switch (recommendation) {
        case 'COMPRAR': return 'bg-success text-white';
        case 'VENDER': return 'bg-danger text-white';
        case 'MANTENER': return 'bg-warning text-dark';
        default: return 'bg-secondary text-white';
    }
}

function getRiskColor(riskLevel) {
    switch (riskLevel) {
        case 'BAJO': return 'bg-success text-white';
        case 'MEDIO': return 'bg-warning text-dark';
        case 'ALTO': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

function getSignalColor(signal) {
    if (signal.includes('bullish') || signal === 'oversold') return 'bg-success text-white';
    if (signal.includes('bearish') || signal === 'overbought') return 'bg-danger text-white';
    return 'bg-secondary text-white';
}

function getVolumeColor(confirmation) {
    switch (confirmation) {
        case 'strong': return 'bg-success text-white';
        case 'moderate': return 'bg-warning text-dark';
        case 'weak': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

// UI Helper functions
function showLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
    if (analyzeBtn) {
        analyzeBtn.disabled = show;
        analyzeBtn.innerHTML = show ? 
            '<i class="bi bi-hourglass-split"></i> Analizando...' : 
            '<i class="bi bi-search"></i> Analizar Acción';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorAlert) {
        errorAlert.style.display = 'block';
    }
}

function hideError() {
    if (errorAlert) {
        errorAlert.style.display = 'none';
    }
}

function hideResults() {
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
}