// CÓDIGO CORREGIDO Y UNIFICADO EN UN SOLO BLOQUE DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const mainChart = document.getElementById('chart-main');
    const secondaryChart = document.getElementById('chart-secondary');
    const chartsContainer = document.getElementById('charts-container');
    const resultadosContainer = document.getElementById('results-content-area');
    const panelTitle = document.getElementById('panelTitle');
    const navItems = document.querySelectorAll('.nav-item');
    const distributionContents = document.querySelectorAll('.distribution-content');
    const downloadBtn = document.getElementById('download-csv-btn');
    const resultsPanelContainer = document.getElementById('results-panel-container');

    // Estado global para la última simulación
    let datosSimulacionActual = null;
    let nombreSimulacionActual = '';

    const TITULOS = {
        'bernoulli': 'Distribución de Bernoulli',
        'binomial': 'Distribución Binomial',
        'multinomial': 'Distribución Multinomial',
        'exponencial': 'Distribución Exponencial',
        'normal': 'Distribución Normal',
        'gibbs': 'Método de Gibbs',
        'normal-bivariada': 'Distribución Normal Bivariada'
    };

    // --- HELPERS MATEMÁTICOS ---
    function factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    function combinations(n, k) {
        if (k < 0 || k > n) return 0;
        if (n > 170) { // Límite para factorial en JS
            let res = 0;
            for(let i = 1; i <= k; i++){
               res += Math.log(n - i + 1) - Math.log(i);
            }
            return Math.round(Math.exp(res));
        }
        return factorial(n) / (factorial(k) * factorial(n - k));
    }

    // --- MÓDULOS PRINCIPALES ---

    function getGraphLayout(title, is3D = false) {
        const layout = {
            title: { text: title, font: { size: 20, color: '#333' }, x: 0.5 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            margin: { l: 60, r: 20, b: 50, t: 50 },
            xaxis: { title: { font: { size: 14, color: '#555' } }, tickfont: { color: '#555' }, gridcolor: 'rgba(0, 0, 0, 0.05)'},
            yaxis: { title: { font: { size: 14, color: '#555' } }, tickfont: { color: '#555' }, gridcolor: 'rgba(0, 0, 0, 0.1)'},
            legend: { font: { color: '#333' } }
        };
        if (is3D) {
            layout.scene = {
                xaxis: { title: 'X', gridcolor: 'rgba(0,0,0,0.1)' },
                yaxis: { title: 'Y', gridcolor: 'rgba(0,0,0,0.1)' },
                zaxis: { title: 'Densidad', gridcolor: 'rgba(0,0,0,0.1)' }
            };
        }
        return layout;
    }

    function mostrarResultados(simName, data) {
        let html = '<div class="stats-grid">';
        let primerosResultadosHtml = '';

        const crearTarjeta = (valor, etiqueta) => {
            const valorFormateado = (typeof valor === 'number') ? valor.toFixed(4) : 'N/A';
            return `<div class="stat-card"><div class="stat-value">${valorFormateado}</div><div class="stat-label">${etiqueta}</div></div>`;
        };

        switch (simName) {
            case 'bernoulli':
                html += `<div class="stat-card"><div class="stat-value">${data.exitos}</div><div class="stat-label">Éxitos</div></div><div class="stat-card"><div class="stat-value">${data.fracasos}</div><div class="stat-label">Fracasos</div></div>`;
                primerosResultadosHtml = `<p><strong>Primeros 10 resultados:</strong> ${data.resultados_individuales.slice(0, 10).join(", ")}</p>`;
                break;
            case 'binomial': case 'exponencial': case 'normal':
                const stats = data.estadisticas;
                html += `<div class="stat-card"><div class="stat-value">${stats.media.toFixed(4)}</div><div class="stat-label">Media</div></div><div class="stat-card"><div class="stat-value">${stats.desviacion_estandar.toFixed(4)}</div><div class="stat-label">Desv. Est.</div></div><div class="stat-card"><div class="stat-value">${stats.minimo.toFixed(4)}</div><div class="stat-label">Mínimo</div></div><div class="stat-card"><div class="stat-value">${stats.maximo.toFixed(4)}</div><div class="stat-label">Máximo</div></div>`;
                const resultados = data.resultados_individuales || data.valores;
                primerosResultadosHtml = `<p><strong>Primeros 10 resultados:</strong> ${resultados.slice(0, 10).map(v => v.toFixed(3)).join(", ")}</p>`;
                break;
            case 'gibbs':
    // CORRECCIÓN: Se accede a los objetos anidados de forma segura
    const stats_gibbs = data.statistics;

    if (stats_gibbs) {
        // Se utiliza la función 'crearTarjeta' para mantener la consistencia y seguridad
        html += crearTarjeta(stats_gibbs.mean_x, 'Media X');
        html += crearTarjeta(stats_gibbs.mean_y, 'Media Y');
        html += crearTarjeta(stats_gibbs.std_x, 'Desv. Std X');
        html += crearTarjeta(stats_gibbs.std_y, 'Desv. Std Y');
        // CORRECCIÓN: Se corrigió el error de variable (stat vs stats)
        // y se envolvió en la función helper
        html += `<div class="stat-card" style="grid-column: span 2;">${crearTarjeta(stats_gibbs.correlation, 'Correlación').replace('stat-card','')}</div>`;
        // 3. Acceder al objeto anidado 'samples' para los resultados individuales
    const samples = data.samples;

    // 4. Comprobar si las muestras existen y obtener los primeros 10 resultados
    if (samples && samples.x && samples.y) {
        const primerosXGibbs = samples.x.slice(0, 10).map(v => v.toFixed(2)).join(', ');
        const primerosYGibbs = samples.y.slice(0, 10).map(v => v.toFixed(2)).join(', ');
        primerosResultadosHtml = `<p><strong>Primeros 10 X:</strong> ${primerosXGibbs}<br><strong>Primeros 10 Y:</strong> ${primerosYGibbs}</p>`;
    }
    }
    break;
            case 'normal-bivariada':
                const obs = data.estadisticas_observadas;
                html += `<div class="stat-card"><div class="stat-value">${obs.media_x.toFixed(4)}</div><div class="stat-label">Media X Obs.</div></div><div class="stat-card"><div class="stat-value">${obs.sigma_x.toFixed(4)}</div><div class="stat-label">Desv. X Obs.</div></div><div class="stat-card"><div class="stat-value">${obs.media_y.toFixed(4)}</div><div class="stat-label">Media Y Obs.</div></div><div class="stat-card"><div class="stat-value">${obs.sigma_y.toFixed(4)}</div><div class="stat-label">Desv. Y Obs.</div></div><div class="stat-card" style="grid-column: span 2;"><div class="stat-value">${obs.rho.toFixed(4)}</div><div class="stat-label">Correlación Obs.</div></div>`;
                const primerosXBiv = data.valores_x.slice(0, 10).map(v => v.toFixed(2)).join(', ');
                const primerosYBiv = data.valores_y.slice(0, 10).map(v => v.toFixed(2)).join(', ');
                primerosResultadosHtml = `<p><strong>Primeros 10 X:</strong> ${primerosXBiv}<br><strong>Primeros 10 Y:</strong> ${primerosYBiv}</p>`;
                break;
            default:
                html += '<p>No hay estadísticas disponibles.</p>';
        }

    html += '</div>';
    html += `<div class="results-sequence">${primerosResultadosHtml}</div>`;
    resultadosContainer.innerHTML = html;
    }

    function descargarCSV() {
        if (!datosSimulacionActual || !nombreSimulacionActual) {
            alert('Primero debes ejecutar una simulación.');
            return;
        }
        let csvContent = '', fileName = `${nombreSimulacionActual}_simulacion.csv`;
        switch (nombreSimulacionActual) {
            case 'bernoulli': csvContent = 'Resultado\n' + datosSimulacionActual.resultados_individuales.join('\n'); break;
            case 'binomial': csvContent = 'Numero_Exitos\n' + datosSimulacionActual.resultados_individuales.join('\n'); break;
            case 'exponencial': case 'normal': csvContent = 'Valor\n' + datosSimulacionActual.valores.join('\n'); break;
            case 'gibbs': case 'normal-bivariada':
            // --- INICIO DE LA CORRECCIÓN ---
            // Primero, intentamos obtener los datos de la estructura de Gibbs (anidados en 'samples').
            // Si no existen, usamos la estructura de la normal bivariada ('valores_x').
            const x_vals = (datosSimulacionActual.samples && datosSimulacionActual.samples.x) 
                           ? datosSimulacionActual.samples.x 
                           : datosSimulacionActual.valores_x;

            const y_vals = (datosSimulacionActual.samples && datosSimulacionActual.samples.y) 
                           ? datosSimulacionActual.samples.y 
                           : datosSimulacionActual.valores_y;
            
            // Verificamos que realmente obtuvimos los arrays antes de procesarlos
            if (x_vals && y_vals) {
                csvContent = 'x,y\n' + x_vals.map((val, i) => `${val},${y_vals[i]}`).join('\n');
            } else {
                alert('Error: No se encontraron datos de muestra para exportar.');
                return; // Detenemos la función si no hay datos
            }
            // --- FIN DE LA CORRECCIÓN ---
            break;
            case 'multinomial':
                 const headers = ['Categoria', 'Frecuencia_Observada', 'Frecuencia_Esperada'];
                 const dataRows = datosSimulacionActual.categorias.map((cat, i) => `${cat},${datosSimulacionActual.frecuencias_observadas[i]},${datosSimulacionActual.frecuencias_esperadas[i]}`);
                 csvContent = headers.join(',') + '\n' + dataRows.join('\n');
                 break;
            default: alert('Descarga no implementada.'); return;
        }
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // --- LÓGICA DE NAVEGACIÓN Y LIMPIEZA ---
    function actualizarVisibilidadPaneles(distribution) {
        const esPestanaEspecial = distribution === 'multinomial';
        resultsPanelContainer.style.display = esPestanaEspecial ? 'none' : 'block';
        chartsContainer.style.display = esPestanaEspecial ? 'none' : 'block';
    }

    function limpiarTodo() {
        mainChart.innerHTML = '<div class="chart-placeholder">📈 Ajusta los parámetros y presiona "Simular" para generar la gráfica</div>';
        secondaryChart.innerHTML = '';
        secondaryChart.style.display = 'none';
        
        const gibbsStatus = document.getElementById('gibbs-status');
        if (gibbsStatus) gibbsStatus.innerHTML = '';

        if (nombreSimulacionActual !== 'multinomial') {
             resultadosContainer.innerHTML = '<p>¡Aquí podrás observar los resultados de la simulación!</p>';
        }
        datosSimulacionActual = null;
        nombreSimulacionActual = '';
    }

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const distribution = this.getAttribute('data-distribution');
            navItems.forEach(nav => nav.classList.remove('active'));
            distributionContents.forEach(content => content.classList.remove('active'));
            this.classList.add('active');
            document.getElementById(distribution).classList.add('active');
            panelTitle.textContent = TITULOS[distribution] || 'Simulador de Densidades';
            actualizarVisibilidadPaneles(distribution);
            limpiarTodo();
        });
    });

    document.querySelectorAll('.btn-secondary').forEach(button => {
        button.addEventListener('click', function() {
            limpiarTodo();
            // Restablecer valores por defecto (opcional, si los tienes)
        });
    });

    downloadBtn.addEventListener('click', descargarCSV);

    // --- FUNCIONES DE SIMULACIÓN POR DISTRIBUCIÓN ---

    function setupBernoulli() {
        const content = document.getElementById('bernoulli');
        content.querySelector('.btn-primary').addEventListener('click', async () => {
            const numExp = parseInt(document.getElementById('bernoulli-n').value);
            const probExito = parseFloat(document.getElementById('bernoulli-p').value);
            mainChart.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';

            if (probExito < 0 || probExito > 1) {
                mainChart.innerHTML = '<div class="chart-placeholder">❌ La probabilidad de éxito (p) debe estar entre 0 y 1.</div>';
                return;
            }
            if (numExp <= 0) {
                mainChart.innerHTML = '<div class="chart-placeholder">❌ El número de experimentos debe ser un entero positivo.</div>';
                return;
            }
            try {
                const response = await fetch("/binomial_puntual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ num_experimentos: numExp, probabilidad_exito: probExito }) });
                const result = await response.json();
                datosSimulacionActual = result;
                nombreSimulacionActual = 'bernoulli';
                mostrarResultados(nombreSimulacionActual, result);
                const trace = { x: result.datos.map(d => d.rango), y: result.datos.map(d => d.freq), type: 'bar', marker: { color: ['#6c5ce7', '#a29bfe'] } };
                mainChart.innerHTML = '';
                const layout = getGraphLayout(`Distribución Bernoulli (p=${probExito}, n=${numExp})`);
                Plotly.newPlot(mainChart, [trace], layout, { responsive: true });
            } catch (error) { mainChart.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>'; }
        });
    }

    function setupBinomial() {
        const content = document.getElementById('binomial');
        content.querySelector('.btn-primary').addEventListener('click', async () => {
            const numExp = parseInt(document.getElementById('binomial-sims').value);
            const p = parseFloat(document.getElementById('binomial-p').value);
            const n = parseInt(document.getElementById('binomial-n').value);
            if (p < 0 || p > 1) {
                mainChart.innerHTML = '<div class="chart-placeholder">❌ La probabilidad de éxito (p) debe estar entre 0 y 1.</div>';
                return;
            }
            if (n <= 0 || !Number.isInteger(n)) {
                mainChart.innerHTML = '<div class="chart-placeholder">❌ El número de pruebas (n) debe ser un entero positivo.</div>';
                return;
            }
            if (numExp <= 0 || !Number.isInteger(numExp)) {
                mainChart.innerHTML = '<div class="chart-placeholder">❌ El número de experimentos debe ser un entero positivo.</div>';
                return;
            }
            mainChart.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';
            try {
                const response = await fetch("/binomial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ num_experimentos: numExp, probabilidad_exito: p, num_pruebas: n }) });
                const result = await response.json();
                datosSimulacionActual = result;
                nombreSimulacionActual = 'binomial';
                mostrarResultados(nombreSimulacionActual, result);
                const traceSim = { x: result.datos.x, y: result.datos.y, type: 'bar', name: 'Simulación', marker: { color: '#6c5ce7' } };
                mainChart.innerHTML = "";
                const layout = getGraphLayout(`Distribución Binomial (n=${n}, p=${p}, sims=${numExp})`);
                layout.xaxis.title = "Número de Éxitos";
                layout.yaxis.title = "Frecuencia";
                Plotly.newPlot(mainChart, [traceSim], layout, { responsive: true });
            } catch (error) { mainChart.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>'; }
        });
    }

    function setupExponencial() {
        const content = document.getElementById('exponencial');
        content.querySelector('.btn-primary').addEventListener('click', async () => {
            const numExp = parseInt(document.getElementById('exponencial-n').value);
            const lambda = parseFloat(document.getElementById('exponencial-lambda').value);
            if( lambda <= 0) {
              mainChart.innerHTML = '<div class="chart-placeholder">❌ La tasa (λ) debe ser un número positivo.</div>';
              return;
            }
            if (numExp <= 0 || !Number.isInteger(numExp)) {
              mainChart.innerHTML = '<div class="chart-placeholder">❌ El número de experimentos debe ser un entero positivo.</div>';
              return;
            }
            mainChart.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';
            try {
                const response = await fetch("/exponencial", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ num_experimentos: numExp, tasa: lambda }) });
                const result = await response.json();
                datosSimulacionActual = result;
                nombreSimulacionActual = 'exponencial';
                mostrarResultados(nombreSimulacionActual, result);
                const hist = { x: result.valores, type: 'histogram', histnorm: 'probability density', name: 'Simulación', marker: { color: '#6c5ce7', opacity: 0.7 }};
                const maxX = Math.max(...result.valores);
                const xTeorico = Array.from({length: 101}, (_, i) => i * maxX / 100);
                const yTeorico = xTeorico.map(x => lambda * Math.exp(-lambda * x));
                const traceTeorico = { x: xTeorico, y: yTeorico, type: 'scatter', mode: 'lines', name: 'Teórica', line: { color: '#e74c3c', width: 2.5 }};
                mainChart.innerHTML = "";
                const layout = getGraphLayout(`Distribución Exponencial (λ=${lambda}, n=${numExp})`);
                layout.bargap = 0.1;
                layout.xaxis.title = "Valor";
                layout.yaxis.title = "Densidad";
                Plotly.newPlot(mainChart, [hist, traceTeorico], layout, { responsive: true });
            } catch (error) { mainChart.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>'; }
        });
    }

    function setupNormal() {
        const content = document.getElementById('normal');
        content.querySelector('.btn-primary').addEventListener('click', async () => {
            const numExp = parseInt(document.getElementById('normal-n').value);
            const mu = parseFloat(document.getElementById('normal-mu').value);
            const sigma = parseFloat(document.getElementById('normal-sigma').value);
            if( sigma <= 0) {
              mainChart.innerHTML = '<div class="chart-placeholder">❌ La desviación estándar (σ) debe ser un número positivo.</div>';
              return;
            }
            if (numExp <= 0 || !Number.isInteger(numExp)) {
              mainChart.innerHTML = '<div class="chart-placeholder">❌ El número de experimentos debe ser un entero positivo.</div>';
              return;
            }
            
            mainChart.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';
            try {
                const response = await fetch("/normal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ num_experimentos: numExp, media: mu, desviacion_estandar: sigma }) });
                const result = await response.json();
                datosSimulacionActual = result;
                nombreSimulacionActual = 'normal';
                mostrarResultados(nombreSimulacionActual, result);
                const hist = { x: result.valores, type: 'histogram', histnorm: 'probability density', name: 'Simulación', marker: { color: '#6c5ce7', opacity: 0.7 }};
                const minX = Math.min(...result.valores), maxX = Math.max(...result.valores);
                const xTeorico = Array.from({length: 201}, (_, i) => minX + i * (maxX-minX) / 200);
                const yTeorico = xTeorico.map(x => (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2)));
                const traceTeorico = { x: xTeorico, y: yTeorico, type: 'scatter', mode: 'lines', name: 'Teórica', line: { color: '#e74c3c', width: 2.5 }};
                mainChart.innerHTML = "";
                const layout = getGraphLayout(`Distribución Normal (μ=${mu}, σ=${sigma}, n=${numExp})`);
                layout.bargap = 0.1;
                layout.xaxis.title = "Valor";
                layout.yaxis.title = "Densidad";
                Plotly.newPlot(mainChart, [hist, traceTeorico], layout, { responsive: true });
            } catch (error) { mainChart.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>'; }
        });
    }
    
    function setupGibbs() {
        const content = document.getElementById('gibbs');
        const select = document.getElementById('gibbs-function-select');
        const validateBtn = document.getElementById('gibbs-validate-btn');
        const sampleBtn = document.getElementById('gibbs-sample-btn');
        const statusDiv = document.getElementById('gibbs-status');

        const updateBoundsDisplay = () => {
            const selectedIndex = select.value;
            if (gibbsExamples[selectedIndex]) {
                const bounds = gibbsExamples[selectedIndex].bounds;
                document.getElementById('gibbs-bound-xmin').textContent = bounds.x_min;
                document.getElementById('gibbs-bound-xmax').textContent = bounds.x_max;
                document.getElementById('gibbs-bound-ymin').textContent = bounds.y_min;
                document.getElementById('gibbs-bound-ymax').textContent = bounds.y_max;
            }
        };

        const loadGibbsExamples = async () => {
            try {
                const response = await fetch(`/examples`);
                if (!response.ok) throw new Error('No se pudo conectar al servidor para obtener ejemplos.');
                const data = await response.json();
                gibbsExamples = data.examples;
                select.innerHTML = '';
                gibbsExamples.forEach((ex, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = ex.expression;
                    select.appendChild(option);
                });
                updateBoundsDisplay();
            } catch (error) {
                showStatus(`❌ ${error.message}`, 'error');
            }
        };

        select.addEventListener('change', () => {
            updateBoundsDisplay();
            sampleBtn.disabled = true;
            statusDiv.innerHTML = '';
        });

        function getFormData() {
            const selectedIndex = select.value;
            const selectedExample = gibbsExamples[selectedIndex];
            return {
                expression: selectedExample.expression,
                x_min: selectedExample.bounds.x_min,
                x_max: selectedExample.bounds.x_max,
                y_min: selectedExample.bounds.y_min,
                y_max: selectedExample.bounds.y_max,
                x_initial: document.getElementById('gibbs-x-initial').value ? parseFloat(document.getElementById('gibbs-x-initial').value) : null,
                y_initial: document.getElementById('gibbs-y-initial').value ? parseFloat(document.getElementById('gibbs-y-initial').value) : null,
                n_samples: parseInt(document.getElementById('gibbs-n-samples').value),
                burn_in: parseInt(document.getElementById('gibbs-burn-in').value)
            };
        }

        function showStatus(message, type) {
            statusDiv.innerHTML = `<div class="status ${type}">${message}</div>`;
        }

        validateBtn.addEventListener('click', async () => {
            const requestData = getFormData();
            try {
                showStatus('🔍 Validando función...', 'info');
                const response = await fetch(`/validate`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData), mode: 'cors'
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const result = await response.json();
                if (result.is_valid) {
                    showStatus('✅ Función válida.', 'success');
                    sampleBtn.disabled = false;
                } else {
                    const errors = result.errors.join('<br>• ');
                    showStatus(`❌ Errores de validación:<br>• ${errors}`, 'error');
                    sampleBtn.disabled = true;
                }
            } catch (error) {
                showStatus(`❌ Error de conexión: ${error.message}`, 'error');
                sampleBtn.disabled = true;
            }
        });

        sampleBtn.addEventListener('click', async () => {
            const requestData = getFormData();
            mainChart.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';
            secondaryChart.style.display = 'block';
            secondaryChart.innerHTML = '';
            resultadosContainer.innerHTML = '';
            showStatus('🚀 Ejecutando muestreador...', 'info');
            try {
                const response = await fetch(`/sample`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData), mode: 'cors'
                });
                if (!response.ok) { const txt = await response.text(); throw new Error(txt); }
                
                const result = await response.json();
                
                if (result.success) {
                    datosSimulacionActual = result;
                    nombreSimulacionActual = 'gibbs';
                    showStatus(`✅ Muestreo completado en ${result.execution_time.toFixed(3)}s.`, 'success');
                    
                    mostrarResultados('gibbs', result);
                    const plotData = result.plot_data;
                    
                    Plotly.newPlot(secondaryChart, [plotData.scatter_2d], getGraphLayout(plotData.layout_2d.title + ` (n=${requestData.n_samples})`), { responsive: true });
                    mainChart.innerHTML = '';
                    Plotly.newPlot(mainChart, [plotData.histogram_3d], getGraphLayout(plotData.layout_3d.title, true), { responsive: true });
                } else {
                    const errors = result.validation?.errors?.join('<br>• ') || 'Error desconocido';
                    showStatus(`❌ Error durante el muestreo:<br>• ${errors}`, 'error');
                }
            } catch (error) {
                mainChart.innerHTML = `<div class="chart-placeholder">❌ Error: ${error.message}</div>`;
                secondaryChart.style.display = 'none';
                showStatus(`❌ Error: ${error.message}`, 'error');
            }
        });

        loadGibbsExamples();
    }

    function setupNormalBivariada() {
        const content = document.getElementById('normal-bivariada');
        content.querySelector('.btn-primary').addEventListener('click', async () => {
            const params = { num_experimentos: parseInt(document.getElementById('bivariada-n').value), mu_x: parseFloat(document.getElementById('bivariada-mu-x').value), mu_y: parseFloat(document.getElementById('bivariada-mu-y').value), sigma_x: parseFloat(document.getElementById('bivariada-sigma-x').value), sigma_y: parseFloat(document.getElementById('bivariada-sigma-y').value), rho: parseFloat(document.getElementById('bivariada-rho').value) };
            if(params.sigma_x <= 0 || params.sigma_y <= 0){
              mainChart.innerHTML = '<div class="chart-placeholder">❌ Las desviaciones estándar (σx, σy) deben ser números positivos.</div>';
              return;
            }
            if (params.rho < -1 || params.rho > 1) {
              mainChart.innerHTML = '<div class="chart-placeholder">❌ La correlación (ρ) debe estar entre -1 y 1.</div>';
              return;
            }
            if (params.num_experimentos <= 0 || !Number.isInteger(params.num_experimentos)) {
              mainChart.innerHTML = '<div class="chart-placeholder">❌ El número de experimentos debe ser un entero positivo.</div>';
              return;
            }
            
            mainChart.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación 3D...</div>';
            secondaryChart.style.display = 'block';
            secondaryChart.innerHTML = '<div class="chart-placeholder">🔄 Generando gráfico 2D...</div>';
            try {
                const response = await fetch("/normal_bivariada", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(params) });
                const result = await response.json();
                if (result.error) throw new Error(result.error);
                datosSimulacionActual = result;
                nombreSimulacionActual = 'normal-bivariada';
                mostrarResultados(nombreSimulacionActual, result);
                secondaryChart.innerHTML = '';
                const trace2D = { x: result.valores_x, y: result.valores_y, mode: 'markers', type: 'scatter', name: 'Muestras 2D', marker: { color: '#6c5ce7', size: 4, opacity: 0.5 } };
                const layout2D = getGraphLayout(`Dispersión 2D (n=${params.num_experimentos})`);
                layout2D.xaxis.title = "X";
                layout2D.yaxis.title = "Y";
                Plotly.newPlot(secondaryChart, [trace2D], layout2D, { responsive: true });
                mainChart.innerHTML = '';
                const surface = { ...result.superficie_teorica, type: 'surface', name: 'Densidad Teórica', colorscale: 'Viridis', opacity: 0.8 };
                const scatter3D = { x: result.valores_x, y: result.valores_y, z: new Array(result.valores_x.length).fill(0), mode: 'markers', type: 'scatter3d', name: 'Muestras', marker: { size: 2, color: '#e74c3c', opacity: 0.4 } };
                const layout3D = getGraphLayout(`Normal Bivariada 3D (ρ=${params.rho})`, true);
                Plotly.newPlot(mainChart, [surface, scatter3D], layout3D, { responsive: true });
            } catch(error) {
                mainChart.innerHTML = `<div class="chart-placeholder">❌ Error: ${error.message}</div>`;
                secondaryChart.style.display = 'none';
            }
        });
    }

    // --- CÓDIGO RESTAURADO DE MULTINOMIAL ---
     let categoryIndex = 3;
    let categoryProbIndex = 3;

    window.removeCategory= function(index) {
      const items = document.querySelectorAll('#categories-container .category-item');
      if (items.length <= 2) {
        alert('Debe haber al menos 2 categorías');
        return;
      }
      const item = document.querySelector(`#categories-container .category-item[data-index="${index}"]`);
      if (item) item.remove();
      checkProbSum();
    }

    window.addCategoryProb= function() {
      const container = document.getElementById('categories-prob-container');
      const item = document.createElement('div');
      item.className = 'category-item';
      item.setAttribute('data-index', categoryProbIndex);
      item.innerHTML = `
        <div class="category-header">
          <span class="category-name">Categoría ${categoryProbIndex + 1}</span>
          <button class="remove-btn" onclick="removeCategoryProb(${categoryProbIndex})">✕</button>
        </div>
        <div class="input-row">
          <div class="input-wrapper">
            <label>Nombre</label>
            <input type="text" class="cat-name-prob" value="Cat${categoryProbIndex + 1}">
          </div>
          <div class="input-wrapper">
            <label>Probabilidad (p)</label>
            <input type="number" class="cat-prob-prob" value="0.1" min="0" max="1" step="0.01">
          </div>
          <div class="input-wrapper">
            <label>Frecuencia Deseada (k)</label>
            <input type="number" class="cat-freq-prob" value="1" min="0">
          </div>
        </div>
      `;
      container.appendChild(item);
      categoryProbIndex++;
    }

    window.removeCategoryProb= function(index) {
      const items = document.querySelectorAll('#categories-prob-container .category-item');
      if (items.length <= 2) {
        alert('Debe haber al menos 2 categorías');
        return;
      }
      const item = document.querySelector(`#categories-prob-container .category-item[data-index="${index}"]`);
      if (item) item.remove();
    }

    function checkProbSum() {
      const probs = Array.from(document.querySelectorAll('.cat-prob')).map(input => parseFloat(input.value) || 0);
      const sum = probs.reduce((a, b) => a + b, 0);
      const warning = document.getElementById('prob-sum-warning');
      
      if (Math.abs(sum - 1) > 0.01) {
        warning.style.display = 'block';
        warning.textContent = `⚠️ Suma actual: ${sum.toFixed(3)}. Las probabilidades deben sumar 1.0`;
      } else {
        warning.style.display = 'none';
      }
    }

    document.addEventListener('input', function(e) {
      if (e.target.classList.contains('cat-prob')) {
        checkProbSum();
      }
    });

    window.simularMultinomial= async function() {
      const n_experimentos = parseInt(document.getElementById('n_experimentos').value);
      const categorias = Array.from(document.querySelectorAll('.cat-name')).map(input => input.value);
      const probabilidades = Array.from(document.querySelectorAll('.cat-prob')).map(input => parseFloat(input.value));

      const suma = probabilidades.reduce((a, b) => a + b, 0);
      if (Math.abs(suma - 1) > 0.01) {
        alert(`Las probabilidades deben sumar 1.0 (suma actual: ${suma.toFixed(3)})`);
        return;
      }

      try {
        const response = await fetch('/multinomial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ n_experimentos, categorias, probabilidades })
        });

        const data = await response.json();
        
        const resultadosDiv = document.getElementById('resultados-sim');
        resultadosDiv.innerHTML = `
          <div class="summary-card">
            <h3 style="margin-bottom: 1rem; color: #333;">📊 Resumen de la Simulación</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Experimentos</div>
                <div class="summary-value">${n_experimentos.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Categorías</div>
                <div class="summary-value">${categorias.length}</div>
              </div>
            </div>
          </div>

          <div class="chart-container">
            <div id="chart-sim" style="width: 100%; height: 400px;"></div>
          </div>

          <div class="explanation-box">
            <div class="explanation-title">📖 Cómo se calculó esta simulación</div>
            <div class="step">
              <strong>Paso 1:</strong> Se realizaron ${n_experimentos.toLocaleString()} experimentos independientes
            </div>
            <div class="step">
              <strong>Paso 2:</strong> En cada experimento, se seleccionó una categoría según las probabilidades definidas:
              ${categorias.map((cat, i) => `<br>&nbsp;&nbsp;&nbsp;&nbsp;• ${cat}: ${(probabilidades[i] * 100).toFixed(1)}%`).join('')}
            </div>
            <div class="step">
              <strong>Paso 3:</strong> Se contó la frecuencia de cada categoría
            </div>
            <div class="step">
              <strong>Paso 4:</strong> Se compararon las frecuencias observadas vs. esperadas
            </div>
          </div>

          <table style="width: 100%; margin-top: 2rem; border-collapse: collapse;">
            <thead>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 1rem; text-align: left;">Categoría</th>
                <th style="padding: 1rem; text-align: center;">Prob. Teórica</th>
                <th style="padding: 1rem; text-align: center;">Frec. Esperada</th>
                <th style="padding: 1rem; text-align: center;">Frec. Observada</th>
                <th style="padding: 1rem; text-align: center;">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              ${data.categorias.map((cat, i) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 1rem;"><strong>${cat}</strong></td>
                  <td style="padding: 1rem; text-align: center;">${(probabilidades[i] * 100).toFixed(1)}%</td>
                  <td style="padding: 1rem; text-align: center;">${data.frecuencias_esperadas[i].toFixed(1)}</td>
                  <td style="padding: 1rem; text-align: center;"><strong>${data.frecuencias_observadas[i]}</strong></td>
                  <td style="padding: 1rem; text-align: center; color: ${Math.abs(data.frecuencias_observadas[i] - data.frecuencias_esperadas[i]) < 50 ? '#27ae60' : '#e74c3c'}">
                    ${(data.frecuencias_observadas[i] - data.frecuencias_esperadas[i]).toFixed(1)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;

        // Gráfica
        const trace1 = {
          x: categorias,
          y: data.frecuencias_esperadas,
          name: 'Frecuencia Esperada',
          type: 'bar',
          marker: { color: 'rgba(102, 126, 234, 0.6)' }
        };

        const trace2 = {
          x: categorias,
          y: data.frecuencias_observadas,
          name: 'Frecuencia Observada',
          type: 'bar',
          marker: { color: 'rgba(118, 75, 162, 0.8)' }
        };

        const layout = {
          title: 'Comparación: Frecuencias Esperadas vs Observadas',
          barmode: 'group',
          xaxis: { title: 'Categorías' },
          yaxis: { title: 'Frecuencia' }
        };

        Plotly.newPlot('chart-sim', [trace1, trace2], layout, { responsive: true });

      } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con la API');
      }
    }

    window.calcularProbabilidad = async function() {
      const n_experimentos = parseInt(document.getElementById('n_exp_prob').value);
      const categorias = Array.from(document.querySelectorAll('.cat-name-prob')).map(input => input.value);
      const probabilidades = Array.from(document.querySelectorAll('.cat-prob-prob')).map(input => parseFloat(input.value));
      const frecuencias_deseadas = Array.from(document.querySelectorAll('.cat-freq-prob')).map(input => parseInt(input.value));

      const sumaProb = probabilidades.reduce((a, b) => a + b, 0);
      const sumaFreq = frecuencias_deseadas.reduce((a, b) => a + b, 0);

      if (Math.abs(sumaProb - 1) > 0.01) {
        alert(`Las probabilidades deben sumar 1.0 (suma actual: ${sumaProb.toFixed(3)})`);
        return;
      }

      if (sumaFreq !== n_experimentos) {
        alert(`Las frecuencias deben sumar ${n_experimentos} (suma actual: ${sumaFreq})`);
        return;
      }

      try {
        const response = await fetch('/calcular-probabilidad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ n_experimentos, categorias, probabilidades, frecuencias_deseadas })
        });

        const data = await response.json();
        window.ultimoCalculo = { n_experimentos, categorias, probabilidades, frecuencias_deseadas };

        const resultadosDiv = document.getElementById('resultados-prob');
        resultadosDiv.innerHTML = `
          <div class="summary-card">
            <h3 style="margin-bottom: 1rem; color: #333;">🎯 Probabilidad Calculada</h3>
            <div style="text-align: center; padding: 2rem; background: white; border-radius: 10px; margin-top: 1rem;">
              <div style="font-size: 3rem; font-weight: 700; color: #667eea; margin-bottom: 0.5rem;">
                ${(data.probabilidad_exacta * 100).toExponential(4)}%
              </div>
              <div style="font-size: 1.2rem; color: #666;">
                Probabilidad Exacta
              </div>
              <div style="margin-top: 1rem; padding: 1rem; background: #f8f9ff; border-radius: 8px;">
                <strong style="color: #f39c12;">${data.interpretacion.rareza.toUpperCase()}</strong>
                <br>
                Aproximadamente 1 en ${data.interpretacion.uno_en.toLocaleString()} casos
              </div>
            </div>
          </div>

          

          <div class="explanation-box">
            <div class="explanation-title">🧮 Explicación del Cálculo Multinomial</div>
            
            <p style="margin-bottom: 1rem; color: #555; line-height: 1.6;">
              La distribución multinomial calcula la probabilidad de obtener una configuración específica de resultados cuando realizamos múltiples experimentos con varias categorías posibles.
            </p>

            <div style="background: white; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
              <strong>📐 Fórmula General:</strong>
              <div class="formula">
                P(X₁=k₁, X₂=k₂, ..., Xₘ=kₘ) = (n! / (k₁! × k₂! × ... × kₘ!)) × p₁^k₁ × p₂^k₂ × ... × pₘ^kₘ
              </div>
            </div>

            <div class="step">
              <strong>Paso 1: Coeficiente Multinomial</strong>
              <div class="formula">
                n! / (${frecuencias_deseadas.join('! × ')}!) = ${data.coeficiente_multinomial.toExponential(4)}
              </div>
              <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
                Este número representa las formas posibles de ordenar los resultados
              </p>
            </div>

            <div class="step">
              <strong>Paso 2: Producto de Probabilidades</strong>
              ${categorias.map((cat, i) => `
                <div style="margin: 0.5rem 0; padding: 0.5rem; background: white; border-radius: 5px;">
                  • ${cat}: (${probabilidades[i].toFixed(3)})^${frecuencias_deseadas[i]} = ${Math.pow(probabilidades[i], frecuencias_deseadas[i]).toExponential(4)}
                </div>
              `).join('')}
              <div class="formula" style="margin-top: 1rem;">
                Producto Total = ${data.producto_probabilidades.toExponential(6)}
              </div>
            </div>

            <div class="step">
              <strong>Paso 3: Resultado Final</strong>
              <div class="formula">
                ${data.coeficiente_multinomial.toExponential(4)} × ${data.producto_probabilidades.toExponential(6)} = ${data.probabilidad_exacta.toExponential(6)}
              </div>
            </div>

            <div style="margin-top: 1.5rem; padding: 1rem; background: #e8f4f8; border-radius: 8px; border-left: 4px solid #3498db;">
              <strong style="color: #2980b9;">💡 Interpretación:</strong>
              <p style="margin-top: 0.5rem; color: #555;">
                Si repitieras este experimento muchas veces, esperarías ver esta configuración exacta aproximadamente 
                <strong>${(data.probabilidad_exacta * 100).toFixed(4)}%</strong> de las veces.
              </p>
            </div>
          </div>

          <table style="width: 100%; margin-top: 2rem; border-collapse: collapse;">
            <thead>
              <tr style="background: #667eea; color: white;">
                <th style="padding: 1rem; text-align: left;">Categoría</th>
                <th style="padding: 1rem; text-align: center;">Probabilidad (p)</th>
                <th style="padding: 1rem; text-align: center;">Frecuencia Deseada (k)</th>
                <th style="padding: 1rem; text-align: center;">Frecuencia Esperada</th>
                <th style="padding: 1rem; text-align: center;">p^k</th>
              </tr>
            </thead>
            <tbody>
              ${categorias.map((cat, i) => `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 1rem;"><strong>${cat}</strong></td>
                  <td style="padding: 1rem; text-align: center;">${probabilidades[i].toFixed(3)}</td>
                  <td style="padding: 1rem; text-align: center;"><strong>${frecuencias_deseadas[i]}</strong></td>
                  <td style="padding: 1rem; text-align: center;">${data.frecuencias_esperadas[i].toFixed(2)}</td>
                  <td style="padding: 1rem; text-align: center; font-family: monospace;">${Math.pow(probabilidades[i], frecuencias_deseadas[i]).toExponential(3)}</td>
                </tr>
              `).join('')}
              <tr style="background: #f8f9ff; font-weight: bold;">
                <td style="padding: 1rem;" colspan="2">TOTAL</td>
                <td style="padding: 1rem; text-align: center;">${frecuencias_deseadas.reduce((a,b) => a+b, 0)}</td>
                <td style="padding: 1rem; text-align: center;">${data.frecuencias_esperadas.reduce((a,b) => a+b, 0).toFixed(2)}</td>
                <td style="padding: 1rem; text-align: center; font-family: monospace;">${data.producto_probabilidades.toExponential(3)}</td>
              </tr>
            </tbody>
          </table>
        `;

        // Gráfica comparativa
        const trace1 = {
          x: categorias,
          y: data.frecuencias_esperadas,
          name: 'Frecuencia Esperada',
          type: 'bar',
          marker: { color: 'rgba(102, 126, 234, 0.6)' }
        };

        const trace2 = {
          x: categorias,
          y: frecuencias_deseadas,
          name: 'Frecuencia Deseada',
          type: 'bar',
          marker: { color: 'rgba(231, 76, 60, 0.8)' }
        };

        const layout = {
          title: 'Comparación: Frecuencias Esperadas vs Deseadas',
          barmode: 'group',
          xaxis: { title: 'Categorías' },
          yaxis: { title: 'Frecuencia' }
        };

        // Plotly.newPlot('chart-prob', [trace1, trace2], layout, { responsive: true });

      } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con la API');
      }
    }

    window.verificarSimulacion = async function() {
      if (!window.ultimoCalculo) {
        alert('Primero debes calcular una probabilidad');
        return;
      }

      try {
        const response = await fetch('/simular-verificacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(window.ultimoCalculo)
        });

        const data = await response.json();
        const sim = data.simulacion;

        const resultadosDiv = document.getElementById('resultados-prob');
        resultadosDiv.innerHTML += `
          <div style="margin-top: 2rem; padding: 2rem; background: linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(34, 153, 84, 0.1)); border-radius: 15px; border: 3px solid #27ae60;">
            <h3 style="color: #27ae60; margin-bottom: 1.5rem; font-size: 1.8rem;">
              ✓ Verificación por Simulación Monte Carlo
            </h3>

            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Simulaciones Realizadas</div>
                <div class="summary-value" style="color: #27ae60;">${sim.num_simulaciones.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Éxitos Encontrados</div>
                <div class="summary-value" style="color: #27ae60;">${sim.exitos_encontrados.toLocaleString()}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Probabilidad Simulada</div>
                <div class="summary-value" style="color: #27ae60;">${(sim.probabilidad_simulada * 100).toFixed(6)}%</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Probabilidad Teórica</div>
                <div class="summary-value" style="color: #667eea;">${(sim.probabilidad_teorica * 100).toFixed(6)}%</div>
              </div>
            </div>

            <div style="margin-top: 2rem; padding: 1.5rem; background: white; border-radius: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <strong style="font-size: 1.2rem;">Análisis de Concordancia</strong>
                <span style="padding: 0.5rem 1.5rem; background: ${sim.concordancia === 'excelente' ? '#27ae60' : sim.concordancia === 'buena' ? '#f39c12' : '#e74c3c'}; color: white; border-radius: 20px; font-weight: bold;">
                  ${sim.concordancia.toUpperCase()}
                </span>
              </div>
              
              <div style="margin: 1rem 0;">
                <div style="background: #ecf0f1; height: 30px; border-radius: 15px; overflow: hidden; position: relative;">
                  <div style="background: ${sim.concordancia === 'excelente' ? 'linear-gradient(90deg, #27ae60, #2ecc71)' : sim.concordancia === 'buena' ? 'linear-gradient(90deg, #f39c12, #f1c40f)' : 'linear-gradient(90deg, #e74c3c, #ec7063)'}; height: 100%; width: ${100 - Math.min(sim.error_porcentual, 100)}%; transition: width 0.5s ease;"></div>
                </div>
                <p style="text-align: center; margin-top: 0.5rem; color: #666;">
                  Error: ${sim.error_porcentual.toFixed(2)}%
                </p>
              </div>

              <div class="explanation-box" style="background: #fff; border: 2px solid #3498db;">
                <div style="color: #2980b9; font-weight: 600; margin-bottom: 0.5rem;">
                  📊 ¿Qué significa esto?
                </div>
                <p style="color: #555; line-height: 1.6;">
                  La verificación por simulación Monte Carlo consiste en repetir el experimento miles de veces y contar cuántas veces aparece exactamente la configuración deseada.
                  <br><br>
                  En este caso, de <strong>${sim.num_simulaciones.toLocaleString()}</strong> simulaciones, 
                  la configuración deseada apareció <strong>${sim.exitos_encontrados.toLocaleString()}</strong> veces.
                  <br><br>
                  <strong>Conclusión:</strong> ${
                    sim.concordancia === 'excelente' 
                      ? '¡Excelente! Los resultados de la simulación coinciden muy bien con la probabilidad teórica calculada.' 
                      : sim.concordancia === 'buena'
                      ? 'Buena concordancia. La diferencia es aceptable y esperada en simulaciones finitas.'
                      : 'Concordancia regular. Considera aumentar el número de simulaciones para mayor precisión.'
                  }
                </p>
              </div>

              <div style="margin-top: 1rem; padding: 1rem; background: #f8f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
                <strong>Diferencia absoluta:</strong> ${sim.diferencia_absoluta.toExponential(6)}
                <br>
                <strong>Error relativo:</strong> ${sim.error_porcentual.toFixed(4)}%
              </div>
            </div>
          </div>
        `;

      } catch (error) {
        console.error('Error:', error);
        alert('Error al realizar la verificación');
      }
    }

    // Inicialización
    checkProbSum();

    window.cambiarTab = function(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(tabName).classList.add('active');
            document.querySelector(`[onclick="cambiarTab('${tabName}')"]`).classList.add('active');
            
            
        }

      window.addCategory = function() {
      const container = document.getElementById('categories-container');
      const colors = ['🟡', '🟣', '🟤', '⚪', '⚫', '🟠'];
      const emoji = colors[categoryIndex % colors.length];
      
      const item = document.createElement('div');
      item.className = 'category-item';
      item.setAttribute('data-index', categoryIndex);
      item.innerHTML = `
        <div class="category-header">
          <span class="category-name">${emoji} Categoría ${categoryIndex + 1}</span>
          <button class="remove-btn" onclick="removeCategory(${categoryIndex})">✕</button>
        </div>
        <div class="input-row">
          <div class="input-group">
            <label>Nombre</label>
            <input type="text" class="cat-name" value="Cat${categoryIndex + 1}">
          </div>
          <div class="input-group">
            <label>Probabilidad</label>
            <input type="number" class="cat-prob" value="0.1" min="0" max="1" step="0.01">
          </div>
        </div>
      `;
      container.appendChild(item);
      categoryIndex++;
      checkProbSum();
    }

    function getConcordanciaColor(concordancia) {
            switch(concordancia) {
                case 'excelente': return '#27ae60';
                case 'buena': return '#f39c12';
                case 'regular': return '#e74c3c';
                default: return '#7f8c8d';
            }
        }

    function getConcordanciaMessage(concordancia, errorPorcentual) {
        switch(concordancia) {
            case 'excelente':
                return `<div style="background: #d5f4e6; padding: 10px; border-radius: 4px; margin-top: 10px; color: #27ae60;">✅ Excelente concordancia (${errorPorcentual.toFixed(2)}% de error)</div>`;
            case 'buena':
                return `<div style="background: #fef9e7; padding: 10px; border-radius: 4px; margin-top: 10px; color: #f39c12;">✅ Buena concordancia (${errorPorcentual.toFixed(2)}% de error)</div>`;
            case 'regular':
                return `<div style="background: #fdeaea; padding: 10px; border-radius: 4px; margin-top: 10px; color: #e74c3c;">⚠️ Concordancia regular. Considere aumentar simulaciones</div>`;
            default:
                return '';
        }
    }

    // Inicializar todo
    setupBernoulli();
    setupBinomial();
    setupExponencial();
    setupNormal();
    setupGibbs();
    setupNormalBivariada();
});