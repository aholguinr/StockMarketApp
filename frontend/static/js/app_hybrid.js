// Stock Market Analyzer - HYBRID VERSION (Individual + Toggle Only)
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global DOM elements - initialized on DOM ready
let stockForm, loadingSpinner, resultsSection, errorAlert;
let summaryCard, detailedCard, analyzeBtn;

// Multi-stock management
let selectedStocks = [];
const maxStocks = 10;

// Store last analysis data for re-rendering with different options
let lastAnalysisData = null;
let lastNormalizedValue = true;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Market Analyzer initialized (HYBRID MODE)');
    
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
    
    // Setup multi-stock toggle (if available)
    setupMultiStockToggle();
    
    // Setup multi-stock buttons (if available)
    setupMultiStockButtons();
    
    // Setup toggle listeners (if available)
    setupToggleListeners();
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

function setupMultiStockToggle() {
    const multiStockMode = document.getElementById('multiStockMode');
    if (multiStockMode) {
        console.log('✅ Multi-stock toggle found - setting up');
        multiStockMode.addEventListener('change', toggleAnalysisMode);
    } else {
        console.log('ℹ️ Multi-stock toggle not available');
    }
}

function setupMultiStockButtons() {
    // Setup multi-stock form submission
    const multiStockForm = document.getElementById('multiStockAnalysisForm');
    if (multiStockForm) {
        multiStockForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // CRITICAL: Prevent page reload
            console.log('Multi-stock form submitted');
            await analyzeMultipleStocks();
        });
        console.log('✅ Multi-stock form submission setup');
    }
    
    // Setup add stocks button
    const addStocksBtn = document.getElementById('addStocksBtn');
    if (addStocksBtn) {
        addStocksBtn.addEventListener('click', addStocksFromInput);
        console.log('✅ Add stocks button setup');
    }
    
    // Setup clear all button
    const clearAllStocksBtn = document.getElementById('clearAllStocksBtn');
    if (clearAllStocksBtn) {
        clearAllStocksBtn.addEventListener('click', clearAllStocks);
        console.log('✅ Clear all stocks button setup');
    }
    
    // Setup tech stocks button
    const addTechStocksBtn = document.getElementById('addTechStocksBtn');
    if (addTechStocksBtn) {
        addTechStocksBtn.addEventListener('click', () => addPredefinedStocks('tech'));
        console.log('✅ Tech stocks button setup');
    }
    
    // Setup blue chip button
    const addBlueChipBtn = document.getElementById('addBlueChipBtn');
    if (addBlueChipBtn) {
        addBlueChipBtn.addEventListener('click', () => addPredefinedStocks('bluechip'));
        console.log('✅ Blue chip stocks button setup');
    }
    
    // Setup multi-stock input with Enter key
    const multiStockInput = document.getElementById('multiStockInput');
    if (multiStockInput) {
        multiStockInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        multiStockInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addStocksFromInput();
            }
        });
        console.log('✅ Multi-stock input setup');
    }
    
    // Initialize display
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function setupToggleListeners() {
    // Remove normalize toggle - use table buttons instead
    
    // Detailed output toggle
    const detailedToggle = document.getElementById('multiDetailedOutput');
    if (detailedToggle) {
        detailedToggle.addEventListener('change', () => {
            console.log('🔄 Detailed toggle changed:', detailedToggle.checked);
            if (lastAnalysisData) {
                console.log('📊 Re-rendering with detailed =', detailedToggle.checked);
                toggleDetailedSections(detailedToggle.checked);
            }
        });
        console.log('✅ Detailed output toggle setup');
    }
    
    // Table view toggles (normalized vs raw values)
    const normalizedViewBtn = document.getElementById('normalizedView');
    const rawViewBtn = document.getElementById('rawView');
    
    if (normalizedViewBtn) {
        normalizedViewBtn.addEventListener('change', () => {
            if (normalizedViewBtn.checked && lastAnalysisData) {
                console.log('📊 Switching to normalized view');
                displayComparisonTable(convertToArray(lastAnalysisData.individual_results), true);
            }
        });
    }
    
    if (rawViewBtn) {
        rawViewBtn.addEventListener('change', () => {
            if (rawViewBtn.checked && lastAnalysisData) {
                console.log('📊 Switching to raw values view');
                displayComparisonTable(convertToArray(lastAnalysisData.individual_results), false);
            }
        });
    }
}

