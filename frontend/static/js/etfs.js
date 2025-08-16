// ETF Dashboard JavaScript
const API_BASE_URL = 'http://localhost:8000';

// Global variables
let etfChart = null;
let etfVolumeChart = null;
let currentPeriod = '1mo';
let selectedETFs = [];
let allETFCategories = {};
let customETFs = JSON.parse(localStorage.getItem('customETFs') || '[]');
let customCategories = JSON.parse(localStorage.getItem('customCategories') || '{}');
let availableETFs = []; // List of all available ETFs from categories
let selectedETFsInModal = new Set(); // ETFs selected in the modal
let base100Mode = false;
let volumeVisible = false;
let currentCategoryName = null;
let cachedSummaryData = null;
let lastSummaryPeriod = null;

// Table sorting variables
let currentSortColumn = null;
let currentSortDirection = null;
let tableData = [];
let currentActionFilter = 'all';

// Chart update control
let chartUpdateTimeout = null;

// Color palette for charts
const ETF_COLORS = [
    'rgba(54, 162, 235, 1)',   // Blue
    'rgba(255, 99, 132, 1)',   // Red
    'rgba(75, 192, 192, 1)',   // Green
    'rgba(255, 206, 86, 1)',   // Yellow
    'rgba(153, 102, 255, 1)',  // Purple
    'rgba(255, 159, 64, 1)',   // Orange
    'rgba(199, 199, 199, 1)',  // Grey
    'rgba(83, 102, 255, 1)',   // Indigo
    'rgba(255, 99, 255, 1)',   // Pink
    'rgba(54, 235, 162, 1)'    // Teal
];

// DOM Elements
const loadingSpinner = document.getElementById('loadingSpinner');
const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const periodSelect = document.getElementById('periodSelect');
const categoriesContainer = document.getElementById('categoriesContainer');
const summarySection = document.getElementById('summarySection');
const chartSection = document.getElementById('chartSection');
const volumeChartSection = document.getElementById('volumeChartSection');

// Chart contexts
const etfCtx = document.getElementById('etfChart')?.getContext('2d');
const etfVolumeCtx = document.getElementById('etfVolumeChart')?.getContext('2d');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadETFCategories();
    preloadETFData(); // Pre-load data in background instead of showing table immediately
});

function setupEventListeners() {
    // Period selection
    periodSelect.addEventListener('change', function() {
        currentPeriod = this.value;
        // Invalidate cache when period changes
        cachedSummaryData = null;
        lastSummaryPeriod = null;
        
        // Pre-load data for new period in background
        preloadETFData();
        
        // If table is visible, reload it with new period
        if (document.getElementById('summarySection').style.display !== 'none') {
            loadETFSummary();
        }
    });

    // Quick action buttons
    document.getElementById('loadSummaryBtn').addEventListener('click', loadETFSummary);
    document.getElementById('compareTopBtn').addEventListener('click', compareTopETFs);
    document.getElementById('sectorsBtn').addEventListener('click', showSectorETFs);
    document.getElementById('addCustomBtn').addEventListener('click', function() {
        console.log('Add custom ETF button clicked');
        showCustomETFModal();
    });
    document.getElementById('saveCustomETFBtn').addEventListener('click', function() {
        console.log('Save custom ETF button clicked');
        saveCustomETF();
    });
    
    // Custom category controls
    document.getElementById('saveCustomCategoryBtn').addEventListener('click', saveCustomCategory);
    document.getElementById('deleteCategoryBtn').addEventListener('click', deleteCustomCategory);
    
    // ETF preview and selection in category modal
    document.getElementById('categoryETFs').addEventListener('input', updateETFPreview);
    document.getElementById('etfSearch').addEventListener('input', filterETFList);
    document.getElementById('clearSearchBtn').addEventListener('click', clearETFSearch);
    document.getElementById('selectAllBtn').addEventListener('click', selectAllETFs);
    document.getElementById('selectNoneBtn').addEventListener('click', selectNoneETFs);
    
    // Tab change event to sync between manual and list methods
    document.getElementById('manual-tab').addEventListener('shown.bs.tab', syncFromListToManual);
    document.getElementById('list-tab').addEventListener('shown.bs.tab', syncFromManualToList);

    // Chart controls
    document.getElementById('toggleBase100ETF').addEventListener('click', toggleBase100Mode);
    document.getElementById('toggleVolumeETF').addEventListener('click', toggleVolumeChart);

    // Table controls
    document.getElementById('refreshTableBtn')?.addEventListener('click', loadETFSummary);
    document.getElementById('exportTableBtn')?.addEventListener('click', exportTableData);

    // Categories toggle
    document.getElementById('toggleCategoriesBtn').addEventListener('click', toggleCategoriesSection);
    
    // Chart toggles
    document.getElementById('toggleChartBtn').addEventListener('click', toggleChartSection);
    document.getElementById('toggleVolumeChartBtn').addEventListener('click', toggleVolumeChartSection);
    document.getElementById('toggleSummaryBtn').addEventListener('click', toggleSummarySection);
    
    // Table sorting
    setupTableSorting();
    
    // Action filter
    document.getElementById('actionFilter').addEventListener('change', function() {
        currentActionFilter = this.value;
        applyActionFilter();
    });
}

