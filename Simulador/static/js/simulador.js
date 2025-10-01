// Referencias a elementos del DOM
    const resultados = document.querySelector('.results-content');
    const grafica = document.getElementById('chart');

    // Función para mostrar resultados (adaptada de tu código original)
    function mostrarResultados(resultadosIndividuales, exitos, fracasos) {
      let html = `
        <p><strong>Total de éxitos:</strong> ${exitos}</p>
        <p><strong>Total de fracasos:</strong> ${fracasos}</p>
      `;
      
      if (resultadosIndividuales && resultadosIndividuales.length <= 100) {
        html += `<p><strong>Resultados individuales:</strong> ${resultadosIndividuales.join(", ")}</p>`;
      }
      
      resultados.innerHTML = html;
    }

    

    function cambiarTab(tabName) {
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            document.getElementById(tabName).classList.add('active');
            document.querySelector(`[onclick="cambiarTab('${tabName}')"]`).classList.add('active');
            
            
        }

        function addCategory() {
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

    // Funcionalidad de navegación
    document.addEventListener('DOMContentLoaded', function() {
      const navItems = document.querySelectorAll('.nav-item');
      const distributionContents = document.querySelectorAll('.distribution-content');
      const panelTitle = document.getElementById('panelTitle');

      const titles = {
        'bernoulli': 'Distribución de Bernoulli',
        'binomial': 'Distribución Binomial',
        'multinomial': 'Distribución Multinomial',
        'exponencial': 'Distribución Exponencial',
        'normal': 'Distribución Normal',
        'gibbs': 'Método de Gibbs',
        'normal-bivariada': 'Distribucion Normal Bivariada'
      };

      navItems.forEach(item => {
        item.addEventListener('click', function() {
          // Remover clase active de todos los items
          navItems.forEach(nav => nav.classList.remove('active'));
          distributionContents.forEach(content => content.classList.remove('active'));

          // Agregar clase active al item seleccionado
          this.classList.add('active');
          
          // Mostrar el contenido correspondiente
          const distribution = this.getAttribute('data-distribution');
          const targetContent = document.getElementById(distribution);
          if (targetContent) {
            targetContent.classList.add('active');
          }

          // Actualizar título
          panelTitle.textContent = titles[distribution] || 'Simulador de Densidades';

          // limpiar gráfica y resultados
          grafica.innerHTML = '<div class="chart-placeholder">📈 Ajusta los parámetros y presiona "Simular" para generar la gráfica</div>';
          resultados.innerHTML = '¡Aquí podrás observar los resultados de la simulación!';
        });
      });

      // Funcionalidad para cada distribución
      Bernoulli();
      Binomial();
      Multinomial();
      Exponential();
      Normal();
      Gibbs();
      NormalBivariada();


      // Funcionalidad de los botones de limpiar
      const clearButtons = document.querySelectorAll('.btn-primary');
      clearButtons.forEach(button => {
        if (button.textContent === 'Limpiar') {
          button.addEventListener('click', function() {
            // Limpiar inputs y gráfica
            const activeContent = document.querySelector('.distribution-content.active');
            const inputs = activeContent.querySelectorAll('input');
            inputs.forEach(input => {
              input.value = input.getAttribute('value') || '';
            });
            grafica.innerHTML = '<div class="chart-placeholder">📈 Ajusta los parámetros y presiona "Simular" para generar la gráfica</div>';
            resultados.innerHTML = '¡Aquí podrás observar los resultados de la simulación!';
          });
        }
      });
    });

    // Configuración para Bernoulli
    function Bernoulli() {
      const bernoulliContent = document.getElementById('bernoulli');
      const simulateBtn = bernoulliContent.querySelector('.btn-primary');
      
      if (simulateBtn && simulateBtn.textContent === 'Simular') {
        simulateBtn.addEventListener('click', async () => {
          const numExp = parseInt(document.getElementById('bernoulli-n').value);
          const probExito = parseFloat(document.getElementById('bernoulli-p').value);

          if (!numExp || !probExito) {
            alert('Por favor, completa todos los campos');
            return;
          }

          grafica.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';

          try {
            const response = await fetch("/binomial_puntual", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                num_experimentos: numExp,
                probabilidad_exito: probExito
              })
            });

            const result = await response.json();
            mostrarResultados(result.resultados_individuales, result.exitos, result.fracasos);

            // Limpiar el área de la gráfica antes de dibujar
            grafica.innerHTML = "";

                // Crear el histograma con los datos recibidos
                // Preparar datos para Plotly
                const x = result.datos.map(d => d.rango);    // ["Éxito", "Fracaso"]
                const y = result.datos.map(d => d.freq);     // [10, 90]

                const trace = {
                    x: x,
                    y: y,
                    type: 'bar',
    
                    marker: { color: ['#6c5ce7', '#e21c1cff'] }
                };

                const layout = {
                    title: {
                        text: `Distribución Bernoulli (p=${probExito}, n=${numExp})`,
                        font: { size: 24 }
                    },
                    xaxis: {
                        title: { text: "Resultados posibles", font: { size: 16, color: "black" } }
                    },
                    yaxis: {
                        title: { text: "Frecuencia relativa", font: { size: 16, color: "black" } }
                    },
                };

                Plotly.newPlot('chart', [trace], layout, {responsive: true});
            
          } catch (error) {
            grafica.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>';
            console.error('Error:', error);
          }
        });
      }
    }

    // Configuración para Binomial
    function Binomial() {
      const binomialContent = document.getElementById('binomial');
      const simulateBtn = binomialContent.querySelector('.btn-primary');
      
      if (simulateBtn && simulateBtn.textContent === 'Simular') {
        simulateBtn.addEventListener('click', async () => {
          const numExp = parseInt(document.getElementById('binomial-sims').value);
          const probExito = parseFloat(document.getElementById('binomial-p').value);
          const numReps = parseInt(document.getElementById('binomial-n').value);

          if (!numExp || !probExito || !numReps) {
            alert('Por favor, completa todos los campos');
            return;
          }

          grafica.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';

          try {
            const response = await fetch("/binomial", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                num_experimentos: numExp,
                probabilidad_exito: probExito,
                num_pruebas: numReps
              })
            });

            const result = await response.json();

            
            grafica.innerHTML = "";

                // Crear el histograma con los datos recibidos
                // 1. Graficar con Plotly
                const trace = {
                    x: result.datos.x,
                    y: result.datos.y,
                    type: "bar",
                    marker: { color: "#6c5ce7" }
                };

                const layout = {
                    title: {
                        text: `Distribución Binomial (p=${probExito}, n=${numExp})`,
                        font: { size: 24 }
                    },
                    xaxis: {
                        title: { text: "Número de éxitos", font: { size: 16, color: "black" } }
                    },
                    yaxis: {
                        title: { text: "Frecuencia relativa", font: { size: 16, color: "black" } }
                    },
                    bargap: 0.2
                };

                Plotly.newPlot("chart", [trace], layout, {responsive: true});

            // Mostrar resultados
            let html = `
              <p><strong>Total de experimentos:</strong> ${result.total_experimentos}</p>
              <p><strong>Total de éxitos:</strong> ${result.total_exitos}</p>
              <p><strong>Total de fracasos:</strong> ${result.total_fracasos}</p>
            `;

            if (result.total_experimentos <= 100) {
              html += `<p><strong>Resultados individuales:</strong> ${result.resultados_individuales.join(", ")}</p>`;
            }

            resultados.innerHTML = html;
          } catch (error) {
            grafica.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>';
            console.error('Error:', error);
          }
        });
      }
    }

    // Configuración para Multinomial 
    
    let categoryIndex = 3;
    let categoryProbIndex = 3;

    
    

    function removeCategory(index) {
      const items = document.querySelectorAll('#categories-container .category-item');
      if (items.length <= 2) {
        alert('Debe haber al menos 2 categorías');
        return;
      }
      const item = document.querySelector(`#categories-container .category-item[data-index="${index}"]`);
      if (item) item.remove();
      checkProbSum();
    }

    function addCategoryProb() {
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

    function removeCategoryProb(index) {
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

    async function simularMultinomial() {
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

    async function calcularProbabilidad() {
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

          <div class="chart-container">
            <div id="chart-prob" style="width: 100%; height: 350px;"></div>
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

        Plotly.newPlot('chart-prob', [trace1, trace2], layout, { responsive: true });

      } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con la API');
      }
    }

    async function verificarSimulacion() {
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
  

    // Configuración para Exponencial
    function Exponential() {
      const expContent = document.getElementById('exponencial');
      const simulateBtn = expContent.querySelector('.btn-primary');
      
      if (simulateBtn && simulateBtn.textContent === 'Simular') {
        simulateBtn.addEventListener('click', async () => {
          const numExp = parseInt(document.getElementById('exponencial-n').value);
          const lambda = parseFloat(document.getElementById('exponencial-lambda').value);

          if (!numExp || !lambda) {
            alert('Por favor, completa todos los campos');
            return;
          }

          grafica.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';

          try {
            const response = await fetch("/exponencial", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                num_experimentos: numExp,
                tasa: lambda
              })
            });

            const result = await response.json();

            
            const valores = result.valores;
            const tasa = result.tasa;

                //limpiar el área de la gráfica antes de dibujar
                grafica.innerHTML = "";

                // Crear el histograma con los datos recibidos
                const hist = {
                    x: valores,
                    type: "histogram",
                    histnorm: "probability density", // <- normalización
                    name: "Frecuencia simulada",
                    opacity: 0.2,
                    marker: {color: "#3498db"},
                    nbinsx: 100
                };

                // --- Curva teórica ---
                const maxX = Math.max(...valores);
                const xs = [];
                const ys = [];
                const pasos = 100;
                for (let i = 0; i <= pasos; i++) {
                    const x = (i / pasos) * maxX;
                    xs.push(x);
                    ys.push(tasa * Math.exp(-tasa * x));
                }

                const curva = {
                    x: xs,
                    y: ys,
                    type: "scatter",
                    mode: "lines",
                    line: {color: "red", width: 2},
                    name: "Exponencial teórica"
                };


                // --- Mostrar ---
                Plotly.newPlot("chart", [hist, curva], {
                    title: {
                        text: `Distribución Exponencial (λ=${tasa}, n=${valores.length})`,
                        font: { size: 24 }
                    },
                    xaxis: {
                        title: { text: "Tiempo entre eventos", font: { size: 16, color: "black" } }
                    },
                    yaxis: {
                        title: { text: "Densidad de probabilidad", font: { size: 16, color: "black" } }
                    },
                    bargap: 0.4
                    },{responsive: true});


                // 2. Mostrar resultados como texto
                resultados.innerHTML = `
                    <h3>Resultados</h3>
                    <p><b>Tasa (λ):</b> ${tasa}</p>
                    <p><b>Total de experimentos:</b> ${result.total_experimentos}</p>
                    <p><b>Primeros 10 valores simulados:</b> ${valores.slice(0, 10).map(v => v.toFixed(3)).join(", ")} ...</p>
                `;
            }
            
          catch (error) {
            grafica.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>';
            console.error('Error:', error);
          }
        });
      }
    }

    // Configuración para Normal
    function Normal() {
      const normalContent = document.getElementById('normal');
      const simulateBtn = normalContent.querySelector('.btn-primary');
      
      if (simulateBtn && simulateBtn.textContent === 'Simular') {
        simulateBtn.addEventListener('click', async () => {
          const numExp = parseInt(document.getElementById('normal-n').value);
          const media = parseFloat(document.getElementById('normal-mu').value);
          const desviacion = parseFloat(document.getElementById('normal-sigma').value);

          if (!numExp || isNaN(media) || !desviacion) {
            alert('Por favor, completa todos los campos');
            return;
          }

          grafica.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación...</div>';

          try {
            const response = await fetch("/normal", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                num_experimentos: numExp,
                media: media,
                desviacion_estandar: desviacion
              })
            });

            const result = await response.json();

             grafica.innerHTML = "";

                // Calcular estadísticas de los valores simulados
                const valores = result.valores;
                const n = valores.length;
                const sum = valores.reduce((a,b) => a+b, 0);
                const mean = sum / n;
                const variance = valores.reduce((a,b) => a + (b-mean)**2, 0) / n;
                const std = Math.sqrt(variance);
                const min = Math.min(...valores);
                const max = Math.max(...valores);

                // Mostrar resumen
                resultados.innerHTML = `
                    <strong>Parámetros ingresados:</strong> <br>
                    Media: ${result.media} <br>
                    Desviación estándar: ${result.desviacion_estandar} <br>
                    Total experimentos: ${result.total_experimentos} <br><br>

                    <strong>Estadísticas de la simulación:</strong> <br>
                    Media simulada: ${mean.toFixed(2)} <br>
                    Desviación estándar simulada: ${std.toFixed(2)} <br>
                    Mínimo: ${min.toFixed(2)} <br>
                    Máximo: ${max.toFixed(2)}
                `;

                // Crear el histograma con los datos recibidos
                // Graficar histograma
                const hist = {
                    x: result.valores,
                    type: "histogram",
                    histnorm: "probability density", // área = 1
                    name: "Simulación",
                    opacity: 0.7,
                    marker: { color: "#3498db" },
                    nbinsx: 100
                };

                // --- Curva normal teórica ---
                const minX = Math.min(...valores);
                const maxX = Math.max(...valores);
                const xs = [];
                const ys = [];
                const pasos = 200;
                for (let i = 0; i <= pasos; i++) {
                    const x = minX + (i / pasos) * (maxX - minX);
                    xs.push(x);
                    const y = (1 / (result.desviacion_estandar * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - result.media) / result.desviacion_estandar, 2));
                    ys.push(y);
                }

                const curva = {
                    x: xs,
                    y: ys,
                    type: "scatter",
                    mode: "lines",
                    line: {color: "red", width: 2},
                    name: "Normal teórica"
                };

                // --- Mostrar ---
                Plotly.newPlot("chart", [hist, curva], {
                    title: { 
                        text: `Distribución Normal (μ=${result.media}, σ=${result.desviacion_estandar}, n=${n})`, 
                        font: { size: 24 } 
                    },
                    xaxis: {
                        title: { text: "Valores", font: { size: 16, color: "black" } }
                    },
                    yaxis: {
                        title: { text: "Densidad de probabilidad", font: { size: 16, color: "black" } }
                    },
                    bargap: 0.2
                }, {
                    responsive: true
                });
            }
          catch (error) {
            grafica.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>';
            console.error('Error:', error);
          }
        });
      }
    }

    // Configuración para Gibbs 
    function Gibbs() {
      const gibbsContent = document.getElementById('gibbs');
      const simulateBtn = gibbsContent.querySelector('.btn-primary');
      
      if (simulateBtn && simulateBtn.textContent === 'Simular') {
        simulateBtn.addEventListener('click', async () => {
          const body = {
              num_experimentos: parseInt(document.getElementById('gibbs-iterations').value),
              num_burn_in: parseInt(document.getElementById('gibbs-burnin').value),
              x0: parseFloat(document.getElementById('x0').value),
              y0: parseFloat(document.getElementById('y0').value),
              x_min: parseFloat(document.getElementById('limite_inf').value),
              x_max: parseFloat(document.getElementById('limite_sup').value),
              y_min: parseFloat(document.getElementById('limite_inf').value),
              y_max: parseFloat(document.getElementById('limite_sup').value)
          };
          // Validaciones
          for (const key in body) {
              if (isNaN(body[key])) {
                  alert('Por favor, completa todos los campos correctamente');
                  return;
              }
              if ((key === 'num_experimentos' || key === 'num_burn_in') && body[key] <= 0) {
                  alert('El número de experimentos y burn-in deben ser mayores que 0');
                  return;
              }
              if ((key === 'x_max' || key === 'y_max') && body[key] <= body[key.replace('max', 'min')]) {
                  alert('El límite superior debe ser mayor que el límite inferior');
                  return;
              }
            }
              
              //mostrar loading
              grafica.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación 3D...</div>';

              try {
                const [samplesResponse, traceResponse] = await Promise.all([
                  fetch("/sample", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                  }),
                  fetch("/target-function-data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body)
                  })
                ]);
                if(!samplesResponse.ok || !traceResponse.ok) {
                  throw new Error('Error en la respuesta del servidor');
                }

                const samplingResult = await samplesResponse.json();
                const targetFunData = await traceResponse.json();

                // Limpiar el área de la gráfica
                grafica.innerHTML = "";

                // --- Gráfica de puntos 3D (scatter) ---
                
              // --- Traza 1: Superficie de la función objetivo ---
              const superficie = {
              x: targetFunData.x_grid,
              y: targetFunData.y_grid,
              z: targetFunData.z_grid,
              type: 'surface',
              name: 'Función Objetivo',
              colorscale: 'Viridis',
              opacity: 0.7,
              showscale: false // Ocultar la barra de color para no saturar
            };

            // --- Traza 2: Puntos del muestreo de Gibbs ---
            // Para no sobrecargar el gráfico, mostramos solo una fracción de los puntos
            const step = Math.max(1, Math.floor(samplingResult.x_samples.length / 1000));
            const x_samples_subset = samplingResult.x_samples.filter((_, i) => i % step === 0);
            const y_samples_subset = samplingResult.y_samples.filter((_, i) => i % step === 0);
            
            // Necesitamos calcular el valor Z para cada punto de la muestra para ubicarlo en la superficie
            const z_samples = x_samples_subset.map((x, i) => {
                // Esta es una aproximación simple. La función objetivo real no se expone al frontend.
                // Podríamos añadir un endpoint para esto, pero por ahora los ponemos sobre la superficie.
                // Para una visualización más precisa, la API debería devolver f(x,y) para cada muestra.
                // Por simplicidad, los ponemos a una altura fija o sobre la superficie.
                return 0; // O un valor Z calculado si lo tuvieras
            });

            const scatter3d = {
              x: samplingResult.x_samples,
              y: samplingResult.y_samples,
              z: new Array(samplingResult.x_samples.length).fill(0), // Proyección en z=0
              mode: 'markers',
              type: 'scatter3d',
              name: 'Muestras de Gibbs',
              marker: { size: 2, color: 'rgba(255, 0, 0, 0.5)' } // Rojo con transparencia
            };

            // 6. Configurar el layout y crear el gráfico 3D
            const layout3D = {
              title: 'Muestreo de Gibbs y Función Objetivo',
              scene: {
                xaxis: { title: 'X' },
                yaxis: { title: 'Y' },
                zaxis: { title: 'f(X, Y)' }
              },
              margin: { l: 0, r: 0, b: 0, t: 40 }
            };
            Plotly.newPlot('chart', [superficie, scatter3d], layout3D, { responsive: true });
          }
          catch (error) {
            grafica.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>';
            console.error('Error:', error);
          }
        });
      } 
          
    }


    function NormalBivariada() {
  const normalBivariadaContent = document.getElementById('normal-bivariada');
  const simulateBtn = normalBivariadaContent.querySelector('.btn-primary');
  
  if (simulateBtn && simulateBtn.textContent === 'Simular') {
    simulateBtn.addEventListener('click', async () => {
      const numExp = parseInt(document.getElementById('bivariada-n').value);
      const muX = parseFloat(document.getElementById('bivariada-mu-x').value);
      const muY = parseFloat(document.getElementById('bivariada-mu-y').value);
      const sigmaX = parseFloat(document.getElementById('bivariada-sigma-x').value);
      const sigmaY = parseFloat(document.getElementById('bivariada-sigma-y').value);
      const rho = parseFloat(document.getElementById('bivariada-rho').value);

      // Validaciones
      if (!numExp || isNaN(muX) || isNaN(muY) || !sigmaX || !sigmaY || isNaN(rho)) {
        alert('Por favor, completa todos los campos');
        return;
      }

      if (rho < -1 || rho > 1) {
        alert('El coeficiente de correlación debe estar entre -1 y 1');
        return;
      }

      if (sigmaX <= 0 || sigmaY <= 0) {
        alert('Las desviaciones estándar deben ser mayores que 0');
        return;
      }

      grafica.innerHTML = '<div class="chart-placeholder">🔄 Generando simulación 3D...</div>';

      try {
        const response = await fetch("/normal_bivariada", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            num_experimentos: numExp,
            mu_x: muX,
            mu_y: muY,
            sigma_x: sigmaX,
            sigma_y: sigmaY,
            rho: rho
          })
        });

        const result = await response.json();

        if (result.error) {
          alert('Error: ' + result.error);
          return;
        }

        // Limpiar el área de la gráfica
        grafica.innerHTML = "";

        // --- Gráfica de puntos 3D (scatter) ---
        const scatter3d = {
          x: result.valores_x,
          y: result.valores_y,
          z: new Array(result.valores_x.length).fill(0), // puntos en z=0
          mode: 'markers',
          type: 'scatter3d',
          name: 'Datos simulados',
          marker: {
            size: 3,
            color: result.valores_x,
            colorscale: 'Viridis',
            opacity: 0.6
          }
        };

        // --- Superficie teórica 3D ---
        const superficie = {
          x: result.superficie_teorica.x,
          y: result.superficie_teorica.y,
          z: result.superficie_teorica.z,
          type: 'surface',
          name: 'Densidad teórica',
          colorscale: [
            [0, 'rgb(68,1,84)'],     // violeta oscuro
            [0.2, 'rgb(59,82,139)'], // azul
            [0.4, 'rgb(33,145,140)'], // verde azulado
            [0.6, 'rgb(94,201,98)'], // verde
            [0.8, 'rgb(186,222,40)'], // verde amarillo
            [1, 'rgb(253,231,37)']   // amarillo
          ],
          opacity: 0.8,
          contours: {
            z: {
              show: true,
              usecolormap: true,
              highlightcolor: "limegreen",
              project: {z: true}
            }
          }
        };

        const layout = {
          title: {
            text: `Normal Bivariada (μₓ=${muX}, μᵧ=${muY}, σₓ=${sigmaX}, σᵧ=${sigmaY}, ρ=${rho})`,
            font: { size: 18 }
          },
          scene: {
            xaxis: {
              title: 'X',
              gridcolor: 'rgb(255, 255, 255)',
              zerolinecolor: 'rgb(255, 255, 255)',
              showbackground: true,
              backgroundcolor: 'rgb(230, 230,230)'
            },
            yaxis: {
              title: 'Y',
              gridcolor: 'rgb(255, 255, 255)',
              zerolinecolor: 'rgb(255, 255, 255)',
              showbackground: true,
              backgroundcolor: 'rgb(230, 230,230)'
            },
            zaxis: {
              title: 'Densidad',
              gridcolor: 'rgb(255, 255, 255)',
              zerolinecolor: 'rgb(255, 255, 255)',
              showbackground: true,
              backgroundcolor: 'rgb(230, 230,230)'
            },
            camera: {
              eye: {x: 1.5, y: 1.5, z: 1.5}
            }
          },
          margin: {
            l: 0,
            r: 0,
            b: 0,
            t: 50
          }
        };

        // Crear la gráfica con ambos trazos
        Plotly.newPlot('chart', [superficie, scatter3d], layout, {
          responsive: true,
          displayModeBar: true
        });

        // Mostrar estadísticas
        const obs = result.estadisticas_observadas;
        const params = result.parametros;
        
        resultados.innerHTML = `
          <h3>Parámetros teóricos:</h3>
          <p><b>Media X:</b> ${params.mu_x}</p>
          <p><b>Media Y:</b> ${params.mu_y}</p>
          <p><b>Desviación X:</b> ${params.sigma_x}</p>
          <p><b>Desviación Y:</b> ${params.sigma_y}</p>
          <p><b>Correlación:</b> ${params.rho}</p>
          <p><b>Simulaciones:</b> ${params.num_experimentos}</p>
          
          <h3>Estadísticas observadas:</h3>
          <p><b>Media X observada:</b> ${obs.media_x.toFixed(3)}</p>
          <p><b>Media Y observada:</b> ${obs.media_y.toFixed(3)}</p>
          <p><b>Desviación X observada:</b> ${obs.sigma_x.toFixed(3)}</p>
          <p><b>Desviación Y observada:</b> ${obs.sigma_y.toFixed(3)}</p>
          <p><b>Correlación observada:</b> ${obs.rho.toFixed(3)}</p>
          
          <h3>Errores:</h3>
          <p><b>Error en media X:</b> ${Math.abs(params.mu_x - obs.media_x).toFixed(3)}</p>
          <p><b>Error en media Y:</b> ${Math.abs(params.mu_y - obs.media_y).toFixed(3)}</p>
          <p><b>Error en correlación:</b> ${Math.abs(params.rho - obs.rho).toFixed(3)}</p>
        `;

      } catch (error) {
        grafica.innerHTML = '<div class="chart-placeholder">❌ Error al generar la simulación</div>';
        console.error('Error:', error);
      }
    });
  }
}