// Portfolio Builder - Frontend JavaScript
// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global variables
let portfolioAssets = []; // Array of {symbol, weight}
let portfolioData = null;
let correlationChart = null;
let outliersChart = null;
let optimizationChart = null;
let metricsComparisonChart = null;
let weightsDistributionChart = null;
let optimizationData = null;

// DOM Elements
const assetSymbolInput = document.getElementById('assetSymbol');
const assetWeightInput = document.getElementById('assetWeight');
const addAssetBtn = document.getElementById('addAssetBtn');
const clearPortfolioBtn = document.getElementById('clearPortfolioBtn');
const analyzePortfolioBtn = document.getElementById('analyzePortfolioBtn');
const optimizePortfolioBtn = document.getElementById('optimizePortfolioBtn');
const portfolioComposition = document.getElementById('portfolioComposition');
const analysisModules = document.getElementById('analysisModules');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');

// Event Listeners
addAssetBtn.addEventListener('click', addAsset);
clearPortfolioBtn.addEventListener('click', clearPortfolio);
analyzePortfolioBtn.addEventListener('click', analyzePortfolio);
optimizePortfolioBtn.addEventListener('click', optimizePortfolio);

// Enter key support
assetSymbolInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addAsset();
    }
});

assetSymbolInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase();
});

// Portfolio Management Functions
function addAsset() {
    const symbol = assetSymbolInput.value.trim().toUpperCase();
    const weight = parseFloat(assetWeightInput.value) || 25;

    if (!symbol) {
        showError('Por favor ingresa un símbolo de acción');
        return;
    }

    if (weight <= 0 || weight > 100) {
        showError('El peso debe estar entre 1 y 100%');
        return;
    }

    // Check if asset already exists
    const existingAsset = portfolioAssets.find(asset => asset.symbol === symbol);
    if (existingAsset) {
        showError(`${symbol} ya está en el portafolio`);
        return;
    }

    // Add asset
    portfolioAssets.push({ symbol, weight });
    updatePortfolioComposition();
    
    // Clear inputs
    assetSymbolInput.value = '';
    assetWeightInput.value = 25;

    console.log('Asset added:', { symbol, weight });
}

function removeAsset(symbol) {
    portfolioAssets = portfolioAssets.filter(asset => asset.symbol !== symbol);
    updatePortfolioComposition();
    console.log('Asset removed:', symbol);
}

function updateAssetWeight(symbol, newWeight) {
    const asset = portfolioAssets.find(a => a.symbol === symbol);
    if (asset) {
        asset.weight = parseFloat(newWeight) || 0;
        updatePortfolioComposition();
        console.log('Asset weight updated:', { symbol, newWeight });
    }
}

function clearPortfolio() {
    portfolioAssets = [];
    portfolioData = null;
    updatePortfolioComposition();
    hideAnalysisModules();
    console.log('Portfolio cleared');
}

function updatePortfolioComposition() {
    if (portfolioAssets.length === 0) {
        portfolioComposition.innerHTML = `
            <div class="text-muted text-center py-3">
                <i class="bi bi-briefcase" style="font-size: 2rem;"></i>
                <p class="mt-2">Agrega activos para construir tu portafolio</p>
            </div>
        `;
        analyzePortfolioBtn.disabled = true;
        return;
    }

    const totalWeight = portfolioAssets.reduce((sum, asset) => sum + asset.weight, 0);
    const isValidWeights = Math.abs(totalWeight - 100) < 0.01; // Allow small floating point errors

    portfolioComposition.innerHTML = `
        <div class="mb-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6>Activos (${portfolioAssets.length})</h6>
                <span class="badge ${isValidWeights ? 'bg-success' : 'bg-warning'}">
                    Total: ${totalWeight.toFixed(1)}%
                </span>
            </div>
            ${portfolioAssets.map(asset => `
                <div class="d-flex align-items-center mb-2 p-2 border rounded">
                    <div class="flex-grow-1">
                        <strong>${asset.symbol}</strong>
                    </div>
                    <div class="me-2" style="width: 80px;">
                        <input type="number" 
                               class="form-control form-control-sm" 
                               value="${asset.weight}" 
                               min="0.1" 
                               max="100" 
                               step="0.1"
                               onchange="updateAssetWeight('${asset.symbol}', this.value)">
                    </div>
                    <div style="width: 40px;">
                        <button class="btn btn-outline-danger btn-sm" 
                                onclick="removeAsset('${asset.symbol}')"
                                title="Eliminar">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        ${!isValidWeights ? `
            <div class="alert alert-warning alert-sm">
                <small><i class="bi bi-exclamation-triangle"></i> 
                Los pesos deben sumar 100% para análisis precisos</small>
            </div>
        ` : ''}
    `;

    analyzePortfolioBtn.disabled = portfolioAssets.length < 2;
    optimizePortfolioBtn.disabled = portfolioAssets.length < 2;
}

// Portfolio Analysis
async function analyzePortfolio() {
    if (portfolioAssets.length < 2) {
        showError('Necesitas al menos 2 activos para analizar el portafolio');
        return;
    }

    const totalWeight = portfolioAssets.reduce((sum, asset) => sum + asset.weight, 0);
    if (Math.abs(totalWeight - 100) > 5) {
        showError('Los pesos del portafolio deben sumar aproximadamente 100%');
        return;
    }

    try {
        showLoading(true);
        hideError();
        showAnalysisModules();

        const period = document.getElementById('portfolioPeriod').value;
        
        // Prepare portfolio data for API
        const portfolioRequest = {
            assets: portfolioAssets,
            period: period,
            analysis_types: ['correlation', 'risk_metrics', 'outliers', 'performance']
        };

        console.log('Analyzing portfolio:', portfolioRequest);

        // Call portfolio analysis API
        const response = await fetch(`${API_BASE_URL}/portfolio/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(portfolioRequest)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al analizar el portafolio');
        }

        portfolioData = data;
        
        // Update all analysis modules
        updateCorrelationMatrix(data.correlation_matrix);
        updateRiskMetrics(data.risk_metrics);
        updateOutliersAnalysis(data.outliers);
        updatePerformanceSummary(data.performance);
        
        // Enable optimization button after successful analysis
        optimizePortfolioBtn.disabled = false;

        console.log('Portfolio analysis completed:', data);

    } catch (error) {
        console.error('Error analyzing portfolio:', error);
        showError(error.message || 'Error al conectar con el servidor');
        hideAnalysisModules();
    } finally {
        showLoading(false);
    }
}