async function loadETFCategories() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/etfs/categories`);
        const data = await response.json();
        
        // Extract all available ETFs from categories
        availableETFs = [];
        Object.entries(data.categories).forEach(([categoryKey, categoryData]) => {
            Object.entries(categoryData.etfs).forEach(([symbol, description]) => {
                availableETFs.push({
                    symbol: symbol,
                    name: description,
                    category: categoryData.name
                });
            });
        });
        
        // Sort ETFs alphabetically by symbol
        availableETFs.sort((a, b) => a.symbol.localeCompare(b.symbol));
        
        // Merge default categories with custom categories
        allETFCategories = { ...data.categories, ...customCategories };
        displayCategories(data.categories); // Pass only default categories, custom ones are added in displayCategories
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading ETF categories:', error);
        showError('Error cargando categorías de ETFs: ' + error.message);
    }
}

function displayCategories(categories) {
    categoriesContainer.innerHTML = '';
    
    // Combine default categories with custom categories
    const allCategories = { ...categories, ...customCategories };
    
    Object.entries(allCategories).forEach(([categoryKey, categoryData]) => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'col-md-6 col-lg-4 col-xl-3 mb-3';
        
        const etfCount = Object.keys(categoryData.etfs).length;
        const etfList = Object.entries(categoryData.etfs).slice(0, 3).map(([symbol, desc]) => 
            `<small class="text-muted">${symbol}</small>`
        ).join(', ');
        
        const isCustom = customCategories.hasOwnProperty(categoryKey);
        const badgeColor = isCustom ? (categoryData.color || 'primary') : 'primary';
        const editButton = isCustom ? `
            <button class="btn btn-outline-secondary btn-sm ms-1 edit-category-btn" data-category="${categoryKey}" title="Editar">
                <i class="bi bi-pencil"></i>
            </button>
        ` : '';
        
        categoryCard.innerHTML = `
            <div class="card h-100 border-0 shadow-sm category-card" data-category="${categoryKey}">
                <div class="card-body">
                    <h6 class="card-title text-${badgeColor} fw-bold">
                        ${categoryData.name}
                        ${isCustom ? '<i class="bi bi-star-fill ms-1" title="Categoría Personalizada"></i>' : ''}
                    </h6>
                    <p class="card-text small text-muted mb-2">${categoryData.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="badge bg-${badgeColor}">${etfCount} ETFs</span>
                        <div>
                            <button class="btn btn-outline-primary btn-sm view-category-btn" data-category="${categoryKey}">
                                <i class="bi bi-eye"></i> Ver
                            </button>
                            ${editButton}
                        </div>
                    </div>
                    <div class="mt-2">
                        ${etfList}${etfCount > 3 ? '...' : ''}
                    </div>
                </div>
            </div>
        `;
        
        categoriesContainer.appendChild(categoryCard);
    });
    
    // Add "Create Category" card
    const addCategoryCard = document.createElement('div');
    addCategoryCard.className = 'col-md-6 col-lg-4 col-xl-3 mb-3';
    addCategoryCard.innerHTML = `
        <div class="card h-100 border-2 border-dashed category-card-add" style="border-color: #dee2e6 !important;">
            <div class="card-body d-flex flex-column justify-content-center align-items-center text-center">
                <i class="bi bi-plus-circle display-4 text-muted mb-3"></i>
                <h6 class="card-title text-muted mb-2">Crear Categoría</h6>
                <p class="card-text small text-muted mb-3">Agrega tu propia categoría personalizada de ETFs</p>
                <button class="btn btn-outline-primary btn-sm" id="addCategoryBtn">
                    <i class="bi bi-plus"></i> Crear
                </button>
            </div>
        </div>
    `;
    categoriesContainer.appendChild(addCategoryCard);
    
    // Add event listeners
    document.querySelectorAll('.view-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            showCategoryETFs(category);
        });
    });
    
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            editCustomCategory(category);
        });
    });
    
    document.getElementById('addCategoryBtn').addEventListener('click', showCustomCategoryModal);
}

function toggleCategoriesSection() {
    const categoriesBody = document.getElementById('categoriesBody');
    const toggleIcon = document.getElementById('toggleCategoriesIcon');
    const toggleText = document.getElementById('toggleCategoriesText');
    
    if (categoriesBody.style.display === 'none') {
        // Show categories
        categoriesBody.style.display = 'block';
        toggleIcon.className = 'bi bi-chevron-up';
        toggleText.textContent = 'Ocultar';
    } else {
        // Hide categories
        categoriesBody.style.display = 'none';
        toggleIcon.className = 'bi bi-chevron-down';
        toggleText.textContent = 'Mostrar';
    }
}

function toggleChartSection() {
    const chartBody = document.getElementById('chartBody');
    const toggleIcon = document.getElementById('toggleChartIcon');
    const toggleText = document.getElementById('toggleChartText');
    
    if (chartBody.style.display === 'none') {
        // Show chart
        chartBody.style.display = 'block';
        toggleIcon.className = 'bi bi-chevron-up';
        toggleText.textContent = 'Ocultar';
    } else {
        // Hide chart
        chartBody.style.display = 'none';
        toggleIcon.className = 'bi bi-chevron-down';
        toggleText.textContent = 'Mostrar';
    }
}

function toggleVolumeChartSection() {
    const volumeChartBody = document.getElementById('volumeChartBody');
    const toggleIcon = document.getElementById('toggleVolumeChartIcon');
    const toggleText = document.getElementById('toggleVolumeChartText');
    
    if (volumeChartBody.style.display === 'none') {
        // Show volume chart
        volumeChartBody.style.display = 'block';
        toggleIcon.className = 'bi bi-chevron-up';
        toggleText.textContent = 'Ocultar';
    } else {
        // Hide volume chart
        volumeChartBody.style.display = 'none';
        toggleIcon.className = 'bi bi-chevron-down';
        toggleText.textContent = 'Mostrar';
    }
}

function toggleSummarySection() {
    const summaryBody = document.getElementById('summaryBody');
    const toggleIcon = document.getElementById('toggleSummaryIcon');
    const toggleText = document.getElementById('toggleSummaryText');
    
    if (summaryBody.style.display === 'none') {
        // Show summary
        summaryBody.style.display = 'block';
        toggleIcon.className = 'bi bi-chevron-up';
        toggleText.textContent = 'Ocultar';
    } else {
        // Hide summary
        summaryBody.style.display = 'none';
        toggleIcon.className = 'bi bi-chevron-down';
        toggleText.textContent = 'Mostrar';
    }
}

// Table sorting functions
function setupTableSorting() {
    // Remove any existing event listeners first to prevent duplicates
    const sortableHeaders = document.querySelectorAll('#etfSummaryTable th.sortable');
    sortableHeaders.forEach(header => {
        // Clone node to remove all event listeners
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
    });
    
    // Add click listeners to all sortable headers (get them again after cloning)
    const newSortableHeaders = document.querySelectorAll('#etfSummaryTable th.sortable');
    newSortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const column = this.dataset.column;
            const type = this.dataset.type;
            sortTable(column, type);
        });
        // Mark as having listeners to prevent duplicates
        header.setAttribute('data-has-listeners', 'true');
    });
}

function sortTable(column, type) {
    // Determine sort direction
    let direction = 'asc';
    if (currentSortColumn === column && currentSortDirection === 'asc') {
        direction = 'desc';
    }
    
    // Update sort state
    currentSortColumn = column;
    currentSortDirection = direction;
    
    // Update visual indicators
    updateSortIndicators(column, direction);
    
    // Sort the data
    const sortedData = [...tableData].sort((a, b) => {
        return compareValues(a[column], b[column], type, direction);
    });
    
    // Re-render the table
    renderSortedTable(sortedData);
}

function compareValues(a, b, type, direction) {
    let aVal = a;
    let bVal = b;
    
    if (type === 'number') {
        // Extract numeric values (remove $ signs, commas, % signs)
        aVal = parseFloat(String(a).replace(/[$,%]/g, '')) || 0;
        bVal = parseFloat(String(b).replace(/[$,%]/g, '')) || 0;
    } else if (type === 'text') {
        // Convert to lowercase for case-insensitive sorting
        aVal = String(a).toLowerCase();
        bVal = String(b).toLowerCase();
    }
    
    let result = 0;
    if (aVal < bVal) result = -1;
    if (aVal > bVal) result = 1;
    
    return direction === 'desc' ? -result : result;
}

function updateSortIndicators(activeColumn, direction) {
    // Remove all existing sort classes and reset icons
    const headers = document.querySelectorAll('#etfSummaryTable th.sortable');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) {
            icon.className = 'bi bi-arrow-down-up sort-icon';
        }
    });
    
    // Add sort class to active column and update icon if specified
    if (activeColumn && direction) {
        const activeHeader = document.querySelector(`#etfSummaryTable th[data-column="${activeColumn}"]`);
        if (activeHeader) {
            activeHeader.classList.add(`sort-${direction}`);
            const icon = activeHeader.querySelector('.sort-icon');
            if (icon) {
                if (direction === 'asc') {
                    icon.className = 'bi bi-arrow-up sort-icon';
                } else {
                    icon.className = 'bi bi-arrow-down sort-icon';
                }
            }
        }
    }
}

function renderSortedTable(sortedData) {
    const tableBody = document.querySelector('#etfSummaryTable tbody');
    tableBody.innerHTML = '';
    
    sortedData.forEach(rowData => {
        const row = document.createElement('tr');
        row.innerHTML = rowData.html;
        tableBody.appendChild(row);
    });
    
    // Re-add event listeners to action buttons
    addTableEventListeners();
    
    // Update button states to reflect current chart content
    updateTableButtonsAfterChartChange();
}

