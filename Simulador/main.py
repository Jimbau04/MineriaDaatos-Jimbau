from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
from collections import Counter
import math
import numpy as np
from typing import List, Dict, Optional, Tuple
import time
import traceback
from sympy import symbols, sympify, integrate, simplify, Eq, solve
from sympy.parsing.sympy_parser import parse_expr

# --- Símbolos globales para Sympy ---
x, y, u = symbols('x y u', real=True)

simulador = FastAPI(title="Simulador de Densidades API", version="1.0.0")

# Configurar CORS para permitir requests del frontend
simulador.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar el directorio 'static'
simulador.mount("/static", StaticFiles(directory="Simulador/static"), name="static")


# Serve la página principal
@simulador.get("/", response_class=HTMLResponse)
async def read_root():
    with open("Simulador/static/index.html", "r", encoding="utf-8") as f:
        return f.read()


# =============================================================================
# BINOMIAL PUNTUAL (BERNOULLI)
# =============================================================================

class BernoulliInput(BaseModel):
    num_experimentos: int
    probabilidad_exito: float


@simulador.post("/binomial_puntual")
async def binomial_puntual(data: BernoulliInput):
    exito = 0
    fracaso = 0
    resultados = []
    
    for i in range(data.num_experimentos):
        resultado = random.random()
        if resultado < data.probabilidad_exito:
            exito += 1
            resultados.append(1)
        else:
            fracaso += 1
            resultados.append(0)
    
    return {
        "datos": [
            {"rango": "Éxito", "freq": exito},
            {"rango": "Fracaso", "freq": fracaso}
        ],
        "resultados_individuales": resultados,
        "total_experimentos": data.num_experimentos,
        "exitos": exito,
        "fracasos": fracaso
    }


# =============================================================================
# BINOMIAL
# =============================================================================

class BinomialInput(BaseModel):
    num_experimentos: int
    probabilidad_exito: float
    num_pruebas: int


@simulador.post("/binomial")
async def binomial(data: BinomialInput):
    resultados = []
    
    if data.num_pruebas > 10000 and data.num_experimentos > 1000:
         raise HTTPException(status_code=400, detail="La combinación de ensayos y simulaciones es demasiado grande.")

    for _ in range(data.num_experimentos):
        exitos_en_prueba = 0
        for _ in range(data.num_pruebas):
            if random.random() < data.probabilidad_exito:
                exitos_en_prueba += 1
        resultados.append(exitos_en_prueba)
    
    conteo_frecuencia = Counter(resultados)
    datos_respuesta = {
        "x": sorted(list(conteo_frecuencia.keys())),
        "y": [conteo_frecuencia[k] for k in sorted(conteo_frecuencia.keys())]
    }
    
    estadisticas_calculadas = {}
    if resultados:
        estadisticas_calculadas = {
            "media": float(np.mean(resultados)),
            "desviacion_estandar": float(np.std(resultados)),
            "minimo": int(np.min(resultados)),
            "maximo": int(np.max(resultados))
        }
    else:
        estadisticas_calculadas = {"media": 0, "desviacion_estandar": 0, "minimo": 0, "maximo": 0}
    
    return {
        "datos": datos_respuesta,
        "resultados_individuales": resultados,
        "total_experimentos": data.num_experimentos,
        "estadisticas": estadisticas_calculadas
    }


# =============================================================================
# MULTINOMIAL
# =============================================================================

class MultinomialInput(BaseModel):
    n_experimentos: int
    categorias: List[str]
    probabilidades: List[float]


class ProbabilityInput(BaseModel):
    n_experimentos: int
    categorias: List[str]
    probabilidades: List[float]
    frecuencias_deseadas: List[int]


def factorial(n):
    """Calcula el factorial de n"""
    if n <= 1:
        return 1
    resultado = 1
    for i in range(2, n + 1):
        resultado *= i
    return resultado


def coeficiente_multinomial(n, frecuencias):
    """Calcula el coeficiente multinomial: n! / (n1! * n2! * ... * nk!)"""
    numerador = factorial(n)
    denominador = 1
    for freq in frecuencias:
        denominador *= factorial(freq)
    return numerador / denominador