function toggleAnalysisMode() {
    const multiStockMode = document.getElementById('multiStockMode');
    if (!multiStockMode) return;
    
    const isMultiMode = multiStockMode.checked;
    console.log('Toggle mode to:', isMultiMode ? 'MULTI' : 'SINGLE');
    
    // Get form elements
    const singleForm = document.getElementById('singleStockForm');
    const multiForm = document.getElementById('multiStockForm');
    
    if (!singleForm || !multiForm) {
        console.error('Form elements not found');
        return;
    }
    
    // Toggle forms
    if (isMultiMode) {
        singleForm.style.display = 'none';
        multiForm.style.display = 'block';
        console.log('✅ Switched to MULTI-STOCK mode');
    } else {
        singleForm.style.display = 'block';
        multiForm.style.display = 'none';
        console.log('✅ Switched to SINGLE-STOCK mode');
    }
    
    // Hide ALL results when switching modes
    hideAllResults();
    hideError();
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
    const alertTitle = document.getElementById('alertTitle');
    const alertIcon = document.getElementById('alertIcon');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (alertTitle) {
        alertTitle.textContent = 'Error:';
    }
    if (alertIcon) {
        alertIcon.className = 'bi bi-exclamation-triangle';
    }
    if (errorAlert) {
        errorAlert.style.display = 'block';
        const alertDiv = errorAlert.querySelector('.alert');
        if (alertDiv) {
            alertDiv.className = 'alert alert-danger';
        }
    }
}