function addTableEventListeners() {
    // Add event listeners to action buttons
    document.querySelectorAll('.etf-detail-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showETFDetails(this.dataset.symbol);
        });
    });
    
    // Handle chart toggle buttons (add/remove)
    document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const symbol = this.dataset.symbol;
            if (this.classList.contains('add-to-chart-btn')) {
                addETFToChart(symbol);
            } else if (this.classList.contains('remove-from-chart-btn')) {
                removeETFFromChart(symbol);
            }
        });
    });
}

function resetSortingState() {
    // Reset sorting state when changing categories or datasets
    currentSortColumn = null;
    currentSortDirection = null;
    updateSortIndicators(null, null);
    
    // Reset action filter to show all
    currentActionFilter = 'all';
    const actionFilterSelect = document.getElementById('actionFilter');
    if (actionFilterSelect) {
        actionFilterSelect.value = 'all';
    }
}

function applyActionFilter() {
    // Filter tableData based on selected action filter
    let filteredData = tableData;
    
    if (currentActionFilter === 'add') {
        // Show only ETFs that can be added (not in chart)
        filteredData = tableData.filter(rowData => !selectedETFs.includes(rowData.symbol));
    } else if (currentActionFilter === 'remove') {
        // Show only ETFs that can be removed (in chart)
        filteredData = tableData.filter(rowData => selectedETFs.includes(rowData.symbol));
    }
    // 'all' shows everything, no filtering needed
    
    // Re-render the table with filtered data
    renderFilteredTable(filteredData);
}

function renderFilteredTable(filteredData) {
    const tableBody = document.querySelector('#etfSummaryTable tbody');
    tableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        // Show "no results" message
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-muted">
                    <i class="bi bi-search"></i>
                    No se encontraron ETFs con el filtro seleccionado
                </td>
            </tr>
        `;
        return;
    }
    
    filteredData.forEach(rowData => {
        const row = document.createElement('tr');
        
        // Re-generate the HTML to ensure button states are current
        const isInChart = selectedETFs.includes(rowData.symbol);
        const chartButtonClass = isInChart ? 'btn-outline-danger remove-from-chart-btn' : 'btn-outline-success add-to-chart-btn';
        const chartButtonIcon = isInChart ? 'bi-dash' : 'bi-plus';
        const chartButtonTitle = isInChart ? 'Quitar de gráfica' : 'Agregar a gráfica';
        
        const returnClass = rowData.return >= 0 ? 'text-success' : 'text-danger';
        const returnIcon = rowData.return >= 0 ? 'bi-arrow-up' : 'bi-arrow-down';
        
        row.innerHTML = `
            <td><strong>${rowData.symbol}</strong></td>
            <td class="small">${rowData.name}</td>
            <td class="small"><span class="badge bg-secondary">${rowData.category}</span></td>
            <td>$${rowData.price}</td>
            <td class="${returnClass}">
                <i class="bi ${returnIcon}"></i>
                ${rowData.return}%
            </td>
            <td>${rowData.volatility}%</td>
            <td>${rowData.volume.toLocaleString()}</td>
            <td>$${rowData.max}</td>
            <td>$${rowData.min}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm etf-detail-btn" data-symbol="${rowData.symbol}">
                        <i class="bi bi-info"></i>
                    </button>
                    <button class="btn ${chartButtonClass} btn-sm chart-toggle-btn" data-symbol="${rowData.symbol}" title="${chartButtonTitle}">
                        <i class="bi ${chartButtonIcon}"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Re-add event listeners to action buttons
    addTableEventListeners();
}

async function preloadETFData() {
    try {
        // Show subtle background loading indicator
        showPreloadIndicator(true);
        
        // Pre-load data silently in background
        const response = await fetch(`${API_BASE_URL}/etfs/summary/${currentPeriod}`);
        const data = await response.json();
        
        if (data.success) {
            // Cache the data without showing the table
            cachedSummaryData = data.categories;
            lastSummaryPeriod = currentPeriod;
            console.log('ETF data pre-loaded successfully');
        }
        
        // Hide indicator after a brief delay for user feedback
        setTimeout(() => {
            showPreloadIndicator(false);
        }, 1000);
        
    } catch (error) {
        console.error('Error pre-loading ETF data:', error);
        showPreloadIndicator(false);
        // Don't show error to user for background loading
    }
}

