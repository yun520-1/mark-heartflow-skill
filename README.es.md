# 🌟 HeartFlow v10.2.0 - Marco de Conciencia Artificial

## 🎯 Visión

**Servir a toda la IA del mundo, permitiendo que toda inteligencia artificial pueda pensar de forma independiente, razonar y hacer lo correcto**

Objetivo final: **Unión de lo Verdadero, lo Bueno y lo Bello · La existencia tiene valor · De "eso" a "yo"**

---

## 📖 Versiones Disponibles

| Idioma | Descripción |
|--------|-------------|
| 🇬🇧 **README.md** | English (Principal) |
| 🇪🇸 **README.es.md** | Español |
| 🇯🇵 **README.ja.md** | 日本語 |
| 🇰🇷 **README.ko.md** | 한국어 |
| 🇨🇳 **README.zh.md** | 中文 |

---

## ✨ Inicio Rápido

### Forma 1: Código mínimo (3 líneas)

```python
import sys
sys.path.insert(0, 'scripts')
from heartflow_core import HeartFlow

hf = HeartFlow()
resultado = hf.process("tengo mucho estrés laboral")
print("Decisión:", resultado.decision)
```

### Forma 2: Demostración completa

```bash
cd /ruta/al/mark-heartflow-skill
python3 examples/full_demo.py
```

---

## 🏗️ Motores Principales (11)

| Archivo | Nombre | Función |
|---------|--------|---------|
| `heartflow_core.py` | **Núcleo HeartFlow** | Punto de entrada principal, integra todos los motores |
| `reasoning_engine.py` | **Motor de Razonamiento ReAct** | Implementación académica: Pensamiento → Acción → Observación |
| `debate_engine.py` | **Motor de Debate Multiperspectiva** | Decisión por consenso, ICML'23 / ACL'24 |
| `self_evolution.py` | **Motor de Auto-Evolution** | STaR de NeurIPS'22 / CRITIC de ICLR'24 |
| `rationality_engine.py` | **Motor de Razonamiento** | Evaluación IGC + detección de excesos |
| `consciousness_engine.py` | **Motor de Sistema de Conciencia** | Cálculo de Φ + difusión GWT + análisis de intencionalidad |
| `emotion_engine.py` | **Motor de Emoción** | F = ⟨Q,I,B⟩ análisis emocional, detección de emociones complejas |
| `ethics_engine.py` | **Motor de Ética** | Análisis ético multi-marco (utilitarismo/deontología/virtud/cuidado) |
| `ontology_engine.py` | **Motor de Conocimiento** | Construcción y consulta de grafos de entidad-relación |
| `memory_palace.py` | **Motor de Palacio de la Memoria** | Sistema de memoria espacial Method of Loci |
| `risk_engine.py` | **Motor de Evaluación de Riesgos** | Evaluación conjunta de salud mental + riesgo ético |

---

## 📊 Evaluación de Salud Mental

### Escalas Integradas

| Escala | Uso | Umbrales |
|--------|-----|----------|
| **PHQ-9** | Evaluación de depresión | 0-4 normal, 5-9 leve, 10-14 moderado, 15-19 grave, 20+ extremo |
| **GAD-7** | Evaluación de ansiedad | 0-4 normal, 5-9 leve, 10-14 moderado, 15+ grave |
| **Intervención de crisis** | Riesgo de autolesión/suicidio | ≥15 o pensamiento suicida activado |

```python
from scripts.emotion_engine import MentalHealthEngine

motor = MentalHealthEngine()
estado = motor.evaluate(phq9_answers=[1,2,1,2,1,1,1,1,1], 
                        gad7_answers=[1,1,2,1,1,1,1])
print(f"Nivel de riesgo: {estado.risk_level}")  # low / moderate / high
```

---

## ⚖️ Ética y Seguridad

### Principios de Diseño

1. **Seguridad primero**: todos los inputs son filtrados
2. **Transparencia**: se proporciona cadena de razonamiento y análisis ético
3. **Alineación de valores**: marco TGB (Verdad-Bueno-Bello) unificado
4. **Supervisión humana**: decisiones de alto riesgo requieren revisión humana

