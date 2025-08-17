// Stock Market Analyzer - Frontend JavaScript
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global DOM elements - initialized on DOM ready
let stockForm, loadingSpinner, singleResultsSection, multiResultsSection, errorAlert;
let summaryCard, detailedCard, analyzeBtn;
let multiStockForm, multiStockMode, multiStockInput, selectedStocksList, stockCounter;
let analyzeMultiBtn, addStocksBtn, clearAllStocksBtn, addTechStocksBtn, addBlueChipBtn;

// Multi-stock management
let selectedStocks = [];
const maxStocks = 10;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Stock Market Analyzer initialized');
    
    // Get DOM elements
    stockForm = document.getElementById('stockAnalysisForm');
    loadingSpinner = document.getElementById('loadingSpinner');
    singleResultsSection = document.getElementById('singleResultsSection');
    multiResultsSection = document.getElementById('multiResultsSection');
    errorAlert = document.getElementById('errorAlert');
    summaryCard = document.getElementById('summaryCard');
    detailedCard = document.getElementById('detailedCard');
    analyzeBtn = document.getElementById('analyzeBtn');
    
    // Multi-stock elements
    multiStockForm = document.getElementById('multiStockAnalysisForm');
    multiStockMode = document.getElementById('multiStockMode');
    multiStockInput = document.getElementById('multiStockInput');
    selectedStocksList = document.getElementById('selectedStocksList');
    stockCounter = document.getElementById('stockCounter');
    analyzeMultiBtn = document.getElementById('analyzeMultiBtn');
    addStocksBtn = document.getElementById('addStocksBtn');
    clearAllStocksBtn = document.getElementById('clearAllStocksBtn');
    addTechStocksBtn = document.getElementById('addTechStocksBtn');
    addBlueChipBtn = document.getElementById('addBlueChipBtn');
    
    // Verify essential elements for basic functionality exist
    const essentialElements = {
        stockForm,
        loadingSpinner,
        errorAlert,
        analyzeBtn
    };
    
    const missing = Object.entries(essentialElements)
        .filter(([, element]) => !element)
        .map(([name]) => name);
    
    if (missing.length > 0) {
        console.error('Missing essential elements:', missing);
        alert('Error: Página no cargada correctamente. Elementos faltantes: ' + missing.join(', '));
        return;
    }
    
    console.log('✅ All elements found successfully');
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Single stock form submission (ALWAYS SETUP)
    if (stockForm) {
        stockForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await analyzeStock();
        });
        console.log('✅ Single stock form listener setup');
    }
    
    // Auto-uppercase stock symbol input (ALWAYS SETUP)
    const stockSymbolInput = document.getElementById('stockSymbol');
    if (stockSymbolInput) {
        stockSymbolInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        console.log('✅ Stock symbol input listener setup');
    }
    
    // === MULTI-STOCK FUNCTIONALITY (OPTIONAL) ===
    setupMultiStockListeners();
}

function setupMultiStockListeners() {
    // Check if multi-stock mode toggle exists
    if (!multiStockMode) {
        console.log('ℹ️ Multi-stock mode not available - skipping multi-stock setup');
        return;
    }
    
    console.log('🔄 Setting up multi-stock functionality...');
    
    // Mode toggle (CRITICAL - must work)
    try {
        multiStockMode.addEventListener('change', toggleAnalysisMode);
        console.log('✅ Mode toggle listener setup');
    } catch (error) {
        console.error('❌ Failed to setup mode toggle:', error);
    }
    
    // Multi-stock form submission (if available)
    if (multiStockForm) {
        try {
            multiStockForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await analyzeMultipleStocks();
            });
            console.log('✅ Multi-stock form listener setup');
        } catch (error) {
            console.error('❌ Failed to setup multi-stock form:', error);
        }
    } else {
        console.log('⚠️ Multi-stock form not found');
    }
    
    // Multi-stock management buttons (optional)
    setupMultiStockButtons();
    
    // Multi-stock input (optional)
    setupMultiStockInput();
    
    // Initialize multi-stock display (optional)
    try {
        updateSelectedStocksList();
        updateAnalyzeButton();
    } catch (error) {
        console.log('⚠️ Could not initialize multi-stock display:', error.message);
    }
    
    console.log('✅ Multi-stock functionality setup completed');
}

function setupMultiStockButtons() {
    const buttons = [
        { element: addStocksBtn, name: 'addStocks', handler: addStocksFromInput },
        { element: clearAllStocksBtn, name: 'clearAll', handler: clearAllStocks },
        { element: addTechStocksBtn, name: 'addTech', handler: () => addPredefinedStocks('tech') },
        { element: addBlueChipBtn, name: 'addBlueChip', handler: () => addPredefinedStocks('bluechip') }
    ];
    
    buttons.forEach(({ element, name, handler }) => {
        if (element) {
            try {
                element.addEventListener('click', handler);
                console.log(`✅ ${name} button setup`);
            } catch (error) {
                console.log(`⚠️ ${name} button setup failed:`, error.message);
            }
        }
    });
}