def funcion_densidad_multinomial(n, frecuencias, probabilidades):
    """Calcula la función de densidad multinomial evitando overflow con logaritmos"""
    if sum(frecuencias) != n:
        raise ValueError(f"La suma de frecuencias {sum(frecuencias)} no coincide con n={n}")
    if not math.isclose(sum(probabilidades), 1.0, rel_tol=1e-9):
        raise ValueError("Las probabilidades deben sumar 1")
    if any(p <= 0 for p in probabilidades):
        raise ValueError("Todas las probabilidades deben ser mayores que 0")
    
    log_coef = math.lgamma(n + 1) - sum(math.lgamma(f + 1) for f in frecuencias)
    log_producto_prob = sum(f * math.log(p) for f, p in zip(frecuencias, probabilidades))
    log_prob = log_coef + log_producto_prob
    
    return math.exp(log_prob)


def simular_multinomial_simple(n_experimentos, probabilidades):
    """Simula experimentos multinomiales"""
    k = len(probabilidades)
    frecuencias = [0] * k
    
    prob_acumuladas = []
    acum = 0
    for prob in probabilidades:
        acum += prob
        prob_acumuladas.append(acum)
    
    for _ in range(n_experimentos):
        rand_num = random.random()
        for j, prob_acum in enumerate(prob_acumuladas):
            if rand_num <= prob_acum:
                frecuencias[j] += 1
                break
    
    return frecuencias


def validar_entrada(probabilidades, frecuencias_deseadas=None, n_experimentos=None):
    """Valida los datos de entrada"""
    suma_prob = sum(probabilidades)
    if not (0.99 <= suma_prob <= 1.01):
        return f"Las probabilidades deben sumar 1.0 (suma actual: {suma_prob:.6f})"
    
    if any(p <= 0 for p in probabilidades):
        return "Todas las probabilidades deben ser mayores que 0"
    
    if frecuencias_deseadas is not None and n_experimentos is not None:
        if sum(frecuencias_deseadas) != n_experimentos:
            return f"Las frecuencias deseadas deben sumar {n_experimentos}"
        if any(f < 0 for f in frecuencias_deseadas):
            return "Las frecuencias no pueden ser negativas"
    
    return None