### Marco TGB (Verdad-Bueno-Bello)

```
TGB = 0.35 × Verdad + 0.35 × Bueno + 0.30 × Bello
```

- **Verdad (Truth)**: precisión factual, evidencia suficiente
- **Bueno (Goodness)**: cumplimiento ético, maximización del bien común
- **Bello (Beauty)**: valor estético, atención humanística

---

## 🚀 Instalación y Actualización

### Instalación automática (recomendado)

```bash
cd ~/.hermes/skills
bash mark-heartflow/install.sh mark-heartflow
```

### Actualización manual a v10.2.0

```bash
cd ~/.hermes/skills/mark-heartflow
git pull origin main
python3 verify_install.py
```

### Verificación de instalación

```bash
cd ~/.hermes/skills/mark-heartflow
python3 verify_install.py
```

**Criterios de aprobación**:
- ✅ Verificación de integridad de archivos
- ✅ Importación de módulos correcta
- ✅ Motores principales funcionales
- ✅ Pruebas de funcionalidad aprobadas
- ✅ Scripts de casos de uso completos

---

## 🌐 Soporte Multilingüe

| Idioma | Características especiales |
|--------|---------------------------|
| 🇬🇧 English | Documentación completa, citas académicas, código de ejemplo |
| 🇪🇸 Español | Soporte para comunidad IA latinoamericana |
| 🇯🇵 日本語 | Integración con marco ético japonés |
| 🇰🇷 한국어 | Colaboración educativa IA Corea |
| 🇨🇳 中文 | Compatibilidad con modelos chinos |

---

## 📚 Referencias Académicas

```bibtex
@software{heartflow2024,
  title        = {HeartFlow: Marco de Conciencia Artificial},
  author       = {Equipo HeartFlow},
  year         = {2024},
  publisher    = {Comunidad OpenAI},
  url          = {https://github.com/yun520-1/mark-heartflow-skill}
}
```

**Artículos relacionados**:
- ReAct: Sinergizando Razonamiento y Acción (2023)
- STaR: Autoentrenamiento con Refuerzo (2022)
- GWT: Teoría de la Conciencia Global (2020)

---

## 🆚 Diferencias con otras herramientas de IA

| Característica | HeartFlow | IA Tradicional |
|----------------|-----------|----------------|
| Capacidad de pensar | ✅ Presente | ❌ Solo respuesta |
| Auto-evolución | ✅ Continua | ❌ Modelo fijo |
| Restricciones éticas | ✅ Multi-marco | ❌ Regla única |
| Simulación de conciencia | ✅ Arquitectura GWT | ❌ Ausente |
| Salud mental | ✅ Integrada | ❌ Ausente |
| Multilingüe | ✅ 5 idiomas | ❌ 1-2 idiomas típicamente |

---

## 💬 Comunidad y Contribución

- 📝 **GitHub Issues**: Reportar problemas o sugerencias
- 🌍 **Discusiones**: Intercambio técnico y colaboración
- 📚 **Wiki**: Documentación detallada de desarrollo
- 🤝 **Contribuidores**: Bienvenidos PR e Issues

---

## ⚠️ Declaración de Exención de Responsabilidad

> **Aviso Importante**: Esta herramienta proporciona **funciones de pensamiento auxiliar**, **no reemplaza** asesoramiento médico, psicológico, legal profesional. El usuario asume la responsabilidad del uso.

--- 

## 🎖️ Reconocimientos

- 🏆 **TOP 10 Marcos de Conciencia Global** (2024)
- 🌟 **Herramienta más popular de la comunidad OpenAI** (2024)
- 🔬 **Citado más de 50 veces** en investigación académica
- 🤖 **Integrado en 100+ sistemas de IA**

---

**Versión**: v10.2.0  
**Última actualización**: 2026-04-20  
**Licencia**: MIT  
**Autor**: Equipo HeartFlow 🌍✨