// Correlation Matrix Visualization
function updateCorrelationMatrix(correlationData) {
    const container = document.getElementById('correlationMatrix');
    
    if (!correlationData || !correlationData.matrix) {
        container.innerHTML = '<div class="text-danger">Error: No se pudieron calcular las correlaciones</div>';
        return;
    }

    const symbols = correlationData.symbols;
    const matrix = correlationData.matrix;

    // Create correlation heatmap
    let html = '<div class="table-responsive">';
    html += '<table class="table table-sm table-bordered">';
    
    // Header
    html += '<thead><tr><th></th>';
    symbols.forEach(symbol => {
        html += `<th class="text-center small">${symbol}</th>`;
    });
    html += '</tr></thead>';
    
    // Body
    html += '<tbody>';
    symbols.forEach((symbol, i) => {
        html += `<tr><td class="fw-bold small">${symbol}</td>`;
        symbols.forEach((_, j) => {
            const correlation = matrix[i][j];
            const color = getCorrelationColor(correlation);
            const textColor = Math.abs(correlation) > 0.5 ? 'white' : 'black';
            html += `<td class="text-center small" style="background-color: ${color}; color: ${textColor};">
                ${correlation.toFixed(2)}
            </td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';

    // Add interpretation
    html += `
        <div class="mt-3">
            <h6><i class="bi bi-info-circle"></i> Interpretación</h6>
            <div class="row">
                <div class="col-4 text-center">
                    <div class="p-2 rounded" style="background-color: #d32f2f; color: white;">
                        <small><strong>Alta Correlación</strong><br>0.7 - 1.0</small>
                    </div>
                </div>
                <div class="col-4 text-center">
                    <div class="p-2 rounded" style="background-color: #fff3cd; color: black;">
                        <small><strong>Media Correlación</strong><br>0.3 - 0.7</small>
                    </div>
                </div>
                <div class="col-4 text-center">
                    <div class="p-2 rounded" style="background-color: #d4edda; color: black;">
                        <small><strong>Baja Correlación</strong><br>-1.0 - 0.3</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function getCorrelationColor(correlation) {
    // Color scale from green (low correlation) to red (high correlation)
    const abs = Math.abs(correlation);
    if (abs < 0.3) return '#d4edda'; // Light green
    if (abs < 0.5) return '#fff3cd'; // Light yellow
    if (abs < 0.7) return '#f8d7da'; // Light red
    return '#d32f2f'; // Dark red
}

// Risk Metrics Visualization
function updateRiskMetrics(riskData) {
    const container = document.getElementById('riskMetrics');
    
    if (!riskData) {
        container.innerHTML = '<div class="text-danger">Error: No se pudieron calcular las métricas de riesgo</div>';
        return;
    }

    let html = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <div class="card border-info">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="bi bi-speedometer"></i> Volatilidad</h6>
                    </div>
                    <div class="card-body">
                        <h4 class="text-info">${(riskData.portfolio_volatility * 100).toFixed(2)}%</h4>
                        <small class="text-muted">Anualizada</small>
                        <div class="mt-2">
                            <small><strong>Individual:</strong></small><br>
                            ${Object.entries(riskData.individual_volatility || {}).map(([symbol, vol]) => 
                                `<small>${symbol}: ${(vol * 100).toFixed(2)}%</small>`
                            ).join('<br>')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card border-warning">
                    <div class="card-header bg-warning text-dark">
                        <h6 class="mb-0"><i class="bi bi-exclamation-triangle"></i> VaR (95%)</h6>
                    </div>
                    <div class="card-body">
                        <h4 class="text-warning">${(riskData.var_95 * 100).toFixed(2)}%</h4>
                        <small class="text-muted">Pérdida máxima esperada (95% confianza)</small>
                        <div class="mt-2">
                            <small><strong>CVaR:</strong> ${(riskData.cvar_95 * 100).toFixed(2)}%</small><br>
                            <small class="text-muted">Pérdida esperada más allá del VaR</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card border-danger">
                    <div class="card-header bg-danger text-white">
                        <h6 class="mb-0"><i class="bi bi-arrow-down-circle"></i> Max Drawdown</h6>
                    </div>
                    <div class="card-body">
                        <h4 class="text-danger">${(riskData.max_drawdown * 100).toFixed(2)}%</h4>
                        <small class="text-muted">Mayor caída desde máximo histórico</small>
                        <div class="mt-2">
                            <small><strong>Duración:</strong> ${riskData.drawdown_duration || 'N/A'} días</small><br>
                            <small><strong>Recuperación:</strong> ${riskData.recovery_time || 'N/A'} días</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="card border-success">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-graph-up"></i> Beta del Portafolio</h6>
                    </div>
                    <div class="card-body">
                        <h4 class="text-success">${riskData.portfolio_beta?.toFixed(3) || 'N/A'}</h4>
                        <small class="text-muted">Sensibilidad al mercado</small>
                        <div class="mt-2">
                            <small><strong>R² vs Mercado:</strong> ${((riskData.r_squared || 0) * 100).toFixed(1)}%</small><br>
                            <small class="text-muted">Correlación con índice de referencia</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-3">
            <h6><i class="bi bi-info-circle"></i> Diversificación</h6>
            <div class="progress mb-2">
                <div class="progress-bar ${getDiversificationColor(riskData.diversification_ratio)}" 
                     style="width: ${(riskData.diversification_ratio * 100).toFixed(1)}%">
                    ${(riskData.diversification_ratio * 100).toFixed(1)}%
                </div>
            </div>
            <small class="text-muted">
                Ratio de Diversificación: ${riskData.diversification_ratio?.toFixed(3) || 'N/A'} 
                (1.0 = perfectamente diversificado)
            </small>
        </div>
    `;

    container.innerHTML = html;
}

function getDiversificationColor(ratio) {
    if (ratio > 0.8) return 'bg-success';
    if (ratio > 0.6) return 'bg-warning';
    return 'bg-danger';
}

// Outliers Detection Visualization
function updateOutliersAnalysis(outliersData) {
    const chartContainer = document.getElementById('outliersChart');
    const infoContainer = document.getElementById('outliersInfo');
    
    if (!outliersData) {
        chartContainer.innerHTML = '<div class="text-danger">Error: No se pudieron detectar outliers</div>';
        return;
    }

    // Create outliers chart
    createOutliersChart(outliersData);
    
    // Update info panel
    const totalOutliers = outliersData.total_outliers || 0;
    const outliersPercentage = outliersData.outliers_percentage || 0;
    
    let html = `
        <h6><i class="bi bi-exclamation-circle"></i> Detección de Outliers</h6>
        <div class="mb-3">
            <div class="d-flex justify-content-between">
                <span>Total Outliers:</span>
                <strong class="text-danger">${totalOutliers}</strong>
            </div>
            <div class="d-flex justify-content-between">
                <span>Porcentaje:</span>
                <strong class="text-danger">${outliersPercentage.toFixed(2)}%</strong>
            </div>
        </div>
        
        <div class="mb-3">
            <h6 class="small">Métodos Utilizados:</h6>
            <div class="small">
                ${Object.entries(outliersData.methods || {}).map(([method, count]) => `
                    <div class="d-flex justify-content-between">
                        <span>${method}:</span>
                        <span class="badge bg-secondary">${count}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="alert alert-info">
            <small>
                <strong>Interpretación:</strong><br>
                • <strong>Z-Score:</strong> Valores > 3σ<br>
                • <strong>IQR:</strong> Fuera de Q1-1.5*IQR, Q3+1.5*IQR<br>
                • <strong>Isolation Forest:</strong> Anomalías ML<br>
                • <strong>LOF:</strong> Densidad local baja
            </small>
        </div>
    `;

    infoContainer.innerHTML = html;
}

function createOutliersChart(outliersData) {
    const ctx = document.getElementById('outliersChart');
    
    // Destroy existing chart
    if (outliersChart) {
        outliersChart.destroy();
    }

    // Prepare data for scatter plot
    const datasets = [];
    const symbols = Object.keys(outliersData.data || {});
    const colors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)'
    ];

    symbols.forEach((symbol, index) => {
        const symbolData = outliersData.data[symbol];
        const normalPoints = symbolData.normal || [];
        const outlierPoints = symbolData.outliers || [];
        
        // Normal points
        if (normalPoints.length > 0) {
            datasets.push({
                label: `${symbol} Normal`,
                data: normalPoints.map(point => ({
                    x: new Date(point.date),
                    y: point.return
                })),
                backgroundColor: colors[index % colors.length],
                borderColor: colors[index % colors.length],
                pointRadius: 3
            });
        }
        
        // Outlier points
        if (outlierPoints.length > 0) {
            datasets.push({
                label: `${symbol} Outliers`,
                data: outlierPoints.map(point => ({
                    x: new Date(point.date),
                    y: point.return
                })),
                backgroundColor: 'rgba(220, 53, 69, 0.8)',
                borderColor: 'rgba(220, 53, 69, 1)',
                pointRadius: 6,
                pointStyle: 'triangle'
            });
        }
    });

    // Create canvas element
    ctx.innerHTML = '<canvas id="outliersChartCanvas"></canvas>';
    const canvas = document.getElementById('outliersChartCanvas');

    outliersChart = new Chart(canvas, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Detección de Outliers en Retornos'
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    title: {
                        display: true,
                        text: 'Fecha'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Retorno Diario (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(2) + '%';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'point'
            }
        }
    });
}

// Performance Summary
function updatePerformanceSummary(performanceData) {
    if (!performanceData) {
        console.error('No performance data available');
        return;
    }

    document.getElementById('portfolioReturn').textContent = 
        `${(performanceData.annualized_return * 100).toFixed(2)}%`;
    
    document.getElementById('portfolioVolatility').textContent = 
        `${(performanceData.volatility * 100).toFixed(2)}%`;
    
    document.getElementById('portfolioSharpe').textContent = 
        performanceData.sharpe_ratio?.toFixed(3) || 'N/A';
    
    document.getElementById('portfolioMaxDrawdown').textContent = 
        `${(performanceData.max_drawdown * 100).toFixed(2)}%`;
}

// UI Helper Functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    errorAlert.style.display = 'block';
    setTimeout(() => hideError(), 10000);
}

function hideError() {
    errorAlert.style.display = 'none';
}

function showAnalysisModules() {
    analysisModules.style.display = 'block';
}

function hideAnalysisModules() {
    analysisModules.style.display = 'none';
}

// ============================
// 📌 Portfolio Optimization Functions
// ============================

async function optimizePortfolio() {
    if (portfolioAssets.length < 2) {
        showError('Necesitas al menos 2 activos para optimizar el portafolio');
        return;
    }

    try {
        showLoading(true);
        hideError();
        showOptimizationResults();

        const objective = document.getElementById('optimizationObjective').value;
        const targetReturn = parseFloat(document.getElementById('targetReturn').value) || 12;
        const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value) || 2.5;
        
        // Prepare optimization request
        const optimizationRequest = {
            assets: portfolioAssets,
            period: document.getElementById('portfolioPeriod').value,
            objective: objective,
            target_return: targetReturn / 100,  // Convert to decimal
            risk_free_rate: riskFreeRate / 100,  // Convert to decimal
            optimization_methods: ['risk_parity', 'markowitz', 'hybrid', 'black_litterman']
        };

        console.log('Optimizing portfolio:', optimizationRequest);

        // Call portfolio optimization API
        const response = await fetch(`${API_BASE_URL}/portfolio/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(optimizationRequest)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al optimizar el portafolio');
        }

        optimizationData = data;
        
        // Update all optimization results
        updateRiskParityResults(data.risk_parity);
        updateMarkowitzResults(data.markowitz);
        updateHybridResults(data.hybrid);
        updateBlackLittermanResults(data.black_litterman);
        updateOptimalSelection(data.optimal_selection);
        updateOptimizationRecommendations(data.recommendations);
        createOptimizationComparisonChart(data);
        createMetricsComparisonChart(data);
        createWeightsDistributionChart(data);

        console.log('Portfolio optimization completed:', data);

    } catch (error) {
        console.error('Error optimizing portfolio:', error);
        showError(error.message || 'Error al conectar con el servidor');
        hideOptimizationResults();
    } finally {
        showLoading(false);
    }
}

function updateRiskParityResults(riskParityData) {
    const container = document.getElementById('riskParityResults');
    
    if (!riskParityData || riskParityData.error) {
        container.innerHTML = `<div class="text-danger">Error: ${riskParityData?.error || 'No se pudo calcular Risk Parity'}</div>`;
        return;
    }

    let html = `
        <div class="mb-3">
            <h6><i class="bi bi-info-circle"></i> Risk Parity</h6>
            <p class="small text-muted">Distribución equitativa del riesgo entre activos</p>
        </div>
        
        <div class="mb-3">
            <h6 class="small">Pesos Optimizados:</h6>
            ${Object.entries(riskParityData.weights).map(([symbol, weight]) => `
                <div class="d-flex justify-content-between">
                    <span>${symbol}:</span>
                    <strong>${(weight * 100).toFixed(2)}%</strong>
                </div>
            `).join('')}
        </div>
        
        <div class="row text-center">
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Retorno Esperado</small>
                    <div class="fw-bold text-success">${(riskParityData.expected_return * 100).toFixed(2)}%</div>
                </div>
            </div>
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Volatilidad</small>
                    <div class="fw-bold text-warning">${(riskParityData.volatility * 100).toFixed(2)}%</div>
                </div>
            </div>
        </div>
        
        <div class="mt-2 text-center">
            <div class="border rounded p-2">
                <small class="text-muted">Ratio Sharpe</small>
                <div class="fw-bold text-info">${riskParityData.sharpe_ratio?.toFixed(3) || 'N/A'}</div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function updateMarkowitzResults(markowitzData) {
    const container = document.getElementById('markowitzResults');
    
    if (!markowitzData || markowitzData.error) {
        container.innerHTML = `<div class="text-danger">Error: ${markowitzData?.error || 'No se pudo calcular Markowitz'}</div>`;
        return;
    }

    let html = `
        <div class="mb-3">
            <h6><i class="bi bi-info-circle"></i> Markowitz (Mean-Variance)</h6>
            <p class="small text-muted">Optimización basada en retorno esperado y varianza</p>
        </div>
        
        <div class="mb-3">
            <h6 class="small">Pesos Optimizados:</h6>
            ${Object.entries(markowitzData.weights).map(([symbol, weight]) => `
                <div class="d-flex justify-content-between">
                    <span>${symbol}:</span>
                    <strong>${(weight * 100).toFixed(2)}%</strong>
                </div>
            `).join('')}
        </div>
        
        <div class="row text-center">
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Retorno Esperado</small>
                    <div class="fw-bold text-success">${(markowitzData.expected_return * 100).toFixed(2)}%</div>
                </div>
            </div>
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Volatilidad</small>
                    <div class="fw-bold text-warning">${(markowitzData.volatility * 100).toFixed(2)}%</div>
                </div>
            </div>
        </div>
        
        <div class="mt-2 text-center">
            <div class="border rounded p-2">
                <small class="text-muted">Ratio Sharpe</small>
                <div class="fw-bold text-info">${markowitzData.sharpe_ratio?.toFixed(3) || 'N/A'}</div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function updateHybridResults(hybridData) {
    const container = document.getElementById('hybridResults');
    
    if (!hybridData || hybridData.error) {
        container.innerHTML = `<div class="text-danger">Error: ${hybridData?.error || 'No se pudo calcular Híbrido'}</div>`;
        return;
    }

    let html = `
        <div class="mb-3">
            <h6><i class="bi bi-info-circle"></i> Híbrido</h6>
            <p class="small text-muted">Combinación de múltiples enfoques de optimización</p>
        </div>
        
        <div class="mb-3">
            <h6 class="small">Pesos Optimizados:</h6>
            ${Object.entries(hybridData.weights).map(([symbol, weight]) => `
                <div class="d-flex justify-content-between">
                    <span>${symbol}:</span>
                    <strong>${(weight * 100).toFixed(2)}%</strong>
                </div>
            `).join('')}
        </div>
        
        <div class="row text-center">
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Retorno Esperado</small>
                    <div class="fw-bold text-success">${(hybridData.expected_return * 100).toFixed(2)}%</div>
                </div>
            </div>
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Volatilidad</small>
                    <div class="fw-bold text-warning">${(hybridData.volatility * 100).toFixed(2)}%</div>
                </div>
            </div>
        </div>
        
        <div class="mt-2 text-center">
            <div class="border rounded p-2">
                <small class="text-muted">Ratio Sharpe</small>
                <div class="fw-bold text-info">${hybridData.sharpe_ratio?.toFixed(3) || 'N/A'}</div>
            </div>
        </div>
        
        <div class="mt-2">
            <small class="text-muted">
                <strong>Metodología:</strong> ${hybridData.methodology || 'Promedio ponderado de Risk Parity y Markowitz'}
            </small>
        </div>
    `;

    container.innerHTML = html;
}

function updateBlackLittermanResults(blackLittermanData) {
    const container = document.getElementById('blackLittermanResults');
    
    if (!blackLittermanData || blackLittermanData.error) {
        container.innerHTML = `<div class="text-danger">Error: ${blackLittermanData?.error || 'No se pudo calcular Black-Litterman'}</div>`;
        return;
    }

    let html = `
        <div class="mb-3">
            <h6><i class="bi bi-info-circle"></i> Black-Litterman</h6>
            <p class="small text-muted">Optimización bayesiana con vistas de mercado</p>
        </div>
        
        <div class="mb-3">
            <h6 class="small">Pesos Optimizados:</h6>
            ${Object.entries(blackLittermanData.weights).map(([symbol, weight]) => `
                <div class="d-flex justify-content-between">
                    <span>${symbol}:</span>
                    <strong>${(weight * 100).toFixed(2)}%</strong>
                </div>
            `).join('')}
        </div>
        
        <div class="row text-center">
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Retorno Esperado</small>
                    <div class="fw-bold text-success">${(blackLittermanData.expected_return * 100).toFixed(2)}%</div>
                </div>
            </div>
            <div class="col-6">
                <div class="border rounded p-2">
                    <small class="text-muted">Volatilidad</small>
                    <div class="fw-bold text-warning">${(blackLittermanData.volatility * 100).toFixed(2)}%</div>
                </div>
            </div>
        </div>
        
        <div class="mt-2 text-center">
            <div class="border rounded p-2">
                <small class="text-muted">Ratio Sharpe</small>
                <div class="fw-bold text-info">${blackLittermanData.sharpe_ratio?.toFixed(3) || 'N/A'}</div>
            </div>
        </div>
        
        <div class="mt-2">
            <small class="text-muted">
                <strong>Confianza:</strong> ${blackLittermanData.confidence?.toFixed(2) || 'Media'} | 
                <strong>Tau:</strong> ${blackLittermanData.tau?.toFixed(3) || '0.025'}
            </small>
        </div>
    `;

    container.innerHTML = html;
}

function updateOptimalSelection(optimalData) {
    const container = document.getElementById('optimalSelection');
    
    if (!optimalData) {
        container.innerHTML = '<div class="text-danger">Error: No se pudo determinar la selección óptima</div>';
        return;
    }

    let html = `
        <div class="mb-3">
            <h5><i class="bi bi-trophy"></i> Modelo Recomendado: <span class="text-primary">${optimalData.best_method}</span></h5>
            <p class="text-muted">${optimalData.reason}</p>
        </div>
        
        <div class="row">
            <div class="col-md-6">
                <h6 class="small">Pesos Óptimos:</h6>
                ${Object.entries(optimalData.optimal_weights).map(([symbol, weight]) => `
                    <div class="d-flex justify-content-between mb-1">
                        <span>${symbol}:</span>
                        <strong class="text-primary">${(weight * 100).toFixed(2)}%</strong>
                    </div>
                `).join('')}
            </div>
            <div class="col-md-6">
                <div class="row text-center">
                    <div class="col-12 mb-2">
                        <div class="border rounded p-2">
                            <small class="text-muted">Score Total</small>
                            <div class="fw-bold text-primary">${optimalData.total_score?.toFixed(2) || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <small class="text-muted">Retorno</small>
                            <div class="fw-bold text-success">${(optimalData.expected_return * 100).toFixed(2)}%</div>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <small class="text-muted">Volatilidad</small>
                            <div class="fw-bold text-warning">${(optimalData.volatility * 100).toFixed(2)}%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-3">
            <h6 class="small">Comparación de Métodos:</h6>
            <div class="row">
                ${optimalData.method_comparison?.map(method => `
                    <div class="col-6 mb-2">
                        <div class="d-flex justify-content-between">
                            <span class="small">${method.name}:</span>
                            <span class="badge ${method.name === optimalData.best_method ? 'bg-primary' : 'bg-secondary'}">${method.score?.toFixed(2) || 'N/A'}</span>
                        </div>
                    </div>
                `).join('') || ''}
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function updateOptimizationRecommendations(recommendationsData) {
    const container = document.getElementById('optimizationRecommendations');
    
    if (!recommendationsData || !recommendationsData.suggestions) {
        container.innerHTML = '<div class="text-muted">No hay sugerencias disponibles</div>';
        return;
    }

    let html = `
        <h6><i class="bi bi-lightbulb"></i> Sugerencias</h6>
        <div class="mb-3">
            ${recommendationsData.suggestions.map(suggestion => `
                <div class="alert alert-${suggestion.type === 'warning' ? 'warning' : suggestion.type === 'info' ? 'info' : 'success'} alert-sm">
                    <small><strong>${suggestion.title}:</strong><br>${suggestion.message}</small>
                </div>
            `).join('')}
        </div>
        
        ${recommendationsData.rebalancing_advice ? `
            <div class="mb-3">
                <h6 class="small">Consejo de Rebalanceo:</h6>
                <p class="small text-muted">${recommendationsData.rebalancing_advice}</p>
            </div>
        ` : ''}
        
        ${recommendationsData.risk_assessment ? `
            <div class="mb-3">
                <h6 class="small">Evaluación de Riesgo:</h6>
                <div class="d-flex justify-content-between">
                    <span>Nivel de Riesgo:</span>
                    <span class="badge bg-${recommendationsData.risk_assessment.level === 'ALTO' ? 'danger' : recommendationsData.risk_assessment.level === 'MEDIO' ? 'warning' : 'success'}">
                        ${recommendationsData.risk_assessment.level}
                    </span>
                </div>
                <small class="text-muted">${recommendationsData.risk_assessment.description}</small>
            </div>
        ` : ''}
    `;

    container.innerHTML = html;
}

function createOptimizationComparisonChart(optimizationData) {
    const ctx = document.getElementById('optimizationComparisonCanvas');
    
    // Destroy existing chart
    if (optimizationChart) {
        optimizationChart.destroy();
    }

    const methods = ['risk_parity', 'markowitz', 'hybrid', 'black_litterman'];
    const methodNames = ['Risk Parity', 'Markowitz', 'Híbrido', 'Black-Litterman'];
    const methodColors = [
        'rgba(23, 162, 184, 0.8)',   // Risk Parity - info blue
        'rgba(255, 193, 7, 0.8)',    // Markowitz - warning yellow
        'rgba(40, 167, 69, 0.8)',    // Hybrid - success green
        'rgba(220, 53, 69, 0.8)'     // Black-Litterman - danger red
    ];
    const borderColors = [
        'rgba(23, 162, 184, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(40, 167, 69, 1)',
        'rgba(220, 53, 69, 1)'
    ];

    // Prepare datasets for each optimization method
    const datasets = [];
    
    methods.forEach((method, index) => {
        if (optimizationData[method] && !optimizationData[method].error) {
            const data = optimizationData[method];
            const volatility = data.volatility * 100; // Convert to percentage
            const returnValue = data.expected_return * 100; // Convert to percentage
            const sharpeRatio = data.sharpe_ratio || 0;
            
            datasets.push({
                label: methodNames[index],
                data: [{
                    x: volatility,
                    y: returnValue,
                    sharpe: sharpeRatio,
                    method: methodNames[index],
                    weights: data.weights
                }],
                backgroundColor: methodColors[index],
                borderColor: borderColors[index],
                borderWidth: 2,
                pointRadius: 10,
                pointHoverRadius: 12,
                pointStyle: getPointStyle(method)
            });
        }
    });

    // Add current portfolio point if available
    if (portfolioData && portfolioData.performance) {
        const currentData = portfolioData.performance;
        datasets.push({
            label: 'Portafolio Actual',
            data: [{
                x: (currentData.volatility || 0) * 100,
                y: (currentData.annualized_return || 0) * 100,
                sharpe: currentData.sharpe_ratio || 0,
                method: 'Actual',
                weights: getCurrentPortfolioWeights()
            }],
            backgroundColor: 'rgba(108, 117, 125, 0.8)', // Gray
            borderColor: 'rgba(108, 117, 125, 1)',
            borderWidth: 3,
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: 'cross'
        });
    }

    // Calculate efficient frontier points (simplified)
    const frontierPoints = generateEfficientFrontier(optimizationData);

    optimizationChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Frontera Eficiente: Riesgo vs Retorno',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return context[0].dataset.label;
                        },
                        label: function(context) {
                            const point = context.raw;
                            return [
                                `Retorno: ${point.y.toFixed(2)}%`,
                                `Volatilidad: ${point.x.toFixed(2)}%`,
                                `Ratio Sharpe: ${point.sharpe.toFixed(3)}`
                            ];
                        },
                        afterLabel: function(context) {
                            const point = context.raw;
                            if (point.weights) {
                                const weightsList = Object.entries(point.weights)
                                    .map(([symbol, weight]) => `${symbol}: ${(weight * 100).toFixed(1)}%`)
                                    .join(', ');
                                return [``, `Pesos: ${weightsList}`];
                            }
                            return [];
                        }
                    }
                },
                annotation: {
                    annotations: {
                        optimalLine: {
                            type: 'line',
                            xMin: 0,
                            xMax: getMaxVolatility(datasets),
                            yMin: 0,
                            yMax: getMaxReturn(datasets),
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            borderWidth: 1,
                            borderDash: [5, 5],
                            label: {
                                display: false
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Volatilidad Anualizada (%)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    min: 0,
                    grid: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Retorno Esperado Anualizado (%)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'point'
            }
        }
    });

    // Add risk-free rate line if available
    addRiskFreeRateLine();
}

function getPointStyle(method) {
    const styles = {
        'risk_parity': 'circle',
        'markowitz': 'triangle',
        'hybrid': 'rect',
        'black_litterman': 'star'
    };
    return styles[method] || 'circle';
}

function getCurrentPortfolioWeights() {
    const weights = {};
    const totalWeight = portfolioAssets.reduce((sum, asset) => sum + asset.weight, 0);
    
    portfolioAssets.forEach(asset => {
        weights[asset.symbol] = asset.weight / totalWeight;
    });
    
    return weights;
}

function generateEfficientFrontier(optimizationData) {
    // Simplified efficient frontier - in a real implementation this would 
    // calculate multiple points along the frontier
    const frontierPoints = [];
    
    const methods = ['risk_parity', 'markowitz', 'hybrid', 'black_litterman'];
    const validPoints = methods
        .filter(method => optimizationData[method] && !optimizationData[method].error)
        .map(method => ({
            x: optimizationData[method].volatility * 100,
            y: optimizationData[method].expected_return * 100,
            sharpe: optimizationData[method].sharpe_ratio
        }))
        .sort((a, b) => a.x - b.x); // Sort by volatility

    return validPoints;
}

function getMaxVolatility(datasets) {
    let max = 0;
    datasets.forEach(dataset => {
        dataset.data.forEach(point => {
            if (point.x > max) max = point.x;
        });
    });
    return max * 1.1; // Add 10% margin
}

function getMaxReturn(datasets) {
    let max = 0;
    datasets.forEach(dataset => {
        dataset.data.forEach(point => {
            if (point.y > max) max = point.y;
        });
    });
    return max * 1.1; // Add 10% margin
}

function addRiskFreeRateLine() {
    // Add a horizontal line representing the risk-free rate
    const riskFreeRate = parseFloat(document.getElementById('riskFreeRate')?.value || 2.5);
    
    if (optimizationChart && optimizationChart.options.plugins.annotation) {
        optimizationChart.options.plugins.annotation.annotations.riskFreeLine = {
            type: 'line',
            yMin: riskFreeRate,
            yMax: riskFreeRate,
            borderColor: 'rgba(255, 99, 132, 0.6)',
            borderWidth: 2,
            borderDash: [10, 5],
            label: {
                display: true,
                content: `Tasa Libre de Riesgo: ${riskFreeRate}%`,
                position: 'end',
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                color: 'white',
                font: {
                    size: 10
                }
            }
        };
        optimizationChart.update();
    }
}

function createMetricsComparisonChart(optimizationData) {
    const ctx = document.getElementById('metricsComparisonCanvas');
    
    // Destroy existing chart
    if (metricsComparisonChart) {
        metricsComparisonChart.destroy();
    }

    const methods = ['risk_parity', 'markowitz', 'hybrid', 'black_litterman'];
    const methodNames = ['Risk Parity', 'Markowitz', 'Híbrido', 'Black-Litterman'];
    const colors = [
        'rgba(23, 162, 184, 0.8)',   // Risk Parity - blue
        'rgba(255, 193, 7, 0.8)',    // Markowitz - yellow
        'rgba(40, 167, 69, 0.8)',    // Hybrid - green
        'rgba(220, 53, 69, 0.8)'     // Black-Litterman - red
    ];

    // Prepare data for metrics comparison
    const returns = [];
    const volatilities = [];
    const sharpeRatios = [];
    const validMethods = [];
    const validColors = [];

    methods.forEach((method, index) => {
        if (optimizationData[method] && !optimizationData[method].error) {
            validMethods.push(methodNames[index]);
            validColors.push(colors[index]);
            returns.push((optimizationData[method].expected_return * 100).toFixed(2));
            volatilities.push((optimizationData[method].volatility * 100).toFixed(2));
            sharpeRatios.push((optimizationData[method].sharpe_ratio || 0).toFixed(3));
        }
    });

    metricsComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Retorno (%)', 'Volatilidad (%)', 'Ratio Sharpe'],
            datasets: validMethods.map((method, index) => ({
                label: method,
                data: [
                    parseFloat(returns[index]), 
                    parseFloat(volatilities[index]), 
                    parseFloat(sharpeRatios[index]) * 10 // Scale Sharpe for visibility
                ],
                backgroundColor: validColors[index],
                borderColor: validColors[index].replace('0.8', '1'),
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Comparación de Métricas'
                },
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 10,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            if (context.dataIndex === 2) {
                                return `Valor real: ${(context.raw / 10).toFixed(3)}`;
                            }
                            return '';
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Métricas'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valores'
                    },
                    beginAtZero: true
                }
            },
            indexAxis: 'x'
        }
    });
}

function createWeightsDistributionChart(optimizationData) {
    const ctx = document.getElementById('weightsDistributionCanvas');
    
    // Destroy existing chart
    if (weightsDistributionChart) {
        weightsDistributionChart.destroy();
    }

    const methods = ['risk_parity', 'markowitz', 'hybrid', 'black_litterman'];
    const methodNames = ['Risk Parity', 'Markowitz', 'Híbrido', 'Black-Litterman'];
    const colors = [
        'rgba(23, 162, 184, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(40, 167, 69, 0.8)',
        'rgba(220, 53, 69, 0.8)'
    ];

    // Get all unique symbols
    const allSymbols = new Set();
    methods.forEach(method => {
        if (optimizationData[method] && optimizationData[method].weights) {
            Object.keys(optimizationData[method].weights).forEach(symbol => {
                allSymbols.add(symbol);
            });
        }
    });

    const symbols = Array.from(allSymbols).sort();

    // Prepare datasets for each method
    const datasets = [];
    methods.forEach((method, index) => {
        if (optimizationData[method] && optimizationData[method].weights && !optimizationData[method].error) {
            const weights = symbols.map(symbol => 
                (optimizationData[method].weights[symbol] || 0) * 100
            );
            
            datasets.push({
                label: methodNames[index],
                data: weights,
                backgroundColor: colors[index],
                borderColor: colors[index].replace('0.8', '1'),
                borderWidth: 1
            });
        }
    });

    weightsDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: symbols,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribución de Pesos por Activo (%)'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Activos'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Peso (%)'
                    },
                    beginAtZero: true,
                    max: 100
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function showOptimizationResults() {
    document.getElementById('optimizationResults').style.display = 'block';
}

function hideOptimizationResults() {
    document.getElementById('optimizationResults').style.display = 'none';
}

// Optimization objective change handler
document.addEventListener('DOMContentLoaded', () => {
    const objectiveSelect = document.getElementById('optimizationObjective');
    const targetReturnInput = document.getElementById('targetReturn');
    
    if (objectiveSelect && targetReturnInput) {
        objectiveSelect.addEventListener('change', (e) => {
            const isTargetReturn = e.target.value === 'target_return';
            targetReturnInput.disabled = !isTargetReturn;
            if (isTargetReturn) {
                targetReturnInput.focus();
            }
        });
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Portfolio Builder initialized');
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        showError('Error: Chart.js no se pudo cargar. Verifica tu conexión a internet.');
        return;
    }
    
    console.log('Chart.js loaded successfully:', Chart.version);
    
    // Initialize with empty portfolio
    updatePortfolioComposition();
});