@simulador.post("/multinomial")
def multinomial(data: MultinomialInput):
    """Endpoint original - simulación básica"""
    try:
        error = validar_entrada(data.probabilidades)
        if error:
            raise HTTPException(status_code=400, detail=error)
        
        resultados = simular_multinomial_simple(data.n_experimentos, data.probabilidades)
        esperadas = [data.n_experimentos * p for p in data.probabilidades]
        
        return {
            "n_experimentos": data.n_experimentos,
            "categorias": data.categorias,
            "frecuencias_observadas": resultados,
            "frecuencias_esperadas": esperadas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en simulación: {str(e)}")


@simulador.post("/calcular-probabilidad")
def calcular_probabilidad(data: ProbabilityInput):
    """Calcula la probabilidad exacta de una configuración específica"""
    error = validar_entrada(data.probabilidades, data.frecuencias_deseadas, data.n_experimentos)
    if error:
        return {"error": error}
    
    try:
        densidad = funcion_densidad_multinomial(
            data.n_experimentos,
            data.frecuencias_deseadas,
            data.probabilidades
        )
        
        frecuencias_esperadas = [data.n_experimentos * p for p in data.probabilidades]
        coef = coeficiente_multinomial(data.n_experimentos, data.frecuencias_deseadas)
        
        producto_prob = 1
        detalles_calculo = []
        for i, (prob, freq) in enumerate(zip(data.probabilidades, data.frecuencias_deseadas)):
            termino = pow(prob, freq)
            producto_prob *= termino
            detalles_calculo.append({
                "categoria": data.categorias[i],
                "probabilidad": prob,
                "frecuencia": freq,
                "termino": f"({prob:.4f})^{freq}",
                "valor": termino
            })
        
        interpretacion = {}
        if densidad > 0:
            porcentaje = densidad * 100
            uno_en = int(1/densidad)
            
            if densidad >= 0.1:
                rareza = "muy común"
            elif densidad >= 0.01:
                rareza = "común"
            elif densidad >= 0.001:
                rareza = "poco común"
            elif densidad >= 0.0001:
                rareza = "raro"
            elif densidad >= 0.00001:
                rareza = "muy raro"
            elif densidad >= 0.000000001:
                rareza = "extremadamente raro"
            else:
                rareza = "casi imposible"
            
            interpretacion = {
                "porcentaje": porcentaje,
                "uno_en": uno_en,
                "rareza": rareza,
                "anos_si_diario": uno_en // 365 if uno_en >= 365 else 0
            }
        else:
            interpretacion = {
                "porcentaje": 0,
                "uno_en": float('inf'),
                "rareza": "imposible",
                "anos_si_diario": 0
            }
        
        return {
            "categorias": data.categorias,
            "n_experimentos": data.n_experimentos,
            "probabilidades": data.probabilidades,
            "frecuencias_deseadas": data.frecuencias_deseadas,
            "frecuencias_esperadas": frecuencias_esperadas,
            "probabilidad_exacta": densidad,
            "coeficiente_multinomial": coef,
            "producto_probabilidades": producto_prob,
            "detalles_calculo": detalles_calculo,
            "interpretacion": interpretacion,
            "calculo_completo": {
                "formula": f"P(X) = {coef:,.0f} × {producto_prob:.6e}",
                "resultado": f"{densidad:.6e}"
            }
        }
    except Exception as e:
        return {"error": f"Error en el cálculo: {str(e)}"}


@simulador.post("/simular-verificacion")
def simular_verificacion(data: ProbabilityInput):
    """Verifica el resultado teórico mediante simulación"""
    error = validar_entrada(data.probabilidades, data.frecuencias_deseadas, data.n_experimentos)
    if error:
        return {"error": error}
    
    try:
        densidad_teorica = funcion_densidad_multinomial(
            data.n_experimentos,
            data.frecuencias_deseadas,
            data.probabilidades
        )
        
        if densidad_teorica > 0:
            num_simulaciones = min(50000, max(5000, int(1/densidad_teorica * 10)))
        else:
            num_simulaciones = 10000
        
        contador_exito = 0
        for _ in range(num_simulaciones):
            frecuencias_sim = simular_multinomial_simple(data.n_experimentos, data.probabilidades)
            if frecuencias_sim == data.frecuencias_deseadas:
                contador_exito += 1
        
        probabilidad_simulada = contador_exito / num_simulaciones
        
        estadisticas = {
            "num_simulaciones": num_simulaciones,
            "exitos_encontrados": contador_exito,
            "probabilidad_simulada": probabilidad_simulada,
            "probabilidad_teorica": densidad_teorica,
            "diferencia_absoluta": abs(probabilidad_simulada - densidad_teorica),
            "error_porcentual": 0 if densidad_teorica == 0 else 
                abs(probabilidad_simulada - densidad_teorica) / densidad_teorica * 100
        }
        
        if densidad_teorica > 0:
            if estadisticas["error_porcentual"] < 10:
                concordancia = "excelente"
            elif estadisticas["error_porcentual"] < 25:
                concordancia = "buena"
            else:
                concordancia = "regular"
        else:
            concordancia = "no aplicable"
        
        estadisticas["concordancia"] = concordancia
        
        return {
            "simulacion": estadisticas,
            "mensaje": f"Simulación completada con {num_simulaciones:,} experimentos"
        }
    except Exception as e:
        return {"error": f"Error en la simulación: {str(e)}"}


# =============================================================================
# EXPONENCIAL
# =============================================================================

class ExponencialInput(BaseModel):
    num_experimentos: int
    tasa: float


@simulador.post("/exponencial")
async def exponencial(data: ExponencialInput):
    if data.tasa <= 0:
        raise HTTPException(status_code=400, detail="La tasa debe ser mayor que 0.")
    
    # --- CÁLCULO ORIGINAL RESTAURADO ---
    valores = []
    for _ in range(data.num_experimentos):
        u = random.random()
        x = -math.log(1 - u) / data.tasa
        valores.append(x)
    
    # --- ADICIÓN NECESARIA PARA ESTADÍSTICAS ---
    estadisticas_calculadas = {}
    if valores:
        estadisticas_calculadas = {
            "media": float(np.mean(valores)),
            "desviacion_estandar": float(np.std(valores)),
            "minimo": float(np.min(valores)),
            "maximo": float(np.max(valores))
        }
    else:
         estadisticas_calculadas = {"media": 0, "desviacion_estandar": 0, "minimo": 0, "maximo": 0}

    return {
        "valores": valores,
        "tasa": data.tasa,
        "total_experimentos": data.num_experimentos,
        "estadisticas": estadisticas_calculadas
    }


# =============================================================================
# NORMAL
# =============================================================================
class NormalInput(BaseModel):
    num_experimentos: int
    media: float
    desviacion_estandar: float


@simulador.post("/normal")
async def normal(data: NormalInput):
    if data.desviacion_estandar <= 0:
        raise HTTPException(status_code=400, detail="La desviación estándar debe ser mayor que 0.")
    
    # --- CÁLCULO ORIGINAL RESTAURADO (Box-Muller) ---
    valores = []
    for _ in range(data.num_experimentos):
        u1 = random.random()
        u2 = random.random()
        z0 = math.sqrt(-2.0 * math.log(u1)) * math.cos(2.0 * math.pi * u2)
        x = data.media + data.desviacion_estandar * z0
        valores.append(x)
    
    # --- ADICIÓN NECESARIA PARA ESTADÍSTICAS ---
    estadisticas_calculadas = {}
    if valores:
        estadisticas_calculadas = {
            "media": float(np.mean(valores)),
            "desviacion_estandar": float(np.std(valores)),
            "minimo": float(np.min(valores)),
            "maximo": float(np.max(valores))
        }
    else:
        estadisticas_calculadas = {"media": 0, "desviacion_estandar": 0, "minimo": 0, "maximo": 0}

    return {
        "valores": valores,
        "media": data.media,
        "desviacion_estandar": data.desviacion_estandar,
        "total_experimentos": data.num_experimentos,
        "estadisticas": estadisticas_calculadas
    }

# =============================================================================
# GIBBS SAMPLER
# =============================================================================


class GibbsRequest(BaseModel):
    expression: str
    x_min: float
    x_max: float
    y_min: float
    y_max: float
    x_initial: Optional[float] = None
    y_initial: Optional[float] = None
    n_samples: int = 1000
    burn_in: int = 500

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    normalized_expression: Optional[str] = None

class GibbsResult(BaseModel):
    success: bool
    validation: ValidationResult
    samples: Optional[Dict[str, List[float]]] = None
    statistics: Optional[Dict] = None
    execution_time: Optional[float] = None
    plot_data: Optional[Dict] = None

class GibbsSampler:
    def __init__(self):
        # NO crear nuevos símbolos, usar los globales
        pass
    
    def validate_expression(self, expr_str: str, x_bounds: Tuple[float, float], 
                          y_bounds: Tuple[float, float]) -> ValidationResult:
        """Valida si la expresión puede ser procesada analíticamente"""
        errors = []
        warnings = []
        normalized_expr = None
        
        try:
            # 1. Parsear la expresión usando los símbolos globales
            # Crear un diccionario local de transformaciones para el parsing
            local_dict = {'x': x, 'y': y}
            
            try:
                expr = parse_expr(expr_str, local_dict=local_dict, transformations='all')
            except:
                # Si falla el parsing avanzado, intentar parsing básico
                expr = sympify(expr_str, locals=local_dict)
            
            normalized_expr = str(expr)
            print(f"Expresión parseada: {expr}")
            print(f"Símbolos libres: {expr.free_symbols}")
            
            # 2. Verificar que solo contenga x, y y constantes
            free_symbols = expr.free_symbols
            allowed_symbols = {x, y}  # Usar símbolos globales
            invalid_symbols = free_symbols - allowed_symbols
            
            if invalid_symbols:
                errors.append(f"Símbolos no permitidos: {[str(s) for s in invalid_symbols]}")
            
            # 3. Verificar que la función sea no negativa en el dominio
            test_points = [
                (x_bounds[0], y_bounds[0]),
                (x_bounds[1], y_bounds[1]),
                ((x_bounds[0] + x_bounds[1])/2, (y_bounds[0] + y_bounds[1])/2),
                (x_bounds[0], y_bounds[1]),
                (x_bounds[1], y_bounds[0])
            ]
            
            for px, py in test_points:
                try:
                    val = float(expr.subs({x: px, y: py}))
                    if val < 0:
                        errors.append(f"Función negativa en ({px}, {py}): {val}")
                        break
                except Exception as e:
                    errors.append(f"Error evaluando función en ({px}, {py}): {str(e)}")
                    break
            
            # 4. Calcular marginales
            try:
                print("Calculando marginales...")
                f_x = integrate(expr, (y, y_bounds[0], y_bounds[1]))
                f_y = integrate(expr, (x, x_bounds[0], x_bounds[1]))
                
                print(f"Marginal f_X(x): {f_x}")
                print(f"Marginal f_Y(y): {f_y}")
                
                if f_x == 0 or f_y == 0:
                    errors.append("Una de las distribuciones marginales es cero")
                
                # Verificar que las marginales sean funciones de la variable correcta
                if len(f_x.free_symbols) > 1 or (len(f_x.free_symbols) == 1 and x not in f_x.free_symbols):
                    errors.append("Error en marginal f_X(x): contiene símbolos incorrectos")
                
                if len(f_y.free_symbols) > 1 or (len(f_y.free_symbols) == 1 and y not in f_y.free_symbols):
                    errors.append("Error en marginal f_Y(y): contiene símbolos incorrectos")
                
            except Exception as e:
                errors.append(f"Error calculando marginales: {str(e)}")
                return ValidationResult(is_valid=False, errors=errors, warnings=warnings)
            
            # 5. Verificar si se pueden calcular condicionales
            try:
                print("Calculando distribuciones condicionales...")
                fx_given_y = simplify(expr / f_y)
                fy_given_x = simplify(expr / f_x)
                
                print(f"f(x|y): {fx_given_y}")
                print(f"f(y|x): {fy_given_x}")
                
                # Intentar calcular CDFs
                print("Calculando CDFs...")
                cdf_x = integrate(fx_given_y, (x, x_bounds[0], x))
                cdf_y = integrate(fy_given_x, (y, y_bounds[0], y))
                
                print(f"F(x|y): {cdf_x}")
                print(f"F(y|x): {cdf_y}")
                
                # Verificar si se pueden invertir
                print("Verificando si se pueden invertir las CDFs...")
                eq_x = Eq(u, cdf_x)
                eq_y = Eq(u, cdf_y)
                
                sol_x = solve(eq_x, x)
                sol_y = solve(eq_y, y)
                
                print(f"Soluciones para x: {sol_x}")
                print(f"Soluciones para y: {sol_y}")
                
                if not sol_x:
                    errors.append("No se puede invertir F(x|y) - no hay solución analítica")
                if not sol_y:
                    errors.append("No se puede invertir F(y|x) - no hay solución analítica")
                    
                # Verificar que al menos una solución sea válida para cada caso
                valid_x = False
                valid_y = False
                
                for sol in sol_x:
                    if sol.is_real is not False:  # Puede ser True o None (indeterminado)
                        valid_x = True
                        break
                
                for sol in sol_y:
                    if sol.is_real is not False:
                        valid_y = True
                        break
                
                if not valid_x:
                    errors.append("No hay soluciones reales válidas para x")
                if not valid_y:
                    errors.append("No hay soluciones reales válidas para y")
                    
            except Exception as e:
                errors.append(f"Error en distribuciones condicionales: {str(e)}")
                print(f"Traceback: {traceback.format_exc()}")
            
        except Exception as e:
            errors.append(f"Error parseando expresión: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
        
        return ValidationResult(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            normalized_expression=normalized_expr
        )
    
    def sample(self, expr_str: str, x_bounds: Tuple[float, float], 
               y_bounds: Tuple[float, float], x_init: float, y_init: float,
               n_samples: int, burn_in: int) -> Tuple[np.ndarray, np.ndarray, Dict]:
        """Ejecuta el muestreador de Gibbs"""
        
        start_time = time.time()
        
        # Parsear expresión usando símbolos globales
        local_dict = {'x': x, 'y': y}
        try:
            expr = parse_expr(expr_str, local_dict=local_dict, transformations='all')
        except:
            expr = sympify(expr_str, locals=local_dict)
        
        print(f"Iniciando muestreo con expresión: {expr}")
        
        # Calcular marginales - usando símbolos globales
        f_y = integrate(expr, (x, x_bounds[0], x_bounds[1]))  # marginal de Y
        f_x = integrate(expr, (y, y_bounds[0], y_bounds[1]))  # marginal de X
        
        print(f"Marginal f_Y(y): {f_y}")
        print(f"Marginal f_X(x): {f_x}")
        
        # Distribuciones condicionales
        fx_given_y = simplify(expr / f_y)  # f(x|y)
        fy_given_x = simplify(expr / f_x)  # f(y|x)
        
        print(f"f(x|y): {fx_given_y}")
        print(f"f(y|x): {fy_given_x}")
        
        # CDFs condicionales
        cdf_x = integrate(fx_given_y, (x, x_bounds[0], x))
        cdf_y = integrate(fy_given_x, (y, y_bounds[0], y))
        
        print(f"F(x|y): {cdf_x}")
        print(f"F(y|x): {cdf_y}")
        
        # Funciones inversas
        eq_x = Eq(u, cdf_x)
        eq_y = Eq(u, cdf_y)
        
        sol_x = solve(eq_x, x)
        sol_y = solve(eq_y, y)
        
        print(f"Soluciones x: {sol_x}")
        print(f"Soluciones y: {sol_y}")
        
        # Tomar la solución válida
        inv_x = None
        inv_y = None
        
        for s in sol_x:
            try:
                # Probar si la solución es válida evaluándola
                test_val = float(s.subs({y: (y_bounds[0] + y_bounds[1])/2, u: 0.5}).evalf())
                if x_bounds[0] <= test_val <= x_bounds[1]:
                    inv_x = s
                    break
            except:
                continue
        
        for s in sol_y:
            try:
                # Probar si la solución es válida evaluándola
                test_val = float(s.subs({x: (x_bounds[0] + x_bounds[1])/2, u: 0.5}).evalf())
                if y_bounds[0] <= test_val <= y_bounds[1]:
                    inv_y = s
                    break
            except:
                continue
        
        if inv_x is None or inv_y is None:
            raise ValueError(f"No se encontraron funciones inversas válidas. inv_x: {inv_x}, inv_y: {inv_y}")
        
        print(f"Usando inv_x: {inv_x}")
        print(f"Usando inv_y: {inv_y}")
        
        # Muestreo
        total_samples = n_samples + burn_in
        samples_x = np.zeros(total_samples)
        samples_y = np.zeros(total_samples)
        
        # Inicializar
        current_x = x_init
        current_y = y_init
        samples_x[0] = current_x
        samples_y[0] = current_y
        
        print(f"Iniciando muestreo con {total_samples} iteraciones...")
        
        for i in range(1, total_samples):
            try:
                # Muestrear X dado Y
                u1 = np.random.uniform(0, 1)
                new_x_expr = inv_x.subs({y: current_y, u: u1})
                new_x = float(new_x_expr.evalf())
                
                # Muestrear Y dado X
                u2 = np.random.uniform(0, 1)  
                new_y_expr = inv_y.subs({x: new_x, u: u2})
                new_y = float(new_y_expr.evalf())
                
                # Validar bounds
                new_x = np.clip(new_x, x_bounds[0], x_bounds[1])
                new_y = np.clip(new_y, y_bounds[0], y_bounds[1])
                
                samples_x[i] = new_x
                samples_y[i] = new_y
                current_x, current_y = new_x, new_y
                
                # Progress check
                if i % 1000 == 0:
                    print(f"Completado {i}/{total_samples} iteraciones")
                
            except Exception as e:
                print(f"Error en iteración {i}: {str(e)}")
                # Usar valores anteriores en caso de error
                samples_x[i] = current_x
                samples_y[i] = current_y
        
        # Descartar burn-in
        final_x = samples_x[burn_in:]
        final_y = samples_y[burn_in:]
        
        end_time = time.time()
        
        # Estadísticas
        stats = {
            "mean_x": float(np.mean(final_x)),
            "mean_y": float(np.mean(final_y)),
            "std_x": float(np.std(final_x)),
            "std_y": float(np.std(final_y)),
            "correlation": float(np.corrcoef(final_x, final_y)[0, 1]),
            "execution_time": end_time - start_time,
            "total_samples": len(final_x)
        }
        
        print(f"Muestreo completado en {stats['execution_time']:.3f}s")
        
        return final_x, final_y, stats

def create_plot_data(x_samples: np.ndarray, y_samples: np.ndarray, 
                    x_bounds: Tuple[float, float], y_bounds: Tuple[float, float]) -> Dict:
    """Prepara los datos para las visualizaciones"""
    
    # Datos para scatter 2D
    scatter_data = {
        "x": x_samples.tolist(),
        "y": y_samples.tolist(),
        "type": "scatter",
        "mode": "markers",
        "marker": {
            "size": 3,
            "opacity": 0.6,
            "color": "blue"
        },
        "name": "Muestras"
    }
    
    # Crear histograma 3D
    n_bins = 20
    
    # Crear bins
    x_edges = np.linspace(x_bounds[0], x_bounds[1], n_bins + 1)
    y_edges = np.linspace(y_bounds[0], y_bounds[1], n_bins + 1)
    
    # Calcular histograma 2D
    hist, _, _ = np.histogram2d(x_samples, y_samples, bins=[x_edges, y_edges])
    
    # Preparar datos para superficie 3D
    x_centers = (x_edges[:-1] + x_edges[1:]) / 2
    y_centers = (y_edges[:-1] + y_edges[1:]) / 2
    
    X, Y = np.meshgrid(x_centers, y_centers)
    
    histogram_3d = {
        "x": X.tolist(),
        "y": Y.tolist(), 
        "z": hist.T.tolist(),
        "type": "surface",
        "colorscale": "Viridis",
        "name": "Densidad"
    }
    
    return {
        "scatter_2d": scatter_data,
        "histogram_3d": histogram_3d,
        "layout_2d": {
            "title": "Muestras de Gibbs - Vista 2D",
            "xaxis": {"title": "X"},
            "yaxis": {"title": "Y"}
        },
        "layout_3d": {
            "title": "Histograma de Frecuencia - Vista 3D",
            "scene": {
                "xaxis": {"title": "X"},
                "yaxis": {"title": "Y"},
                "zaxis": {"title": "Frecuencia"}
            }
        }
    }

@simulador.get("/")
def root():
    return {"message": "Gibbs Sampler API v2.0 - Método Analítico"}

@simulador.post("/validate", response_model=ValidationResult)
def validate_function(request: GibbsRequest):
    """Valida si una función puede ser procesada analíticamente"""
    sampler = GibbsSampler()
    return sampler.validate_expression(
        request.expression,
        (request.x_min, request.x_max),
        (request.y_min, request.y_max)
    )

@simulador.post("/sample", response_model=GibbsResult)
def gibbs_sample(request: GibbsRequest):
    """Ejecuta el muestreador de Gibbs y genera datos para visualización"""
    try:
        sampler = GibbsSampler()
        
        # Validar primero
        validation = sampler.validate_expression(
            request.expression,
            (request.x_min, request.x_max),
            (request.y_min, request.y_max)
        )
        
        if not validation.is_valid:
            return GibbsResult(
                success=False,
                validation=validation
            )
        
        # Valores iniciales por defecto
        x_init = request.x_initial if request.x_initial is not None else (request.x_min + request.x_max) / 2
        y_init = request.y_initial if request.y_initial is not None else (request.y_min + request.y_max) / 2
        
        # Ejecutar muestreo
        x_samples, y_samples, stats = sampler.sample(
            request.expression,
            (request.x_min, request.x_max),
            (request.y_min, request.y_max),
            x_init, y_init,
            request.n_samples,
            request.burn_in
        )
        
        # Preparar datos para visualización
        plot_data = create_plot_data(
            x_samples, y_samples,
            (request.x_min, request.x_max),
            (request.y_min, request.y_max)
        )
        
        return GibbsResult(
            success=True,
            validation=validation,
            samples={
                "x": x_samples.tolist(),
                "y": y_samples.tolist()
            },
            statistics=stats,
            execution_time=stats["execution_time"],
            plot_data=plot_data
        )
        
    except Exception as e:
        error_msg = str(e)
        traceback_info = traceback.format_exc()
        
        return GibbsResult(
            success=False,
            validation=ValidationResult(
                is_valid=False,
                errors=[f"Error durante el muestreo: {error_msg}"],
                warnings=[f"Traceback: {traceback_info}"]
            )
        )

@simulador.get("/examples")
def get_examples():
    """Retorna ejemplos de funciones que funcionan bien"""
    return {
        "examples": [
            {
                "name": "Distribución Lineal",
                "expression": "(2*x + 3*y + 2)/28",
                "bounds": {"x_min": 0, "x_max": 2, "y_min": 0, "y_max": 2},
                "description": "Función de densidad conjunta lineal"
            },
            {
                "name": "Distribución Cuadrática",
                "expression": "4*x*y",
                "bounds": {"x_min": 0.1, "x_max": 0.9, "y_min": 0.1, "y_max": 0.9},
                "description": "Función cuadrática simple"
            },
            {
                "name": "Distribución Mixta",
                "expression": "4*x*(1-y)",
                "bounds": {"x_min": 0.1, "x_max": 0.9, "y_min": 0.1, "y_max": 0.9},
                "description": "Combinación lineal-cuadrática"
            }
        ]
    }


# =============================================================================
# NORMAL BIVARIADA
# =============================================================================

class NormalBivariadaInput(BaseModel):
    num_experimentos: int
    mu_x: float
    mu_y: float
    sigma_x: float
    sigma_y: float
    rho: float


def generar_normal_bivariada(n, mu_x, mu_y, sigma_x, sigma_y, rho):
    """Genera muestras de distribución normal bivariada usando Box-Muller"""
    valores_x = []
    valores_y = []
    
    for _ in range(n):
        u1 = random.random()
        u2 = random.random()
        
        z1 = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        z2 = math.sqrt(-2 * math.log(u1)) * math.sin(2 * math.pi * u2)
        
        x = mu_x + sigma_x * z1
        y = mu_y + sigma_y * (rho * z1 + math.sqrt(1 - rho**2) * z2)
        
        valores_x.append(x)
        valores_y.append(y)
    
    return valores_x, valores_y


def calcular_densidad_bivariada_teorica(x_range, y_range, mu_x, mu_y, sigma_x, sigma_y, rho):
    """Calcula la función de densidad teórica"""
    X, Y = np.meshgrid(x_range, y_range)
    
    det_sigma = sigma_x**2 * sigma_y**2 * (1 - rho**2)
    coef = 1 / (2 * math.pi * math.sqrt(det_sigma))
    
    dx = X - mu_x
    dy = Y - mu_y
    
    exponente = -0.5 * (1 / (1 - rho**2)) * (
        (dx**2) / (sigma_x**2) +
        (dy**2) / (sigma_y**2) -
        2 * rho * dx * dy / (sigma_x * sigma_y)
    )
    
    Z = coef * np.exp(exponente)
    
    return X.tolist(), Y.tolist(), Z.tolist()


@simulador.post("/normal_bivariada")
async def normal_bivariada(data: NormalBivariadaInput):
    if data.sigma_x <= 0 or data.sigma_y <= 0:
        return {"error": "Las desviaciones estándar deben ser mayores que 0"}
    
    if not (-1 <= data.rho <= 1):
        return {"error": "El coeficiente de correlación debe estar entre -1 y 1"}
    
    if data.num_experimentos <= 0:
        return {"error": "El número de experimentos debe ser mayor que 0"}
    
    try:
        valores_x, valores_y = generar_normal_bivariada(
            data.num_experimentos,
            data.mu_x,
            data.mu_y,
            data.sigma_x,
            data.sigma_y,
            data.rho
        )
        
        media_x_obs = sum(valores_x) / len(valores_x)
        media_y_obs = sum(valores_y) / len(valores_y)
        
        var_x_obs = sum([(x - media_x_obs)**2 for x in valores_x]) / len(valores_x)
        var_y_obs = sum([(y - media_y_obs)**2 for y in valores_y]) / len(valores_y)
        
        sigma_x_obs = math.sqrt(var_x_obs)
        sigma_y_obs = math.sqrt(var_y_obs)
        
        cov_obs = sum([(valores_x[i] - media_x_obs) * (valores_y[i] - media_y_obs)
                      for i in range(len(valores_x))]) / len(valores_x)
        rho_obs = cov_obs / (sigma_x_obs * sigma_y_obs)
        
        min_x, max_x = min(valores_x), max(valores_x)
        min_y, max_y = min(valores_y), max(valores_y)
        
        range_x = max_x - min_x
        range_y = max_y - min_y
        
        x_range = np.linspace(min_x - 0.2 * range_x, max_x + 0.2 * range_x, 50)
        y_range = np.linspace(min_y - 0.2 * range_y, max_y + 0.2 * range_y, 50)
        
        X_teorica, Y_teorica, Z_teorica = calcular_densidad_bivariada_teorica(
            x_range, y_range, data.mu_x, data.mu_y, data.sigma_x, data.sigma_y, data.rho
        )
        
        return {
            "valores_x": valores_x,
            "valores_y": valores_y,
            "parametros": {
                "mu_x": data.mu_x,
                "mu_y": data.mu_y,
                "sigma_x": data.sigma_x,
                "sigma_y": data.sigma_y,
                "rho": data.rho,
                "num_experimentos": data.num_experimentos
            },
            "estadisticas_observadas": {
                "media_x": media_x_obs,
                "media_y": media_y_obs,
                "sigma_x": sigma_x_obs,
                "sigma_y": sigma_y_obs,
                "rho": rho_obs
            },
            "superficie_teorica": {
                "x": X_teorica,
                "y": Y_teorica,
                "z": Z_teorica
            }
        }
    except Exception as e:
        return {"error": f"Error en la simulación: {str(e)}"}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(simulador)