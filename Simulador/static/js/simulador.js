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
    function Multinomial() {
      const multinomialContent = document.getElementById('multinomial');
      const simulateBtn = multinomialContent.querySelector('.btn-primary');
      let ultimoResultado = null;
      
      if (simulateBtn && simulateBtn.textContent === 'Simular') {
        simulateBtn.addEventListener('click', async () => {
          const n_experimentos = parseInt(document.getElementById("n_experimentos").value);
          const categorias = document.getElementById("categorias").value.split(",").map(c => c.trim());
          const probabilidades = document.getElementById("prob_sim_mult").value.split(",").map(Number);

          if (categorias.length !== probabilidades.length) {
              alert("El número de categorías debe coincidir con el número de probabilidades");
              return;
          }

          const suma = probabilidades.reduce((a, b) => a + b, 0);
          if (Math.abs(suma - 1.0) > 0.01) {
              alert(`Las probabilidades deben sumar 1.0 (suma actual: ${suma.toFixed(4)})`);
              return;
          }

          const payload = { n_experimentos, categorias, probabilidades };
          console.log("Payload:", payload);

          try {
              const res = await fetch("/multinomial", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload)
              });
              console.log("Response status:", res.status);
              const data = await res.json();
              
              if (data.error) {
                  alert("Error: " + data.error);
                  return;
              }

              console.log("Data received:", data);

              // document.getElementById("resultado_texto").textContent = JSON.stringify(data, null, 2);
              document.getElementById("resultado-simulacion").style.display = 'block';

             // Limpiar área de la gráfica
              grafica.innerHTML = "";

              // Barras para frecuencias observadas
              const obsTrace = {
                  x: data.categorias,
                  y: data.frecuencias_observadas,
                  type: "bar",
                  name: "Frecuencia observada",
                  marker: { color: "#6c5ce7" }
              };

              // Barras para frecuencias esperadas
              const expTrace = {
                  x: data.categorias,
                  y: data.frecuencias_esperadas,
                  type: "bar",
                  name: "Frecuencia esperada",
                  marker: { color: "#837ea5ff" }
              };

              // Configuración del layout
              const layout = {
                  title: { text: "Distribución Multinomial (Observada vs Esperada)" },
                  xaxis: { title: "Categorías" },
                  yaxis: { title: "Frecuencia" },
                  barmode: "group" // 🔹 Ahora las barras estarán una al lado de la otra
              };

              // Renderizar con Plotly
              Plotly.newPlot("chart", [obsTrace, expTrace], layout, { responsive: true });

              // Mostrar resultados en texto
              resultados.innerHTML = `
                  <h3>Resultados</h3>
                  <p><b>Total de experimentos:</b> ${data.n_experimentos}</p>
                  <p><b>Categorías:</b> ${data.categorias.join(", ")}</p>
                  <p><b>Frecuencias observadas:</b> ${data.frecuencias_observadas.join(", ")}</p>
                  <p><b>Frecuencias esperadas:</b> ${data.frecuencias_esperadas.join(", ")}</p>
              `;
                } catch (error) {
                    console.error("Error:", error);
                    alert("Error al conectar con la API: " + error.message);
                }
            
          });
      }


      // probabilidad exacta
      const probaContent = document.getElementById('probabilidad');
      const probaBtn = probaContent.querySelector('.btn-proba');

      if (probaBtn && probaBtn.textContent === 'Simular') {
        probaBtn.addEventListener('click', async () => {
            const n_experimentos = parseInt(document.getElementById("n_experimentos_prob").value);
            const categorias = document.getElementById("categorias_prob").value.split(",").map(c => c.trim());
            const probabilidades = document.getElementById("probabilidades_prob").value.split(",").map(Number);
            const frecuencias_deseadas = document.getElementById("frecuencias_deseadas").value.split(",").map(Number);

            // Validaciones
            if (categorias.length !== probabilidades.length || probabilidades.length !== frecuencias_deseadas.length) {
                alert("Todas las listas deben tener la misma longitud");
                return;
            }

            const sumaProb = probabilidades.reduce((a, b) => a + b, 0);
            if (Math.abs(sumaProb - 1.0) > 0.01) {
                alert(`Las probabilidades deben sumar 1.0 (suma actual: ${sumaProb.toFixed(4)})`);
                return;
            }

            const sumaFreq = frecuencias_deseadas.reduce((a, b) => a + b, 0);
            if (sumaFreq !== n_experimentos) {
                alert(`Las frecuencias deben sumar ${n_experimentos} (suma actual: ${sumaFreq})`);
                return;
            }

            const payload = { n_experimentos, categorias, probabilidades, frecuencias_deseadas };

            try {
                const res = await fetch("/calcular-probabilidad", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                console.log("Data PROBABILIDAD received:", data);
                if (data.error) {
                    alert("Error: " + data.error);
                    return;
                }

                
                ultimoResultado = payload; // Guardar el último payload enviado


                grafica.innerHTML = "";

                // Barras para frecuencias deseadas
                const deseadasTrace = {
                    x: data.categorias,
                    y: data.frecuencias_deseadas,
                    type: "bar",
                    name: "Frecuencia deseada",
                    marker: { color: "#6c5ce7" },
                    opacity: 0.6
                };

                // Barras para frecuencias esperadas (calculadas)
                const esperadasTrace = {
                    x: data.categorias,
                    y: data.frecuencias_esperadas,
                    type: "bar",
                    name: "Frecuencia esperada",
                    marker: { color: "#837ea5ff" },
                    opacity: 0.7
                };

                const layout = {
                    title: { text: "Distribución Multinomial (Deseada vs Esperada)" },
                    xaxis: { title: "Categorías" },
                    yaxis: { title: "Frecuencia" },
                    barmode: "group"
                };

                Plotly.newPlot("chart", [deseadasTrace, esperadasTrace], layout, { responsive: true });


                // ----------------- RESULTADOS -----------------
                resultados.innerHTML = `
                    <h3>Resultados de la probabilidad exacta</h3>
                    <p><b>Total de experimentos:</b> ${data.n_experimentos}</p>
                    <p><b>Categorías:</b> ${data.categorias.join(", ")}</p>
                    <p><b>Probabilidades:</b> ${data.probabilidades.join(", ")}</p>
                    <p><b>Frecuencias deseadas:</b> ${data.frecuencias_deseadas.join(", ")}</p>
                    <p><b>Frecuencias esperadas:</b> ${data.frecuencias_esperadas.join(", ")}</p>
                    <p><b>Coeficiente multinomial:</b> ${data.coeficiente_multinomial}</p>
                    <p><b>Producto de probabilidades:</b> ${data.producto_probabilidades.toExponential(6)}</p>
                    <p><b>Probabilidad exacta:</b> ${data.probabilidad_exacta.toExponential(6)}</p>
                    <p><b>Interpretación:</b> ${data.interpretacion.rareza} (~${data.interpretacion.porcentaje.toFixed(2)}%)</p>
                    <p><b>Cálculo completo:</b> ${data.calculo_completo.formula} = ${data.calculo_completo.resultado}</p>
                `;

            } catch (error) {
                console.error("Error:", error);
                alert("Error al conectar con la API: " + error.message);
            }

        });
      }


      const verificarBtn = probaContent.querySelector('#btn-verif');

      if (verificarBtn && verificarBtn.textContent === 'Verificar') {
        verificarBtn.addEventListener('click', async () => {
          console.log("Iniciando verificación...");
           if (!ultimoResultado) return;
           console.log("Verificando con:", ultimoResultado);

           try {
                const res = await fetch("/simular-verificacion", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(ultimoResultado)
                });

                const data = await res.json();
                
                if (data.error) {
                    alert("Error: " + data.error);
                    return;
                }
                const sim = data.simulacion;
                resultados.innerHTML += `
                    <br><br>

                    <h3>🧪 Verificación por Simulación</h3>
                    <p><strong>Simulaciones realizadas:</strong> ${sim.num_simulaciones.toLocaleString()}</p>
                    <p><strong>Éxitos encontrados:</strong> ${sim.exitos_encontrados.toLocaleString()}</p>
                    <p><strong>Probabilidad simulada:</strong> ${sim.probabilidad_simulada.toFixed(6)}</p>
                    <p><strong>Probabilidad teórica:</strong> ${sim.probabilidad_teorica.toFixed(6)}</p>
                    <p><strong>Error porcentual:</strong> ${sim.error_porcentual.toFixed(2)}%</p>
                    <p><strong>Concordancia:</strong> <span style="color: ${getConcordanciaColor(sim.concordancia)}; font-weight: bold;">${sim.concordancia.toUpperCase()}</span></p>
                    ${getConcordanciaMessage(sim.concordancia, sim.error_porcentual)}
                `;

            } catch (error) {
                console.error("Error:", error);
                alert("Error al realizar la verificación: " + error.message);
            }
        });
      }


    }

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