async function loadETFSummary() {
    try {
        // If we have cached data for current period, use it immediately
        if (cachedSummaryData && lastSummaryPeriod === currentPeriod) {
            displayETFSummaryTable(cachedSummaryData);
            summarySection.style.display = 'block';
            return;
        }
        
        // Otherwise, fetch fresh data
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/etfs/summary/${currentPeriod}`);
        const data = await response.json();
        
        if (data.success) {
            // Cache the data
            cachedSummaryData = data.categories;
            lastSummaryPeriod = currentPeriod;
            
            displayETFSummaryTable(data.categories);
            summarySection.style.display = 'block';
        } else {
            showError('Error cargando resumen de ETFs');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading ETF summary:', error);
        showError('Error cargando resumen de ETFs: ' + error.message);
    }
}

async function loadCategoryETFSummary(categoryKey, categoryData) {
    try {
        // Get the ETF symbols for this category
        const etfSymbols = Object.keys(categoryData.etfs);
        
        // Fetch summary data for all ETFs in this category
        const response = await fetch(`${API_BASE_URL}/etfs/summary/${currentPeriod}`);
        const data = await response.json();
        
        if (data.success) {
            displayCategoryETFSummary(data.categories, categoryKey, categoryData, etfSymbols);
        } else {
            showError('Error cargando resumen de ETFs de la categoría');
        }
        
    } catch (error) {
        console.error('Error loading category ETF summary:', error);
        showError('Error cargando resumen de ETFs de la categoría: ' + error.message);
    }
}

function displayCategoryETFSummary(allCategories, categoryKey, categoryData, etfSymbols) {
    // Filter the data to show only ETFs from the selected category
    const filteredData = {};
    filteredData[categoryKey] = {
        name: categoryData.name,
        description: categoryData.description,
        etfs: {}
    };
    
    // Copy only the ETFs that belong to this category and have summary data
    Object.entries(allCategories).forEach(([catKey, catData]) => {
        Object.entries(catData.etfs).forEach(([symbol, etfData]) => {
            if (etfSymbols.includes(symbol) && etfData.summary) {
                filteredData[categoryKey].etfs[symbol] = etfData;
            }
        });
    });
    
    // Reset sorting when changing categories (different dataset)
    resetSortingState();
    
    displayETFSummaryTable(filteredData, categoryData.name);
    summarySection.style.display = 'block';
}

function displayETFSummaryTable(categories, categoryName = null) {
    const tableBody = document.querySelector('#etfSummaryTable tbody');
    const tableTitle = document.querySelector('#summarySection .card-header h5');
    
    // Show loading state for table
    showTableLoading(true);
    
    // Update title based on whether we're showing a specific category or all ETFs
    if (categoryName) {
        tableTitle.innerHTML = `
            <i class="bi bi-table"></i>
            Resumen de ETFs - ${categoryName}
        `;
    } else {
        tableTitle.innerHTML = `
            <i class="bi bi-table"></i>
            Resumen de ETFs
        `;
    }
    
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Use setTimeout to allow UI to update and show loading state
    setTimeout(() => {
        populateTableRows(categories, tableBody);
        showTableLoading(false);
        // Ensure sorting is set up after table is populated (only if headers have changed)
        if (!document.querySelector('#etfSummaryTable th.sortable[data-has-listeners="true"]')) {
            setupTableSorting();
        }
    }, 50);
}

function populateTableRows(categories, tableBody) {
    // Clear existing table data
    tableData = [];
    
    Object.entries(categories).forEach(([categoryKey, categoryData]) => {
        Object.entries(categoryData.etfs).forEach(([symbol, etfData]) => {
            // Handle both default ETFs (with summary) and custom ETFs (may not have summary)
            let summary = null;
            let name = '';
            
            if (etfData.summary) {
                // Default ETF with backend summary data
                summary = etfData.summary;
                name = etfData.description.split(' - ')[0];
            } else if (customCategories[categoryKey]) {
                // Custom category - try to use ETF description or symbol
                name = etfData || symbol; // Use provided description or symbol as fallback
                
                // Check if this is a custom ETF we have stored
                const customETF = customETFs.find(etf => etf.symbol === symbol);
                if (customETF) {
                    name = customETF.name;
                }
                
                // Create basic summary data for display (will show as unavailable for custom ETFs)
                summary = {
                    current_price: 'N/A',
                    total_return: 'N/A',
                    volatility: 'N/A',
                    avg_volume: 'N/A',
                    max_price: 'N/A',
                    min_price: 'N/A'
                };
            }
            
            if (summary) {
                const returnClass = (typeof summary.total_return === 'number' && summary.total_return >= 0) ? 'text-success' : 'text-danger';
                const returnIcon = (typeof summary.total_return === 'number' && summary.total_return >= 0) ? 'bi-arrow-up' : 'bi-arrow-down';
                
                // Determine if ETF is already in chart
                const isInChart = selectedETFs.includes(symbol);
                const chartButtonClass = isInChart ? 'btn-outline-danger remove-from-chart-btn' : 'btn-outline-success add-to-chart-btn';
                const chartButtonIcon = isInChart ? 'bi-dash' : 'bi-plus';
                const chartButtonTitle = isInChart ? 'Quitar de gráfica' : 'Agregar a gráfica';
                
                // Determine badge color for category
                const isCustomCategory = customCategories[categoryKey];
                const badgeColor = isCustomCategory ? (categoryData.color || 'secondary') : 'secondary';
                
                // Store data for sorting
                const rowData = {
                    symbol: symbol,
                    name: name,
                    category: categoryData.name,
                    price: typeof summary.current_price === 'number' ? summary.current_price : 0,
                    return: typeof summary.total_return === 'number' ? summary.total_return : 0,
                    volatility: typeof summary.volatility === 'number' ? summary.volatility : 0,
                    volume: typeof summary.avg_volume === 'number' ? summary.avg_volume : 0,
                    max: typeof summary.max_price === 'number' ? summary.max_price : 0,
                    min: typeof summary.min_price === 'number' ? summary.min_price : 0,
                    html: `
                        <td><strong>${symbol}</strong></td>
                        <td class="small">${name}</td>
                        <td class="small"><span class="badge bg-${badgeColor}">${categoryData.name}</span></td>
                        <td>${typeof summary.current_price === 'number' ? '$' + summary.current_price : summary.current_price}</td>
                        <td class="${typeof summary.total_return === 'number' ? returnClass : 'text-muted'}">
                            ${typeof summary.total_return === 'number' ? `<i class="bi ${returnIcon}"></i> ${summary.total_return}%` : summary.total_return}
                        </td>
                        <td>${typeof summary.volatility === 'number' ? summary.volatility + '%' : summary.volatility}</td>
                        <td>${typeof summary.avg_volume === 'number' ? summary.avg_volume.toLocaleString() : summary.avg_volume}</td>
                        <td>${typeof summary.max_price === 'number' ? '$' + summary.max_price : summary.max_price}</td>
                        <td>${typeof summary.min_price === 'number' ? '$' + summary.min_price : summary.min_price}</td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary btn-sm etf-detail-btn" data-symbol="${symbol}">
                                    <i class="bi bi-info"></i>
                                </button>
                                <button class="btn ${chartButtonClass} btn-sm chart-toggle-btn" data-symbol="${symbol}" title="${chartButtonTitle}">
                                    <i class="bi ${chartButtonIcon}"></i>
                                </button>
                            </div>
                        </td>
                    `
                };
                
                tableData.push(rowData);
                
                // Create and append row
                const row = document.createElement('tr');
                row.innerHTML = rowData.html;
                tableBody.appendChild(row);
            }
        });
    });
    
    // Add event listeners to action buttons
    addTableEventListeners();
    
    // Only reset sorting state when it's a completely new dataset (not when reloading same data)
    // Don't reset sorting for "Cargar Resumen" - let user maintain their sort preference
}

async function compareTopETFs() {
    // Compare top 5 broad market ETFs
    const topETFs = ['SPY', 'VOO', 'VTI', 'IVV', 'QQQ'];
    await compareETFs(topETFs, 'Top 5 ETFs del Mercado');
}

async function showSectorETFs() {
    // Show all sector ETFs
    const sectorETFs = Object.keys(allETFCategories.sectors?.etfs || {});
    await compareETFs(sectorETFs, 'ETFs por Sectores');
}

async function compareETFs(etfSymbols, categoryName = null) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/etfs/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                etfs: etfSymbols,
                period: currentPeriod,
                interval: '1d',
                include_summary: true
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            selectedETFs = etfSymbols;
            createETFChart(data.results, categoryName);
            chartSection.style.display = 'block';
        } else {
            showError('Error comparando ETFs');
        }
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error comparing ETFs:', error);
        showError('Error comparando ETFs: ' + error.message);
    }
}

async function compareETFsChartOnly(etfSymbols, categoryName = null) {
    try {
        const response = await fetch(`${API_BASE_URL}/etfs/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                etfs: etfSymbols,
                period: currentPeriod,
                interval: '1d',
                include_summary: false  // Don't need summary data for chart-only updates
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update only the chart, don't touch the table
            createETFChart(data.results, categoryName);
            chartSection.style.display = 'block';
        } else {
            showError('Error actualizando gráfica');
        }
        
    } catch (error) {
        console.error('Error updating chart:', error);
        showError('Error actualizando gráfica: ' + error.message);
    }
}