function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    const alertTitle = document.getElementById('alertTitle');
    const alertIcon = document.getElementById('alertIcon');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (alertTitle) {
        alertTitle.textContent = 'Éxito:';
    }
    if (alertIcon) {
        alertIcon.className = 'bi bi-check-circle';
    }
    if (errorAlert) {
        errorAlert.style.display = 'block';
        const alertDiv = errorAlert.querySelector('.alert');
        if (alertDiv) {
            alertDiv.className = 'alert alert-success';
        }
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

function hideAllResults() {
    // Hide single stock results
    const singleResults = singleResultsSection || document.getElementById('singleResultsSection') || document.getElementById('resultsSection');
    if (singleResults) {
        singleResults.style.display = 'none';
        console.log('🔄 Hidden single results');
    }
    
    // Hide multi-stock results
    const multiResults = document.getElementById('multiResultsSection');
    if (multiResults) {
        multiResults.style.display = 'none';
        console.log('🔄 Hidden multi-stock results');
    }
}

// =================== MULTI-STOCK MANAGEMENT ===================

function addStocksFromInput() {
    const input = document.getElementById('multiStockInput');
    if (!input || !input.value.trim()) {
        console.log('No input or empty value');
        return;
    }
    
    // Split by comma and clean up
    const newStocks = input.value.trim().split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    console.log('Adding stocks:', newStocks);
    
    // Add each valid stock
    newStocks.forEach(stock => {
        if (stock && !selectedStocks.includes(stock) && selectedStocks.length < maxStocks) {
            selectedStocks.push(stock);
            console.log('Added stock:', stock);
        }
    });
    
    // Clear input
    input.value = '';
    
    // Update display
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function removeStock(symbol) {
    console.log('Removing stock:', symbol);
    selectedStocks = selectedStocks.filter(s => s !== symbol);
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function clearAllStocks() {
    console.log('Clearing all stocks');
    selectedStocks = [];
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function addPredefinedStocks(type) {
    let stocks = [];
    
    if (type === 'tech') {
        stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];
    } else if (type === 'bluechip') {
        stocks = ['AAPL', 'MSFT', 'JNJ', 'V', 'PG'];
    }
    
    console.log('Adding predefined stocks:', type, stocks);
    
    // Add stocks that aren't already selected and don't exceed limit
    stocks.forEach(stock => {
        if (!selectedStocks.includes(stock) && selectedStocks.length < maxStocks) {
            selectedStocks.push(stock);
        }
    });
    
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function updateSelectedStocksList() {
    const stocksList = document.getElementById('selectedStocksList');
    const counter = document.getElementById('stockCounter');
    
    if (!stocksList || !counter) {
        console.log('Selected stocks elements not found');
        return;
    }
    
    // Update counter
    counter.textContent = `${selectedStocks.length}/${maxStocks}`;
    
    if (selectedStocks.length === 0) {
        stocksList.innerHTML = `
            <div class="text-muted text-center">
                <i class="bi bi-info-circle"></i>
                Agrega acciones para comenzar el análisis
            </div>
        `;
        return;
    }
    
    // Create stock badges
    const stockBadges = selectedStocks.map(stock => `
        <span class="badge bg-primary me-2 mb-2 p-2">
            ${stock}
            <button type="button" class="btn-close btn-close-white ms-2" 
                    onclick="removeStock('${stock}')" style="font-size: 0.7em;"></button>
        </span>
    `).join('');
    
    stocksList.innerHTML = stockBadges;
    console.log('Updated stocks list:', selectedStocks);
}

function updateAnalyzeButton() {
    const button = document.getElementById('analyzeMultiBtn');
    if (button) {
        button.disabled = selectedStocks.length === 0;
        console.log('Updated analyze button, disabled:', selectedStocks.length === 0);
    }
}

async function analyzeMultipleStocks() {
    console.log('🔄 Starting multi-stock analysis for:', selectedStocks);
    
    if (selectedStocks.length === 0) {
        showError('Por favor selecciona al menos una acción para analizar');
        return;
    }
    
    // Get form values
    const normalizeValues = true; // Default to normalized view
    const detailedOutput = document.getElementById('multiDetailedOutput')?.checked || true;
    const periodNumber = document.getElementById('multiPeriodNumber')?.value || '6';
    const periodUnit = document.getElementById('multiPeriodUnit')?.value || 'mo';
    
    // Build period string
    const period = periodNumber + periodUnit;
    
    // Prepare request data
    const requestData = {
        symbols: selectedStocks,
        detailed_output: detailedOutput,
        period: period,
        normalize_values: normalizeValues
    };
    
    try {
        // Show loading state
        showMultiLoading(true);
        hideError();
        hideResults();
        
        console.log('Making multi-stock API request:', requestData);
        
        // Make API call
        const response = await fetch(`${API_BASE_URL}/stocks/analyze_multiple`, {
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
        
        console.log('✅ Multi-stock analysis result:', data);
        
        // Store data for toggle functionality
        lastAnalysisData = data;
        lastNormalizedValue = normalizeValues;
        
        // Display the actual results
        displayMultiStockResults(data, normalizeValues);
        
        // Show success message briefly, then hide it
        showSuccess(`Análisis completado para ${selectedStocks.length} acciones: ${selectedStocks.join(', ')}`);
        setTimeout(hideError, 3000); // Hide success message after 3 seconds
        
    } catch (error) {
        console.error('❌ Multi-stock analysis error:', error);
        showError(`Error en análisis multi-stock: ${error.message}`);
    } finally {
        showMultiLoading(false);
    }
}

function showMultiLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const button = document.getElementById('analyzeMultiBtn');
    
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
        const text = spinner.querySelector('span');
        if (text) {
            text.textContent = show ? 'Analizando múltiples acciones...' : 'Cargando...';
        }
    }
    
    if (button) {
        button.disabled = show;
        button.innerHTML = show ? 
            '<i class="bi bi-hourglass-split"></i> Analizando...' : 
            '<i class="bi bi-search"></i> Analizar Acciones';
    }
}

function displayMultiStockResults(data, normalized) {
    console.log('📊 Displaying multi-stock results:', data);
    
    // Show multi-stock results section
    const multiResultsSection = document.getElementById('multiResultsSection');
    if (multiResultsSection) {
        multiResultsSection.style.display = 'block';
        console.log('✅ Multi-results section shown');
    } else {
        console.log('⚠️ Multi-results section not found, using alternative display');
        displaySimpleResults(data);
        return;
    }
    
    // Convert individual_results to array format expected by display functions
    const individualAnalyses = [];
    if (data.individual_results) {
        Object.values(data.individual_results).forEach(result => {
            individualAnalyses.push(result);
            console.log('📊 Individual analysis data for', result.symbol, ':', {
                risk_level: result.risk_level,
                time_horizon: result.time_horizon,
                period: result.period,
                key_reason: result.key_reason,
                reasoning: result.reasoning,
                allFields: Object.keys(result)
            });
        });
        console.log('📊 Converted individual results:', individualAnalyses);
    }
    
    // Display global recommendation using the correct API structure
    if (data.global_recommendations && data.global_recommendations.summary) {
        const globalRec = {
            recommendation: data.global_recommendations.summary.overall_recommendation,
            confidence: Math.round(data.global_recommendations.portfolio_score),
            overall_score: data.global_recommendations.portfolio_score,
            reasoning: `Mejor opción: ${data.global_recommendations.summary.best_pick}. Fortaleza del portfolio: ${data.global_recommendations.summary.portfolio_strength}`
        };
        displayGlobalRecommendation(globalRec);
        console.log('📊 Displaying global recommendation:', globalRec);
    }
    
    // Display comparison table
    if (individualAnalyses.length > 0) {
        displayComparisonTable(individualAnalyses, normalized);
        console.log('📊 Displaying comparison table with', individualAnalyses.length, 'stocks');
    }
    
    // Display portfolio summary using the API data
    if (data.global_recommendations && data.global_recommendations.summary) {
        const portfolioSummary = {
            diversification_score: data.global_recommendations.summary.diversification_score,
            risk_level: data.global_recommendations.summary.portfolio_strength,
            expected_return: `${data.global_recommendations.portfolio_score.toFixed(1)}%`,
            time_horizon: data.period || 'Corto plazo'
        };
        displayPortfolioSummary(portfolioSummary);
        console.log('📊 Displaying portfolio summary:', portfolioSummary);
    }
    
    // Display individual stock details (ALWAYS show)
    if (individualAnalyses.length > 0) {
        displayIndividualDetails(individualAnalyses);
        console.log('📊 Displaying individual details for', individualAnalyses.length, 'stocks');
        
        // Ensure individual details card is always visible
        const individualDetailsCard = document.getElementById('individualDetailsCard');
        if (individualDetailsCard) {
            individualDetailsCard.style.display = 'block';
        }
    }
    
    // Apply detailed sections toggle based on current setting
    const detailedToggle = document.getElementById('multiDetailedOutput');
    if (detailedToggle) {
        toggleDetailedSections(detailedToggle.checked);
    }
}

function displaySimpleResults(data) {
    // Simple fallback display using the existing results section
    const summaryContent = document.getElementById('summaryContent');
    if (!summaryContent) return;
    
    let html = '<div class="alert alert-info"><h5>📊 Resultados Multi-Stock</h5>';
    
    // Use correct API structure for global recommendation
    if (data.global_recommendations && data.global_recommendations.summary) {
        const rec = data.global_recommendations.summary;
        html += `<div class="mb-3">
            <strong>Recomendación Global:</strong> 
            <span class="badge ${getRecommendationColor(rec.overall_recommendation)}">${rec.overall_recommendation}</span>
            <br><small>Score Portfolio: ${data.global_recommendations.portfolio_score.toFixed(1)}%</small>
            <br><small>Mejor opción: ${rec.best_pick}</small>
        </div>`;
    }
    
    // Use correct API structure for individual results
    if (data.individual_results) {
        html += '<div class="table-responsive"><table class="table table-sm">';
        html += '<thead><tr><th>Acción</th><th>Precio</th><th>Recomendación</th><th>Confianza</th><th>Score</th></tr></thead><tbody>';
        
        Object.values(data.individual_results).forEach(analysis => {
            html += `<tr>
                <td><strong>${analysis.symbol}</strong></td>
                <td>$${analysis.current_price}</td>
                <td><span class="badge ${getRecommendationColor(analysis.recommendation)}">${analysis.recommendation}</span></td>
                <td>${analysis.confidence}%</td>
                <td>${analysis.scoring_breakdown?.final_score || 'N/A'}</td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
    }
    
    html += '</div>';
    summaryContent.innerHTML = html;
    
    // Show the results section
    if (resultsSection) {
        resultsSection.style.display = 'block';
    }
}

function displayGlobalRecommendation(globalRec) {
    const content = document.getElementById('globalRecommendationContent');
    if (!content) return;
    
    const recommendationColor = getRecommendationColor(globalRec.recommendation);
    
    content.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <div class="d-flex align-items-center mb-3">
                    <div class="me-4">
                        <h3>
                            <span class="badge ${recommendationColor} fs-4 p-3">
                                ${globalRec.recommendation}
                            </span>
                        </h3>
                        <small class="text-muted">Recomendación del Portfolio</small>
                    </div>
                    <div>
                        <h5>Confianza: ${globalRec.confidence}%</h5>
                        <small class="text-muted">Score Global: ${globalRec.overall_score || 'N/A'}/100</small>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6>Resumen</h6>
                        <p class="small">${globalRec.reasoning || 'Análisis basado en múltiples indicadores técnicos y fundamentales.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayComparisonTable(analyses, normalized) {
    const tableBody = document.getElementById('comparisonTableBody');
    if (!tableBody) return;
    
    console.log('📊 Displaying comparison table, normalized:', normalized);
    
    // Sort by final score descending
    const sortedAnalyses = [...analyses].sort((a, b) => {
        const scoreA = parseFloat(b.scoring_breakdown?.final_score || 0);
        const scoreB = parseFloat(a.scoring_breakdown?.final_score || 0);
        return scoreA - scoreB;
    });
    
    tableBody.innerHTML = sortedAnalyses.map(analysis => {
        const recommendationColor = getRecommendationColor(analysis.recommendation);
        const riskColor = getRiskColor(analysis.risk_level || 'MEDIO');
        
        // Use normalized base 100 or raw values based on toggle
        let priceDisplay, stopLossDisplay, takeProfitDisplay;
        
        if (normalized) {
            // Normalize all prices to base 100
            const basePrice = analysis.current_price;
            const normalizedPrice = 100;
            const normalizedStopLoss = (analysis.stop_loss * 100 / basePrice).toFixed(1);
            const normalizedTakeProfit = (analysis.take_profit * 100 / basePrice).toFixed(1);
            
            const stopLossPercent = ((analysis.stop_loss - basePrice) / basePrice * 100).toFixed(1);
            const takeProfitPercent = ((analysis.take_profit - basePrice) / basePrice * 100).toFixed(1);
            
            priceDisplay = `100.0 <small class="text-muted">($${analysis.current_price})</small>`;
            stopLossDisplay = `${normalizedStopLoss} <small class="text-danger">(${stopLossPercent}%)</small>`;
            takeProfitDisplay = `${normalizedTakeProfit} <small class="text-success">(+${takeProfitPercent}%)</small>`;
        } else {
            // Show raw dollar values
            priceDisplay = `$${analysis.current_price}`;
            stopLossDisplay = `$${analysis.stop_loss}`;
            takeProfitDisplay = `$${analysis.take_profit}`;
        }
        
        return `
            <tr>
                <td><strong>${analysis.symbol}</strong></td>
                <td>${priceDisplay}</td>
                <td><span class="badge ${recommendationColor}">${analysis.recommendation}</span></td>
                <td>${analysis.confidence}%</td>
                <td><strong>${analysis.scoring_breakdown?.final_score || 'N/A'}</strong></td>
                <td><span class="badge ${riskColor}">${analysis.risk_level || 'MEDIO'}</span></td>
                <td>${stopLossDisplay}</td>
                <td>${takeProfitDisplay}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="showStockDetails('${analysis.symbol}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Update table view buttons to reflect current state
    updateTableViewButtons(normalized);
}

function updateTableViewButtons(normalized) {
    const normalizedBtn = document.getElementById('normalizedView');
    const rawBtn = document.getElementById('rawView');
    
    if (normalizedBtn && rawBtn) {
        normalizedBtn.checked = normalized;
        rawBtn.checked = !normalized;
        console.log('🔄 Table view buttons updated:', normalized ? 'normalized' : 'raw');
    }
}

function displayPortfolioSummary(portfolioSummary) {
    const elements = {
        diversificationScore: document.getElementById('diversificationScore'),
        portfolioRisk: document.getElementById('portfolioRisk'),
        portfolioPotential: document.getElementById('portfolioPotential'),
        portfolioTimeframe: document.getElementById('portfolioTimeframe')
    };
    
    if (elements.diversificationScore) elements.diversificationScore.textContent = portfolioSummary.diversification_score || 'N/A';
    if (elements.portfolioRisk) elements.portfolioRisk.textContent = portfolioSummary.risk_level || 'MEDIO';
    if (elements.portfolioPotential) elements.portfolioPotential.textContent = portfolioSummary.expected_return || 'N/A';
    if (elements.portfolioTimeframe) elements.portfolioTimeframe.textContent = portfolioSummary.time_horizon || 'Medio plazo';
}

function displayIndividualDetails(analyses) {
    const content = document.getElementById('individualDetailsContent');
    if (!content) {
        console.log('❌ Individual details content element not found');
        return;
    }
    
    console.log('📊 Creating individual details for:', analyses);
    
    const detailsHtml = analyses.map(analysis => {
        console.log('📊 Processing analysis for', analysis.symbol, ':', analysis);
        
        return `
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">
                    <i class="bi bi-graph-up"></i>
                    ${analysis.symbol} - ${analysis.recommendation}
                </h6>
                <span class="badge bg-primary">${analysis.scoring_breakdown?.final_score || analysis.final_score || 'N/A'}</span>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <small><strong>Precio Actual:</strong> $${analysis.current_price}</small><br>
                        <small><strong>Precio de Entrada:</strong> $${analysis.entry_price}</small><br>
                        <small><strong>Stop Loss:</strong> $${analysis.stop_loss}</small><br>
                        <small><strong>Take Profit:</strong> $${analysis.take_profit}</small>
                    </div>
                    <div class="col-md-6">
                        <small><strong>Confianza:</strong> ${analysis.confidence}%</small><br>
                        <small><strong>Riesgo:</strong> ${analysis.risk_level || lastAnalysisData?.risk_level || 'MEDIO'}</small><br>
                        <small><strong>Horizonte:</strong> ${analysis.time_horizon || getTimeHorizonFromPeriod(lastAnalysisData?.period)}</small><br>
                        <small><strong>Período:</strong> ${lastAnalysisData?.period || analysis.period || 'N/A'}</small>
                    </div>
                </div>
                ${analysis.key_reason ? `
                <div class="mt-2">
                    <small><strong>Razón Principal:</strong> ${analysis.key_reason}</small>
                </div>
                ` : ''}
                ${analysis.reasoning && analysis.reasoning.length > 0 ? `
                <div class="mt-2">
                    <small><strong>Análisis:</strong></small>
                    <ul class="small mt-1">
                        ${analysis.reasoning.slice(0, 3).map(reason => `<li>${reason}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
        `;
    }).join('');
    
    content.innerHTML = detailsHtml;
    console.log('✅ Individual details HTML set');
}

function toggleDetailedSections(showDetailed) {
    // Toggle detailed technical analysis table
    const detailedAnalysisCard = document.getElementById('detailedAnalysisCard');
    if (detailedAnalysisCard) {
        detailedAnalysisCard.style.display = showDetailed ? 'block' : 'none';
        console.log('🔄 Detailed technical analysis table:', showDetailed ? 'shown' : 'hidden');
    }
    
    // Individual details section ALWAYS stays visible
    const individualDetailsCard = document.getElementById('individualDetailsCard');
    if (individualDetailsCard) {
        individualDetailsCard.style.display = 'block';
        console.log('🔄 Individual details section: always visible');
    }
    
    // If showing detailed, populate the technical analysis table
    if (showDetailed && lastAnalysisData) {
        displayDetailedTechnicalTable(convertToArray(lastAnalysisData.individual_results));
    }
}

function convertToArray(individualResults) {
    if (!individualResults) return [];
    return Object.values(individualResults);
}

function getTimeHorizonFromPeriod(period) {
    if (!period) return 'Medio plazo';
    
    if (period.includes('1mo') || period.includes('2mo') || period.includes('3mo')) {
        return 'Corto plazo';
    } else if (period.includes('6mo') || period.includes('9mo') || period.includes('12mo')) {
        return 'Medio plazo';
    } else if (period.includes('y') || period.includes('2y')) {
        return 'Largo plazo';
    }
    
    return 'Medio plazo';
}

function displayDetailedTechnicalTable(analyses) {
    const tableBody = document.getElementById('detailedAnalysisTableBody');
    if (!tableBody) {
        console.log('❌ Detailed analysis table body not found');
        return;
    }
    
    console.log('📊 Creating detailed technical table for:', analyses);
    
    tableBody.innerHTML = analyses.map(analysis => {
        // Extract technical indicators (with fallbacks)
        const tech = analysis.technical_indicators || {};
        const momentum = analysis.momentum_analysis || {};
        const risk = analysis.risk_metrics || {};
        const ml = analysis.ml_insights || {};
        
        return `
            <tr>
                <td><strong>${analysis.symbol}</strong></td>
                <td>
                    ${tech.rsi?.value || 'N/A'}
                    ${tech.rsi?.signal ? `<br><small class="badge ${getSignalColor(tech.rsi.signal)}">${tech.rsi.signal}</small>` : ''}
                </td>
                <td>
                    ${tech.macd?.value || 'N/A'}
                    ${tech.macd?.signal ? `<br><small class="badge ${getSignalColor(tech.macd.signal)}">${tech.macd.signal}</small>` : ''}
                </td>
                <td>
                    ${tech.bollinger_position?.value || 'N/A'}
                    ${tech.bollinger_position?.signal ? `<br><small class="badge ${getSignalColor(tech.bollinger_position.signal)}">${tech.bollinger_position.signal}</small>` : ''}
                </td>
                <td>${tech.stochastic?.k || 'N/A'}</td>
                <td>${tech.stochastic?.d || 'N/A'}</td>
                <td>
                    ${momentum.momentum_score || 'N/A'}%
                    ${momentum.trend_strength ? `<br><small>${momentum.trend_strength}</small>` : ''}
                </td>
                <td>${risk['var_1day_5%'] || 'N/A'}%</td>
                <td>${risk.sharpe_ratio || 'N/A'}</td>
                <td>${risk.daily_volatility || 'N/A'}%</td>
                <td>
                    ${ml.regime_classification || 'N/A'}
                    ${ml.forecast_direction ? `<br><small>${ml.forecast_direction}</small>` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('✅ Detailed technical table populated');
}

function showStockDetails(symbol) {
    console.log('🔍 Showing detailed modal for:', symbol);
    
    if (!lastAnalysisData || !lastAnalysisData.individual_results) {
        console.error('❌ No analysis data available for modal');
        return;
    }
    
    // Find the specific stock data
    const stockData = lastAnalysisData.individual_results[symbol];
    if (!stockData) {
        console.error('❌ No data found for symbol:', symbol);
        return;
    }
    
    console.log('📊 Stock data for modal:', stockData);
    
    // Update modal title
    const modalTitle = document.getElementById('modalStockSymbol');
    if (modalTitle) {
        modalTitle.textContent = symbol;
    }
    
    // Display summary in modal (reuse existing function)
    displayModalSummary(stockData);
    
    // Display detailed analysis in modal (reuse existing function)
    displayModalDetailedAnalysis(stockData);
    
    // Setup "Analyze Again" button
    setupModalAnalyzeButton(symbol);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('stockDetailModal'));
    modal.show();
    
    console.log('✅ Modal displayed for', symbol);
}

function displayModalSummary(stockData) {
    const modalSummaryContent = document.getElementById('modalSummaryContent');
    if (!modalSummaryContent) {
        console.error('❌ Modal summary content not found');
        return;
    }
    
    const recommendationColor = getRecommendationColor(stockData.recommendation);
    const riskColor = getRiskColor(stockData.risk_level || 'MEDIO');
    
    modalSummaryContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="text-center p-3 border rounded mb-3">
                    <h3 class="text-primary">${stockData.symbol}</h3>
                    <h4 class="text-muted">$${stockData.current_price}</h4>
                </div>
            </div>
            <div class="col-md-6">
                <div class="text-center p-3 border rounded mb-3">
                    <h6>Recomendación</h6>
                    <span class="badge ${recommendationColor} fs-5 p-2">${stockData.recommendation}</span>
                    <div class="mt-2">
                        <small class="text-muted">Confianza: ${stockData.confidence}%</small>
                    </div>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-md-4">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-target"></i> Precio de Entrada</h6>
                    <strong class="text-success">$${stockData.entry_price}</strong>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-shield-exclamation"></i> Stop Loss</h6>
                    <strong class="text-danger">$${stockData.stop_loss}</strong>
                </div>
            </div>
            <div class="col-md-4">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-bullseye"></i> Take Profit</h6>
                    <strong class="text-success">$${stockData.take_profit}</strong>
                </div>
            </div>
        </div>

        ${stockData.risk_level ? `
        <div class="row mt-3">
            <div class="col-md-6">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-exclamation-triangle"></i> Nivel de Riesgo</h6>
                    <span class="badge ${riskColor}">${stockData.risk_level}</span>
                </div>
            </div>
            <div class="col-md-6">
                <div class="text-center p-3 border rounded">
                    <h6><i class="bi bi-clock"></i> Horizonte Temporal</h6>
                    <strong>${stockData.time_horizon || getTimeHorizonFromPeriod(lastAnalysisData?.period)}</strong>
                </div>
            </div>
        </div>
        ` : ''}

        ${stockData.key_reason ? `
        <div class="mt-3">
            <div class="alert alert-info">
                <h6><i class="bi bi-lightbulb"></i> Razón Principal</h6>
                <p class="mb-0">${stockData.key_reason}</p>
            </div>
        </div>
        ` : ''}
    `;
    
    console.log('✅ Modal summary content populated');
}

function displayModalDetailedAnalysis(stockData) {
    const modalDetailedContent = document.getElementById('modalDetailedContent');
    if (!modalDetailedContent) {
        console.error('❌ Modal detailed content not found');
        return;
    }
    
    // Only show detailed analysis if technical indicators are available
    if (!stockData.technical_indicators) {
        modalDetailedContent.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                Análisis detallado no disponible. Para ver el análisis completo, 
                activa la opción "Análisis Detallado" antes de ejecutar el análisis.
            </div>
        `;
        return;
    }
    
    modalDetailedContent.innerHTML = `
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
                                <td>${stockData.technical_indicators.rsi?.value || 'N/A'}</td>
                                <td><span class="badge ${getSignalColor(stockData.technical_indicators.rsi?.signal || '')}">${stockData.technical_indicators.rsi?.signal || 'N/A'}</span></td>
                            </tr>
                            <tr>
                                <td>MACD</td>
                                <td>${stockData.technical_indicators.macd?.value || 'N/A'}</td>
                                <td><span class="badge ${getSignalColor(stockData.technical_indicators.macd?.signal || '')}">${stockData.technical_indicators.macd?.signal || 'N/A'}</span></td>
                            </tr>
                            <tr>
                                <td>Bollinger Position</td>
                                <td>${stockData.technical_indicators.bollinger_position?.value || 'N/A'}</td>
                                <td><span class="badge ${getSignalColor(stockData.technical_indicators.bollinger_position?.signal || '')}">${stockData.technical_indicators.bollinger_position?.signal || 'N/A'}</span></td>
                            </tr>
                            <tr>
                                <td>Stochastic K</td>
                                <td>${stockData.technical_indicators.stochastic?.k || 'N/A'}</td>
                                <td>-</td>
                            </tr>
                            <tr>
                                <td>Stochastic D</td>
                                <td>${stockData.technical_indicators.stochastic?.d || 'N/A'}</td>
                                <td>-</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        ${stockData.momentum_analysis ? `
        <!-- Momentum Analysis -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-speedometer2"></i> Análisis de Momentum</h6>
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Fuerza de Tendencia</small>
                            <div><strong>${stockData.momentum_analysis.trend_strength || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Score Momentum</small>
                            <div><strong>${stockData.momentum_analysis.momentum_score || 'N/A'}%</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Confirmación Volumen</small>
                            <div><span class="badge ${getVolumeColor(stockData.momentum_analysis.volume_confirmation || '')}">${stockData.momentum_analysis.volume_confirmation || 'N/A'}</span></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Ratio Volumen</small>
                            <div><strong>${stockData.momentum_analysis.volume_ratio || 'N/A'}x</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        ${stockData.risk_metrics ? `
        <!-- Risk Metrics -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-shield"></i> Métricas de Riesgo</h6>
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>VaR 1-día 5%</small>
                            <div><strong>${stockData.risk_metrics['var_1day_5%'] || 'N/A'}%</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Sharpe Ratio</small>
                            <div><strong>${stockData.risk_metrics.sharpe_ratio || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Max Drawdown</small>
                            <div><strong>${stockData.risk_metrics.max_drawdown || 'N/A'}%</strong></div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center p-2 border rounded">
                            <small>Volatilidad Diaria</small>
                            <div><strong>${stockData.risk_metrics.daily_volatility || 'N/A'}%</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        ${stockData.ml_insights ? `
        <!-- ML Insights -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-cpu"></i> Insights de Machine Learning</h6>
                <div class="row">
                    <div class="col-md-4">
                        <div class="text-center p-2 border rounded">
                            <small>Clasificación de Régimen</small>
                            <div><strong>${stockData.ml_insights.regime_classification || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center p-2 border rounded">
                            <small>Similitud de Patrón</small>
                            <div><strong>${stockData.ml_insights.pattern_similarity || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="text-center p-2 border rounded">
                            <small>Dirección Forecast</small>
                            <div><strong>${stockData.ml_insights.forecast_direction || 'N/A'}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        ${stockData.scoring_breakdown ? `
        <!-- Scoring Breakdown -->
        <div class="row mb-4">
            <div class="col-12">
                <h6><i class="bi bi-bar-chart"></i> Desglose de Scoring</h6>
                <div class="row">
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Técnico</small>
                            <div><strong>${stockData.scoring_breakdown.technical_score || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Momentum</small>
                            <div><strong>${stockData.scoring_breakdown.momentum_score || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Riesgo</small>
                            <div><strong>${stockData.scoring_breakdown.risk_score || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Patrones</small>
                            <div><strong>${stockData.scoring_breakdown.pattern_score || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded">
                            <small>Volumen</small>
                            <div><strong>${stockData.scoring_breakdown.volume_score || 'N/A'}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="text-center p-2 border rounded bg-primary text-white">
                            <small>Final</small>
                            <div><strong>${stockData.scoring_breakdown.final_score || 'N/A'}</strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}

        ${stockData.reasoning && stockData.reasoning.length > 0 ? `
        <!-- Reasoning -->
        <div class="row">
            <div class="col-12">
                <h6><i class="bi bi-list-check"></i> Razones del Análisis</h6>
                <ul class="list-group">
                    ${stockData.reasoning.map(reason => `<li class="list-group-item">${reason}</li>`).join('')}
                </ul>
            </div>
        </div>
        ` : ''}
    `;
    
    console.log('✅ Modal detailed analysis content populated');
}

function setupModalAnalyzeButton(symbol) {
    const modalAnalyzeBtn = document.getElementById('modalAnalyzeAgainBtn');
    if (!modalAnalyzeBtn) {
        console.error('❌ Modal analyze button not found');
        return;
    }
    
    // Remove any existing event listeners
    modalAnalyzeBtn.replaceWith(modalAnalyzeBtn.cloneNode(true));
    const newBtn = document.getElementById('modalAnalyzeAgainBtn');
    
    // Add new event listener
    newBtn.addEventListener('click', () => {
        console.log('🔄 Analyzing individual stock from modal:', symbol);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('stockDetailModal'));
        if (modal) {
            modal.hide();
        }
        
        // Switch to single stock mode
        const multiStockMode = document.getElementById('multiStockMode');
        if (multiStockMode && multiStockMode.checked) {
            multiStockMode.checked = false;
            toggleAnalysisMode(); // This will switch the forms and hide results
        }
        
        // Fill the stock symbol input
        const stockSymbolInput = document.getElementById('stockSymbol');
        if (stockSymbolInput) {
            stockSymbolInput.value = symbol;
        }
        
        // Optional: Auto-trigger analysis
        // analyzeStock();
        
        // Scroll to the form
        const singleForm = document.getElementById('singleStockForm');
        if (singleForm) {
            singleForm.scrollIntoView({ behavior: 'smooth' });
        }
        
        console.log('✅ Switched to individual analysis for', symbol);
    });
    
    console.log('✅ Modal analyze button setup for', symbol);
}