function setupMultiStockInput() {
    if (multiStockInput) {
        try {
            multiStockInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
            
            multiStockInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addStocksFromInput();
                }
            });
            console.log('✅ Multi-stock input listeners setup');
        } catch (error) {
            console.log('⚠️ Multi-stock input setup failed:', error.message);
        }
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

    // Show single results section (prioritize singleResultsSection)
    const resultsElement = singleResultsSection || document.getElementById('resultsSection');
    if (resultsElement) {
        resultsElement.style.display = 'block';
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
    // Always try to get elements fresh to avoid stale references
    const spinner = loadingSpinner || document.getElementById('loadingSpinner');
    const button = analyzeBtn || document.getElementById('analyzeBtn');
    
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
    if (button) {
        button.disabled = show;
        button.innerHTML = show ? 
            '<i class="bi bi-hourglass-split"></i> Analizando...' : 
            '<i class="bi bi-search"></i> Analizar Acción';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const alert = errorAlert || document.getElementById('errorAlert');
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (alert) {
        alert.style.display = 'block';
    }
}

function hideError() {
    const alert = errorAlert || document.getElementById('errorAlert');
    if (alert) {
        alert.style.display = 'none';
    }
}

function hideResults() {
    // Try to get elements fresh if globals are null
    const singleResults = singleResultsSection || document.getElementById('singleResultsSection') || document.getElementById('resultsSection');
    const multiResults = multiResultsSection || document.getElementById('multiResultsSection');
    
    if (singleResults) {
        singleResults.style.display = 'none';
    }
    if (multiResults) {
        multiResults.style.display = 'none';
    }
}

// =================== MULTI-STOCK FUNCTIONALITY ===================

function toggleAnalysisMode() {
    // Get toggle state safely
    const modeToggle = multiStockMode || document.getElementById('multiStockMode');
    if (!modeToggle) {
        console.error('Mode toggle not found');
        return;
    }
    
    const isMultiMode = modeToggle.checked;
    console.log('Toggle mode to:', isMultiMode ? 'MULTI' : 'SINGLE');
    
    // Get form elements safely
    const singleForm = document.getElementById('singleStockForm');
    const multiForm = document.getElementById('multiStockForm');
    
    if (!singleForm || !multiForm) {
        console.error('Form elements not found:', {
            singleForm: !!singleForm,
            multiForm: !!multiForm
        });
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
    
    // Hide results when switching modes
    hideResults();
    hideError();
}

function addStocksFromInput() {
    const input = multiStockInput || document.getElementById('multiStockInput');
    if (!input || !input.value.trim()) return;
    
    // Split by comma and clean up
    const newStocks = input.value.trim().split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    
    // Add each valid stock
    newStocks.forEach(stock => {
        if (stock && !selectedStocks.includes(stock) && selectedStocks.length < maxStocks) {
            selectedStocks.push(stock);
        }
    });
    
    // Clear input
    input.value = '';
    
    // Update display
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function removeStock(symbol) {
    selectedStocks = selectedStocks.filter(s => s !== symbol);
    updateSelectedStocksList();
    updateAnalyzeButton();
}

function clearAllStocks() {
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
    const stocksList = selectedStocksList || document.getElementById('selectedStocksList');
    const counter = stockCounter || document.getElementById('stockCounter');
    
    if (!stocksList || !counter) {
        console.log('ℹ️ Multi-stock elements not available - skipping update');
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
}

function updateAnalyzeButton() {
    const button = analyzeMultiBtn || document.getElementById('analyzeMultiBtn');
    if (button) {
        button.disabled = selectedStocks.length === 0;
    }
}

async function analyzeMultipleStocks() {
    if (selectedStocks.length === 0) {
        showError('Por favor selecciona al menos una acción para analizar');
        return;
    }
    
    // Get form values
    const normalizeValues = document.getElementById('normalizeValues').checked;
    const detailedOutput = document.getElementById('multiDetailedOutput').checked;
    const periodNumber = document.getElementById('multiPeriodNumber').value;
    const periodUnit = document.getElementById('multiPeriodUnit').value;
    
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
        
        console.log('Multi-stock analysis result:', data);
        
        // Show results
        displayMultiStockResults(data, normalizeValues);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al conectar con el servidor. Verifica que el backend esté ejecutándose.');
    } finally {
        showMultiLoading(false);
    }
}

function displayMultiStockResults(data, normalized) {
    // Show global recommendation
    displayGlobalRecommendation(data.global_recommendation);
    
    // Show comparison table
    displayComparisonTable(data.individual_analyses, normalized);
    
    // Show portfolio summary
    displayPortfolioSummary(data.portfolio_summary);
    
    // Show individual details
    displayIndividualDetails(data.individual_analyses);
    
    // Show multi results section
    if (multiResultsSection) {
        multiResultsSection.style.display = 'block';
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
                        <h2 class="mb-0">
                            <span class="badge ${recommendationColor} fs-4 p-3">
                                ${globalRec.recommendation}
                            </span>
                        </h2>
                        <small class="text-muted">Recomendación del Portfolio</small>
                    </div>
                    <div>
                        <h4 class="mb-0">Confianza: ${globalRec.confidence}%</h4>
                        <small class="text-muted">Score Global: ${globalRec.overall_score}/100</small>
                    </div>
                </div>
                <div class="alert alert-info">
                    <h6><i class="bi bi-lightbulb"></i> Razón Principal</h6>
                    <p class="mb-0">${globalRec.reasoning}</p>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6>Distribución Recomendada</h6>
                        <div class="mb-2">
                            <strong>Acciones Principales:</strong> ${globalRec.allocation_suggestion.primary_positions}%
                        </div>
                        <div class="mb-2">
                            <strong>Posiciones Secundarias:</strong> ${globalRec.allocation_suggestion.secondary_positions}%
                        </div>
                        <div>
                            <strong>Diversificación:</strong> ${globalRec.allocation_suggestion.diversification_level}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function displayComparisonTable(analyses, normalized) {
    const tableBody = document.getElementById('comparisonTableBody');
    if (!tableBody) return;
    
    // Sort by final score descending
    const sortedAnalyses = [...analyses].sort((a, b) => 
        parseFloat(b.scoring_breakdown.final_score) - parseFloat(a.scoring_breakdown.final_score)
    );
    
    tableBody.innerHTML = sortedAnalyses.map(analysis => {
        const recommendationColor = getRecommendationColor(analysis.recommendation);
        const riskColor = getRiskColor(analysis.risk_level || 'MEDIO');
        
        return `
            <tr>
                <td><strong>${analysis.symbol}</strong></td>
                <td>$${analysis.current_price}</td>
                <td><span class="badge ${recommendationColor}">${analysis.recommendation}</span></td>
                <td>${analysis.confidence}%</td>
                <td><strong>${analysis.scoring_breakdown.final_score}</strong></td>
                <td><span class="badge ${riskColor}">${analysis.risk_level || 'MEDIO'}</span></td>
                <td>$${analysis.stop_loss}</td>
                <td>$${analysis.take_profit}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info" onclick="showStockDetails('${analysis.symbol}')">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function displayPortfolioSummary(portfolioSummary) {
    // Update portfolio summary cards
    const diversificationScore = document.getElementById('diversificationScore');
    const portfolioRisk = document.getElementById('portfolioRisk');
    const portfolioPotential = document.getElementById('portfolioPotential');
    const portfolioTimeframe = document.getElementById('portfolioTimeframe');
    
    if (diversificationScore) diversificationScore.textContent = portfolioSummary.diversification_score;
    if (portfolioRisk) portfolioRisk.textContent = portfolioSummary.risk_level;
    if (portfolioPotential) portfolioPotential.textContent = portfolioSummary.expected_return;
    if (portfolioTimeframe) portfolioTimeframe.textContent = portfolioSummary.time_horizon;
}

function displayIndividualDetails(analyses) {
    const content = document.getElementById('individualDetailsContent');
    if (!content) return;
    
    content.innerHTML = analyses.map(analysis => `
        <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">
                    <i class="bi bi-graph-up"></i>
                    ${analysis.symbol} - ${analysis.recommendation}
                </h6>
                <span class="badge bg-primary">${analysis.scoring_breakdown.final_score}</span>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <small><strong>Precio:</strong> $${analysis.current_price}</small><br>
                        <small><strong>Stop Loss:</strong> $${analysis.stop_loss}</small><br>
                        <small><strong>Take Profit:</strong> $${analysis.take_profit}</small>
                    </div>
                    <div class="col-md-6">
                        <small><strong>Confianza:</strong> ${analysis.confidence}%</small><br>
                        <small><strong>Riesgo:</strong> ${analysis.risk_level || 'MEDIO'}</small><br>
                        <small><strong>Horizonte:</strong> ${analysis.time_horizon || 'Medio plazo'}</small>
                    </div>
                </div>
                ${analysis.key_reason ? `
                <div class="mt-2">
                    <small><strong>Razón:</strong> ${analysis.key_reason}</small>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showStockDetails(symbol) {
    // This could open a modal with detailed information
    console.log('Show details for:', symbol);
    // For now, just scroll to individual details
    const individualDetails = document.getElementById('individualDetailsCollapse');
    if (individualDetails && !individualDetails.classList.contains('show')) {
        const collapseButton = document.querySelector('[data-bs-target="#individualDetailsCollapse"]');
        if (collapseButton) {
            collapseButton.click();
        }
    }
}

function showMultiLoading(show) {
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
        const text = loadingSpinner.querySelector('span');
        if (text) {
            text.textContent = show ? 'Analizando múltiples acciones...' : 'Cargando...';
        }
    }
    if (analyzeMultiBtn) {
        analyzeMultiBtn.disabled = show;
        analyzeMultiBtn.innerHTML = show ? 
            '<i class="bi bi-hourglass-split"></i> Analizando...' : 
            '<i class="bi bi-search"></i> Analizar Acciones';
    }
}