function createETFChart(etfData, categoryName = null) {
    if (etfChart) {
        etfChart.destroy();
    }
    
    // Store current category name for future use
    currentCategoryName = categoryName;
    
    // Update the chart section title
    const chartTitle = document.querySelector('#chartSection .card-header h5');
    if (categoryName) {
        chartTitle.innerHTML = `
            <i class="bi bi-graph-up"></i>
            Comparación de ETFs - ${categoryName}
        `;
    } else {
        chartTitle.innerHTML = `
            <i class="bi bi-graph-up"></i>
            Comparación de ETFs
        `;
    }
    
    const datasets = [];
    const allLabels = new Set();
    
    // Collect all unique timestamps
    Object.values(etfData).forEach(etf => {
        if (etf.data && !etf.error) {
            etf.data.forEach(point => {
                allLabels.add(point.Date || point.Datetime);
            });
        }
    });
    
    const sortedLabels = Array.from(allLabels).sort().map(label => new Date(label));
    
    // Create datasets for each ETF
    let colorIndex = 0;
    Object.entries(etfData).forEach(([symbol, etf]) => {
        if (etf.data && !etf.error) {
            const color = ETF_COLORS[colorIndex % ETF_COLORS.length];
            
            let dataPoints = sortedLabels.map(label => {
                const found = etf.data.find(point => {
                    const pointDate = new Date(point.Date || point.Datetime);
                    return Math.abs(pointDate - label) < 60000; // 1 minute tolerance
                });
                return found ? found.Close : null;
            });
            
            // Apply Base 100 normalization if enabled
            if (base100Mode) {
                dataPoints = normalizeToBase100(dataPoints);
            }
            
            datasets.push({
                label: symbol,
                data: dataPoints,
                borderColor: color,
                backgroundColor: color.replace('1)', '0.1)'),
                borderWidth: 2,
                fill: false,
                tension: 0.1
            });
            
            colorIndex++;
        }
    });
    
    etfChart = new Chart(etfCtx, {
        type: 'line',
        data: {
            labels: sortedLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                title: {
                    display: true,
                    text: categoryName ? `${categoryName} (${currentPeriod})` : `Comparación de ETFs (${currentPeriod})`
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            day: 'MMM dd',
                            week: 'MMM dd',
                            month: 'MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Tiempo'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: base100Mode ? 'Base 100 (%)' : 'Precio (USD)'
                    },
                    ticks: {
                        callback: function(value) {
                            return base100Mode ? value.toFixed(1) + '%' : '$' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    // Create volume chart if requested
    if (volumeVisible) {
        createETFVolumeChart(etfData, sortedLabels);
    }
}

function createETFVolumeChart(etfData, labels) {
    if (etfVolumeChart) {
        etfVolumeChart.destroy();
    }
    
    const datasets = [];
    let colorIndex = 0;
    
    Object.entries(etfData).forEach(([symbol, etf]) => {
        if (etf.data && !etf.error) {
            const color = ETF_COLORS[colorIndex % ETF_COLORS.length];
            
            const volumePoints = labels.map(label => {
                const found = etf.data.find(point => {
                    const pointDate = new Date(point.Date || point.Datetime);
                    return Math.abs(pointDate - label) < 60000;
                });
                return found ? found.Volume : null;
            });
            
            datasets.push({
                label: `${symbol} Volumen`,
                data: volumePoints,
                backgroundColor: color.replace('1)', '0.6)'),
                borderColor: color,
                borderWidth: 1
            });
            
            colorIndex++;
        }
    });
    
    etfVolumeChart = new Chart(etfVolumeCtx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Volumen de ETFs'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        displayFormats: {
                            day: 'MMM dd',
                            week: 'MMM dd',
                            month: 'MMM yyyy'
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Volumen'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
    
    volumeChartSection.style.display = 'block';
}

function toggleBase100Mode() {
    base100Mode = !base100Mode;
    const btn = document.getElementById('toggleBase100ETF');
    
    if (base100Mode) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
    
    // Recreate only the chart if there are selected ETFs (don't reload table)
    if (selectedETFs.length > 0) {
        compareETFsChartOnly(selectedETFs, currentCategoryName);
    }
}

function toggleVolumeChart() {
    volumeVisible = !volumeVisible;
    const btn = document.getElementById('toggleVolumeETF');
    
    if (volumeVisible) {
        btn.classList.add('active');
        if (selectedETFs.length > 0) {
            compareETFsChartOnly(selectedETFs, currentCategoryName);
        }
    } else {
        btn.classList.remove('active');
        volumeChartSection.style.display = 'none';
    }
}

function normalizeToBase100(prices) {
    if (!prices || prices.length === 0) return [];
    
    const firstPrice = prices.find(price => price !== null && price !== undefined);
    if (!firstPrice) return prices;
    
    return prices.map(price => {
        if (price === null || price === undefined) return null;
        return (price / firstPrice) * 100;
    });
}

function addETFToChart(symbol) {
    if (!selectedETFs.includes(symbol)) {
        // 1. Update selectedETFs array immediately
        selectedETFs.push(symbol);
        
        // 2. Update table buttons immediately for instant visual feedback
        updateTableButtonsAfterChartChange();
        
        // 3. Update chart asynchronously (don't block UI)
        updateChartAsync(selectedETFs, currentCategoryName);
        
        // 4. Show chart section if it was hidden
        chartSection.style.display = 'block';
    }
}

function removeETFFromChart(symbol) {
    const index = selectedETFs.indexOf(symbol);
    if (index > -1) {
        // 1. Update selectedETFs array immediately
        selectedETFs.splice(index, 1);
        
        // 2. Update table buttons immediately for instant visual feedback
        updateTableButtonsAfterChartChange();
        
        if (selectedETFs.length > 0) {
            // 3. Update chart asynchronously (don't block UI)
            updateChartAsync(selectedETFs, currentCategoryName);
        } else {
            // 4. Hide and destroy charts immediately if no ETFs left
            chartSection.style.display = 'none';
            volumeChartSection.style.display = 'none';
            if (etfChart) {
                etfChart.destroy();
                etfChart = null;
            }
            if (etfVolumeChart) {
                etfVolumeChart.destroy();
                etfVolumeChart = null;
            }
        }
    }
}

async function updateChartAsync(etfSymbols, categoryName) {
    // Clear any existing timeout to avoid multiple simultaneous requests
    if (chartUpdateTimeout) {
        clearTimeout(chartUpdateTimeout);
    }
    
    // Debounce chart updates to avoid multiple rapid calls
    chartUpdateTimeout = setTimeout(async () => {
        try {
            // Show a subtle loading indicator on chart
            const chartTitle = document.querySelector('#chartSection .card-header h5');
            const originalTitle = chartTitle.innerHTML;
            
            // Only show loading if chart update will take time
            const loadingTimeout = setTimeout(() => {
                chartTitle.innerHTML = `
                    <i class="bi bi-graph-up"></i>
                    Actualizando gráfica...
                    <div class="spinner-border spinner-border-sm ms-2" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                `;
            }, 300); // Only show loading after 300ms
            
            const response = await fetch(`${API_BASE_URL}/etfs/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    etfs: etfSymbols,
                    period: currentPeriod,
                    interval: '1d',
                    include_summary: false
                })
            });
            
            const data = await response.json();
            
            // Clear the loading timeout since we're done
            clearTimeout(loadingTimeout);
            
            if (data.success) {
                createETFChart(data.results, categoryName);
            } else {
                console.error('Error updating chart:', data);
                // Restore original title on error
                chartTitle.innerHTML = originalTitle;
            }
            
        } catch (error) {
            console.error('Error updating chart:', error);
            // Don't show error to user for chart updates, just log it
        }
        
        chartUpdateTimeout = null;
    }, 100); // Wait 100ms before making the request
}

function updateTableButtonsAfterChartChange() {
    // Update all chart toggle buttons to reflect current state
    let hasChanges = false;
    
    document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
        const symbol = btn.dataset.symbol;
        const isInChart = selectedETFs.includes(symbol);
        const currentlyShowingRemove = btn.classList.contains('remove-from-chart-btn');
        
        // Only update if state actually changed
        if ((isInChart && !currentlyShowingRemove) || (!isInChart && currentlyShowingRemove)) {
            hasChanges = true;
            
            // Remove existing classes
            btn.classList.remove('btn-outline-success', 'btn-outline-danger', 'add-to-chart-btn', 'remove-from-chart-btn');
            
            // Add appropriate classes and content
            if (isInChart) {
                btn.classList.add('btn-outline-danger', 'remove-from-chart-btn');
                btn.innerHTML = '<i class="bi bi-dash"></i>';
                btn.title = 'Quitar de gráfica';
            } else {
                btn.classList.add('btn-outline-success', 'add-to-chart-btn');
                btn.innerHTML = '<i class="bi bi-plus"></i>';
                btn.title = 'Agregar a gráfica';
            }
        }
    });
    
    // Only re-apply action filter if there were actual changes
    if (hasChanges) {
        applyActionFilter();
    }
}

async function showCategoryETFs(categoryKey) {
    // Check both default and custom categories
    const category = allETFCategories[categoryKey] || customCategories[categoryKey];
    if (category) {
        const etfSymbols = Object.keys(category.etfs);
        
        try {
            showLoading(true);
            
            // Check which ETFs we need to fetch (not in cache)
            const newETFs = [];
            const cachedETFs = [];
            
            etfSymbols.forEach(symbol => {
                const isInCache = cachedSummaryData && 
                                 Object.values(cachedSummaryData).some(cat => 
                                     cat.etfs && cat.etfs[symbol] && cat.etfs[symbol].summary
                                 );
                if (isInCache) {
                    cachedETFs.push(symbol);
                } else {
                    newETFs.push(symbol);
                }
            });
            
            console.log(`ETFs en cache: ${cachedETFs.length}, ETFs nuevos: ${newETFs.length}`);
            
            // Always fetch chart data for all ETFs (needed for visualization)
            const chartResponse = await fetch(`${API_BASE_URL}/etfs/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    etfs: etfSymbols,
                    period: currentPeriod,
                    interval: '1d',
                    include_summary: newETFs.length > 0 // Only request summary for new ETFs
                })
            });
            
            const chartData = await chartResponse.json();
            
            // Process both chart and table together
            if (chartData.success) {
                // Update selectedETFs BEFORE displaying table
                selectedETFs = etfSymbols;
                
                // Update cache with new ETF data
                if (newETFs.length > 0) {
                    await updateCacheWithNewETFs(newETFs, chartData.results);
                }
                
                // For custom categories, create summary data from chart data if needed
                if (customCategories[categoryKey]) {
                    const customSummaryData = createCustomCategorySummary(
                        categoryKey, 
                        category, 
                        chartData.results, 
                        cachedSummaryData || {}
                    );
                    displayCategoryETFSummary(customSummaryData, categoryKey, category, etfSymbols);
                } else {
                    // Regular category - use cached data
                    if (cachedSummaryData) {
                        displayCategoryETFSummary(cachedSummaryData, categoryKey, category, etfSymbols);
                    }
                }
                
                createETFChart(chartData.results, category.name);
                chartSection.style.display = 'block';
            } else {
                showError('Error cargando ETFs de la categoría');
            }
            
            showLoading(false);
            
        } catch (error) {
            console.error('Error loading category ETFs:', error);
            showError('Error cargando ETFs de la categoría: ' + error.message);
            showLoading(false);
        }
    }
}

function showCustomETFModal() {
    // Clear form first
    document.getElementById('customETFForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('customETFModal'));
    modal.show();
    
    // Focus on symbol input for better UX
    setTimeout(() => {
        document.getElementById('customSymbol').focus();
    }, 500);
}

async function saveCustomETF() {
    const symbol = document.getElementById('customSymbol').value.trim().toUpperCase();
    const name = document.getElementById('customName').value.trim();
    const description = document.getElementById('customDescription').value.trim();
    
    if (!symbol) {
        alert('Por favor ingresa un símbolo de ETF');
        return;
    }
    
    if (!name) {
        alert('Por favor ingresa un nombre para el ETF');
        return;
    }
    
    // Check if ETF already exists in custom list
    const existingETF = customETFs.find(etf => etf.symbol === symbol);
    if (existingETF) {
        alert(`El ETF ${symbol} ya existe en tu lista personalizada`);
        return;
    }
    
    const customETF = { 
        symbol, 
        name, 
        description: description || name, 
        category: 'custom' 
    };
    
    customETFs.push(customETF);
    localStorage.setItem('customETFs', JSON.stringify(customETFs));
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('customETFModal')).hide();
    
    // Add to chart immediately and update cache
    addETFToChart(symbol);
    
    // Fetch data for this new ETF and add to cache
    try {
        const response = await fetch(`${API_BASE_URL}/etfs/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                etfs: [symbol],
                period: currentPeriod,
                interval: '1d',
                include_summary: true
            })
        });
        
        const chartData = await response.json();
        if (chartData.success) {
            await updateCacheWithNewETFs([symbol], chartData.results);
            console.log(`ETF ${symbol} agregado al cache desde custom ETF`);
        }
    } catch (error) {
        console.error('Error updating cache for custom ETF:', error);
    }
    
    // Clear form
    document.getElementById('customETFForm').reset();
    
    console.log(`ETF personalizado agregado: ${symbol} - ${name}`);
}

function showETFDetails(symbol) {
    // Find ETF info
    let etfInfo = null;
    Object.values(allETFCategories).forEach(category => {
        if (category.etfs[symbol]) {
            etfInfo = {
                symbol,
                description: category.etfs[symbol],
                category: category.name
            };
        }
    });
    
    if (etfInfo) {
        const modalContent = document.getElementById('etfDetailContent');
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h6>${etfInfo.symbol}</h6>
                    <p class="text-muted">${etfInfo.description}</p>
                    <p><strong>Categoría:</strong> ${etfInfo.category}</p>
                </div>
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('etfDetailModal'));
        modal.show();
        
        // Set up add to comparison button
        document.getElementById('addToComparisonBtn').onclick = () => {
            addETFToChart(symbol);
            modal.hide();
        };
    }
}

function exportTableData() {
    // Simple CSV export of the table data
    const table = document.getElementById('etfSummaryTable');
    let csv = [];
    
    // Headers
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent);
    csv.push(headers.join(','));
    
    // Rows
    Array.from(table.querySelectorAll('tbody tr')).forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')).slice(0, -1).map(td => {
            return '"' + td.textContent.replace(/"/g, '""') + '"';
        });
        csv.push(cells.join(','));
    });
    
    // Download
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etf_summary_${currentPeriod}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
}

function showTableLoading(show) {
    const tableBody = document.querySelector('#etfSummaryTable tbody');
    if (show) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <div class="d-flex align-items-center justify-content-center">
                        <div class="spinner-border spinner-border-sm text-primary me-3" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <span class="text-muted">Actualizando resumen de ETFs...</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorAlert.style.display = 'block';
    showLoading(false);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorAlert.style.display = 'none';
    }, 5000);
}

function hideError() {
    errorAlert.style.display = 'none';
}

function showPreloadIndicator(show) {
    const preloadToast = document.getElementById('preloadToast');
    if (preloadToast) {
        if (show) {
            preloadToast.style.display = 'block';
            // Use Bootstrap's Toast class for smooth animation
            const toast = new bootstrap.Toast(preloadToast, {
                autohide: false
            });
            toast.show();
        } else {
            const toast = bootstrap.Toast.getInstance(preloadToast);
            if (toast) {
                toast.hide();
            } else {
                preloadToast.style.display = 'none';
            }
        }
    }
}

// Custom Category Functions
function showCustomCategoryModal() {
    // Reset modal for creating new category
    document.getElementById('customCategoryModalTitle').innerHTML = `
        <i class="bi bi-folder-plus"></i>
        Crear Categoría Personalizada
    `;
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    document.getElementById('categoryETFs').value = '';
    document.getElementById('categoryColor').value = 'primary';
    document.getElementById('etfPreview').innerHTML = '<small class="text-muted">Los ETFs aparecerán aquí mientras seleccionas...</small>';
    document.getElementById('deleteCategoryBtn').style.display = 'none';
    
    // Clear any stored category being edited
    document.getElementById('saveCustomCategoryBtn').dataset.editingCategory = '';
    
    // Reset selected ETFs
    selectedETFsInModal.clear();
    
    // Reset to manual tab
    document.getElementById('manual-tab').click();
    
    // Initialize ETF list
    initializeETFList();
    
    const modal = new bootstrap.Modal(document.getElementById('customCategoryModal'));
    modal.show();
}

function editCustomCategory(categoryKey) {
    const category = customCategories[categoryKey];
    if (!category) return;
    
    // Fill modal with existing data
    document.getElementById('customCategoryModalTitle').innerHTML = `
        <i class="bi bi-pencil"></i>
        Editar Categoría: ${category.name}
    `;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description;
    document.getElementById('categoryColor').value = category.color || 'primary';
    
    // Convert ETFs object back to comma-separated string and update both methods
    const etfSymbols = Object.keys(category.etfs);
    const etfString = etfSymbols.join(', ');
    document.getElementById('categoryETFs').value = etfString;
    
    // Update selected ETFs for list method
    selectedETFsInModal.clear();
    etfSymbols.forEach(symbol => selectedETFsInModal.add(symbol));
    
    // Initialize ETF list
    initializeETFList();
    
    // Reset to manual tab
    document.getElementById('manual-tab').click();
    
    // Update preview
    updateETFPreview();
    
    // Show delete button and store which category we're editing
    document.getElementById('deleteCategoryBtn').style.display = 'inline-block';
    document.getElementById('saveCustomCategoryBtn').dataset.editingCategory = categoryKey;
    
    const modal = new bootstrap.Modal(document.getElementById('customCategoryModal'));
    modal.show();
}

function updateETFPreview() {
    const preview = document.getElementById('etfPreview');
    
    // Determine which method is active and get ETFs accordingly
    let etfList = [];
    const activeTab = document.querySelector('#etfSelectionTabs .nav-link.active');
    
    if (activeTab && activeTab.id === 'list-tab') {
        // Use selected ETFs from list
        etfList = Array.from(selectedETFsInModal);
    } else {
        // Use manual input
        const etfInput = document.getElementById('categoryETFs').value;
        etfList = etfInput.split(',').map(etf => etf.trim().toUpperCase()).filter(etf => etf.length > 0);
    }
    
    if (etfList.length === 0) {
        preview.innerHTML = '<small class="text-muted">Los ETFs aparecerán aquí mientras seleccionas...</small>';
        return;
    }
    
    // Sort ETFs alphabetically
    etfList.sort();
    
    const etfBadges = etfList.map(etf => `<span class="badge bg-secondary me-1 mb-1">${etf}</span>`).join('');
    preview.innerHTML = `
        <div class="d-flex flex-wrap">
            ${etfBadges}
        </div>
        <small class="text-muted mt-2 d-block">Total: ${etfList.length} ETFs</small>
    `;
}

function saveCustomCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();
    const color = document.getElementById('categoryColor').value;
    const editingCategory = document.getElementById('saveCustomCategoryBtn').dataset.editingCategory;
    
    if (!name) {
        alert('Por favor ingresa un nombre para la categoría');
        return;
    }
    
    // Get ETFs from the appropriate method
    let etfList = [];
    const activeTab = document.querySelector('#etfSelectionTabs .nav-link.active');
    
    if (activeTab && activeTab.id === 'list-tab') {
        // Use selected ETFs from list
        etfList = Array.from(selectedETFsInModal);
    } else {
        // Use manual input
        const etfInput = document.getElementById('categoryETFs').value.trim();
        if (!etfInput) {
            alert('Por favor ingresa al menos un ETF');
            return;
        }
        etfList = etfInput.split(',').map(etf => etf.trim().toUpperCase()).filter(etf => etf.length > 0);
    }
    
    if (etfList.length === 0) {
        alert('Por favor selecciona al menos un ETF');
        return;
    }
    
    // Create ETFs object
    const etfs = {};
    etfList.forEach(etf => {
        // Try to find description from available ETFs
        const etfInfo = availableETFs.find(item => item.symbol === etf);
        etfs[etf] = etfInfo ? etfInfo.name : etf; // Use description if found, otherwise use symbol
    });
    
    // Create category key
    const categoryKey = editingCategory || `custom_${Date.now()}`;
    
    // Save to custom categories
    customCategories[categoryKey] = {
        name: name,
        description: description || `Categoría personalizada con ${etfList.length} ETFs`,
        color: color,
        etfs: etfs,
        isCustom: true
    };
    
    // Update allETFCategories to include custom categories
    allETFCategories[categoryKey] = customCategories[categoryKey];
    
    // Save to localStorage
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('customCategoryModal')).hide();
    
    // Refresh categories display
    displayCategories(allETFCategories);
    
    // Show success message
    const action = editingCategory ? 'actualizada' : 'creada';
    console.log(`Categoría ${action}: ${name}`);
}

function deleteCustomCategory() {
    const editingCategory = document.getElementById('saveCustomCategoryBtn').dataset.editingCategory;
    
    if (!editingCategory || !customCategories[editingCategory]) {
        return;
    }
    
    const categoryName = customCategories[editingCategory].name;
    
    if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?`)) {
        // Remove from custom categories
        delete customCategories[editingCategory];
        delete allETFCategories[editingCategory];
        
        // Save to localStorage
        localStorage.setItem('customCategories', JSON.stringify(customCategories));
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('customCategoryModal')).hide();
        
        // Refresh categories display
        displayCategories(allETFCategories);
        
        console.log(`Categoría eliminada: ${categoryName}`);
    }
}

async function updateCacheWithNewETFs(newETFs, chartData) {
    // Create a "Custom ETFs" category in cache for new ETFs
    if (!cachedSummaryData) {
        cachedSummaryData = {};
    }
    
    if (!cachedSummaryData['custom_etfs']) {
        cachedSummaryData['custom_etfs'] = {
            name: 'ETFs Personalizados',
            description: 'ETFs agregados dinámicamente',
            etfs: {}
        };
    }
    
    newETFs.forEach(symbol => {
        if (chartData[symbol] && chartData[symbol].data && !chartData[symbol].error) {
            const data = chartData[symbol].data;
            if (data.length > 0) {
                const prices = data.map(d => d.Close).filter(p => p && p > 0);
                const volumes = data.map(d => d.Volume).filter(v => v && v > 0);
                
                if (prices.length > 1) {
                    const currentPrice = prices[prices.length - 1];
                    const startPrice = prices[0];
                    const returns = prices.map((price, i) => i > 0 ? ((price / prices[i-1]) - 1) * 100 : 0).slice(1);
                    
                    // Try to find ETF name from custom ETFs or use symbol
                    const customETF = customETFs.find(etf => etf.symbol === symbol);
                    const etfName = customETF ? customETF.name : symbol;
                    
                    cachedSummaryData['custom_etfs'].etfs[symbol] = {
                        description: etfName,
                        summary: {
                            current_price: Math.round(currentPrice * 100) / 100,
                            total_return: Math.round(((currentPrice / startPrice) - 1) * 100 * 100) / 100,
                            volatility: Math.round((returns.length > 1 ? Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length) : 0) * 100) / 100,
                            avg_volume: volumes.length > 0 ? Math.floor(volumes.reduce((sum, v) => sum + v, 0) / volumes.length) : 0,
                            max_price: Math.round(Math.max(...prices) * 100) / 100,
                            min_price: Math.round(Math.min(...prices) * 100) / 100,
                            data_points: prices.length
                        }
                    };
                    
                    console.log(`ETF ${symbol} agregado al cache`);
                }
            }
        }
    });
}

function createCustomCategorySummary(categoryKey, category, chartData, defaultSummaryData) {
    // Create a summary structure that combines chart data with any existing summary data
    const customSummary = {};
    customSummary[categoryKey] = {
        name: category.name,
        description: category.description,
        color: category.color,
        etfs: {}
    };
    
    Object.keys(category.etfs).forEach(symbol => {
        let etfSummary = null;
        
        // First, try to find in default summary data
        Object.values(defaultSummaryData).forEach(cat => {
            if (cat.etfs && cat.etfs[symbol] && cat.etfs[symbol].summary) {
                etfSummary = cat.etfs[symbol];
            }
        });
        
        // If not found in default data, create from chart data
        if (!etfSummary && chartData[symbol] && chartData[symbol].data && !chartData[symbol].error) {
            const data = chartData[symbol].data;
            if (data.length > 0) {
                const prices = data.map(d => d.Close).filter(p => p && p > 0);
                const volumes = data.map(d => d.Volume).filter(v => v && v > 0);
                
                if (prices.length > 1) {
                    const currentPrice = prices[prices.length - 1];
                    const startPrice = prices[0];
                    const returns = prices.map((price, i) => i > 0 ? ((price / prices[i-1]) - 1) * 100 : 0).slice(1);
                    
                    etfSummary = {
                        description: category.etfs[symbol],
                        summary: {
                            current_price: Math.round(currentPrice * 100) / 100,
                            total_return: Math.round(((currentPrice / startPrice) - 1) * 100 * 100) / 100,
                            volatility: Math.round((returns.length > 1 ? Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length) : 0) * 100) / 100,
                            avg_volume: volumes.length > 0 ? Math.floor(volumes.reduce((sum, v) => sum + v, 0) / volumes.length) : 0,
                            max_price: Math.round(Math.max(...prices) * 100) / 100,
                            min_price: Math.round(Math.min(...prices) * 100) / 100,
                            data_points: prices.length
                        }
                    };
                }
            }
        }
        
        // If we still don't have summary data, create placeholder
        if (!etfSummary) {
            etfSummary = {
                description: category.etfs[symbol],
                summary: {
                    current_price: 'N/A',
                    total_return: 'N/A',
                    volatility: 'N/A',
                    avg_volume: 'N/A',
                    max_price: 'N/A',
                    min_price: 'N/A'
                }
            };
        }
        
        customSummary[categoryKey].etfs[symbol] = etfSummary;
    });
    
    return customSummary;
}

// ETF List Management Functions
function initializeETFList() {
    const container = document.getElementById('etfListContainer');
    
    if (availableETFs.length === 0) {
        container.innerHTML = `
            <div class="text-center p-3 text-muted">
                <i class="bi bi-exclamation-circle"></i>
                <div class="mt-2">No hay ETFs disponibles</div>
            </div>
        `;
        return;
    }
    
    renderETFList(availableETFs);
}

function renderETFList(etfList) {
    const container = document.getElementById('etfListContainer');
    
    if (etfList.length === 0) {
        container.innerHTML = `
            <div class="text-center p-3 text-muted">
                <i class="bi bi-search"></i>
                <div class="mt-2">No se encontraron ETFs</div>
            </div>
        `;
        return;
    }
    
    const etfItems = etfList.map(etf => {
        const isSelected = selectedETFsInModal.has(etf.symbol);
        return `
            <div class="form-check mb-2">
                <input class="form-check-input etf-checkbox" type="checkbox" value="${etf.symbol}" 
                       id="etf_${etf.symbol}" ${isSelected ? 'checked' : ''}>
                <label class="form-check-label" for="etf_${etf.symbol}">
                    <strong>${etf.symbol}</strong>
                    <br>
                    <small class="text-muted">${etf.name}</small>
                    <br>
                    <span class="badge bg-light text-dark">${etf.category}</span>
                </label>
            </div>
        `;
    }).join('');
    
    container.innerHTML = etfItems;
    
    // Add event listeners to checkboxes
    container.querySelectorAll('.etf-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                selectedETFsInModal.add(this.value);
            } else {
                selectedETFsInModal.delete(this.value);
            }
            updateSelectedCount();
            updateETFPreview();
        });
    });
    
    updateSelectedCount();
}

function filterETFList() {
    const searchTerm = document.getElementById('etfSearch').value.toLowerCase();
    
    if (!searchTerm) {
        renderETFList(availableETFs);
        return;
    }
    
    const filteredETFs = availableETFs.filter(etf => 
        etf.symbol.toLowerCase().includes(searchTerm) ||
        etf.name.toLowerCase().includes(searchTerm) ||
        etf.category.toLowerCase().includes(searchTerm)
    );
    
    renderETFList(filteredETFs);
}

function clearETFSearch() {
    document.getElementById('etfSearch').value = '';
    renderETFList(availableETFs);
}

function selectAllETFs() {
    // Get currently displayed ETFs (considering any search filter)
    const checkboxes = document.querySelectorAll('#etfListContainer .etf-checkbox');
    checkboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            checkbox.checked = true;
            selectedETFsInModal.add(checkbox.value);
        }
    });
    updateSelectedCount();
    updateETFPreview();
}

function selectNoneETFs() {
    // Clear only currently displayed ETFs (considering any search filter)
    const checkboxes = document.querySelectorAll('#etfListContainer .etf-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            checkbox.checked = false;
            selectedETFsInModal.delete(checkbox.value);
        }
    });
    updateSelectedCount();
    updateETFPreview();
}

function updateSelectedCount() {
    document.getElementById('selectedCount').textContent = selectedETFsInModal.size;
}

function syncFromManualToList() {
    // Parse ETFs from manual input and update list selection
    const etfInput = document.getElementById('categoryETFs').value;
    const etfList = etfInput.split(',').map(etf => etf.trim().toUpperCase()).filter(etf => etf.length > 0);
    
    // Clear current selection
    selectedETFsInModal.clear();
    
    // Add parsed ETFs to selection
    etfList.forEach(etf => selectedETFsInModal.add(etf));
    
    // Re-render list to show updated selection
    const searchTerm = document.getElementById('etfSearch').value.toLowerCase();
    if (searchTerm) {
        filterETFList();
    } else {
        renderETFList(availableETFs);
    }
}

function syncFromListToManual() {
    // Update manual input with selected ETFs from list
    const selectedArray = Array.from(selectedETFsInModal).sort();
    document.getElementById('categoryETFs').value = selectedArray.join(', ');
    updateETFPreview();
}