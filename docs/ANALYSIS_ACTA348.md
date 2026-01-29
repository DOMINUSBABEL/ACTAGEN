# ANÁLISIS: Qué necesita ACTAGEN para procesar el Acta 348

## Estado Actual vs Requerido

### ✅ Lo que YA existe:
- AgentReasoningTerminal (visualización)
- Estructura de 19 pasos
- Carga de archivos
- Procesamiento regex básico

### ❌ Lo que FALTA para procesar el Acta 348:

## 1. INTEGRACIÓN CON GEMINI EN EL PIPELINE

Actualmente `agenticPipeline.ts` hace procesamiento local (regex).
Para el Acta 348 real, necesitamos que Gemini:

- **Paso 2 (Fusión)**: Entienda contexto para fusionar fragmentos inteligentemente
- **Paso 6 (Intervenciones)**: Identifique y formatee cada intervención
- **Paso 7 (Citas)**: Normalice referencias legales
- **Paso 9 (Votaciones)**: Valide matemática y genere tablas
- **Paso 10 (Estilo)**: Aplique Manual V3_2026 completo
- **Paso 14 (Retórica)**: Limpie muletillas preservando sentido
- **Paso 18 (Ortografía)**: Revisión profunda con contexto

## 2. SOPORTE DE FORMATOS

- **DOCX**: Los fragmentos vienen en .docx (binario, no texto plano)
  → Necesito: mammoth.js o docx-parser
  
- **PDF**: Ya funciona con pdfjs ✅

- **Audio/Video**: Para cross-check (Paso 8)
  → Gemini puede procesar audio directamente

## 3. DATOS DE PRUEBA (ACTA 348)

Necesito crear fragmentos de prueba basados en el ejemplo del PDF:
- Parte 1: Encabezado + Llamado a lista
- Parte 2: Orden del día + Primeras intervenciones
- Parte 3: Debate central
- Parte 4: Votaciones + Cierre

## 4. LISTA OFICIAL DE CONCEJALES

Los 21 concejales para validación de quórum:
1. AGUDELO RAMÍREZ, Carlos Alberto
2. ARANGO URIBE, María Victoria
3. BEDOYA LÓPEZ, Juan Felipe
4. CARVALHO MEJÍA, Daniel
5. CORREA LÓPEZ, Luis Bernardo
6. CUARTAS OCHOA, Lucas
7. ECHAVARRÍA SÁNCHEZ, Andrés
8. FLÓREZ HERNÁNDEZ, Alex
9. GAVIRIA CORREA, Santiago
10. GUERRA HOYOS, Bernardo Alejandro
11. HENRÍQUEZ GALLO, Luis Carlos
12. JIMÉNEZ GÓMEZ, Sebastián
13. LONDOÑO SOTO, Daniela
14. MEJÍA ALVARADO, Claudia
15. MONCADA VALENCIA, Simón
16. PELÁEZ ARANGO, Alfredo
17. QUINTERO CALLE, Juan Carlos
18. RIVERA RIVERA, Nataly
19. TOBÓN ECHEVERRI, Fabio
20. URIBE VÉLEZ, José Luis
21. ZAPATA LOPERA, Gloria

## 5. GENERADOR DE DOCUMENTO FINAL

El output debe ser:
- Markdown estructurado (para preview)
- Exportable a DOCX (con formato institucional)
- Con tablas de votación correctamente formateadas
- Con placeholders de firma

## 6. PROMPTS ESPECIALIZADOS POR PASO

Cada paso necesita un prompt específico para Gemini:

### Paso 2 - Fusión:
```
Eres un experto en fusión de documentos. Recibe fragmentos de transcripción
con posibles solapamientos. Tu tarea:
1. Identificar overlaps (últimas 200 chars de fragmento N vs primeras 200 de N+1)
2. Fusionar eliminando duplicación
3. Mantener coherencia gramatical en los puntos de unión
```

### Paso 6 - Intervenciones:
```
Formatea cada intervención así:
"Intervino el [cargo en minúscula] de [Entidad en Mayúscula], [Nombre Apellido]:"

Reglas:
- Cargos SIEMPRE en minúscula: secretario, alcalde, concejal
- Entidades SIEMPRE en mayúscula: Secretaría de Hacienda, Concejo de Medellín
```

### Paso 9 - Votaciones:
```
Para cada votación:
1. Genera tabla Markdown con columnas: Concejal | Voto
2. Suma votos SÍ y NO (NO contar ausentes)
3. Formato resultado: "X (en letras) votos"
   Ejemplo: "21 (veintiún) votos positivos"
```

### Paso 10 - Manual de Estilo:
```
Aplica el Manual V3_2026:
1. Comillas: " " (inglesas) > « » (españolas anidadas)
2. Puntuación: FUERA de comillas ("texto".)
3. Cifras: $ 20.000.000 (puntos de mil)
4. Cargos: minúscula | Entidades: Mayúscula
```

## 7. ARQUITECTURA PROPUESTA

```
┌─────────────────────────────────────────────────────────────┐
│                      ACTAGEN v3.0                            │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PipelineTab  │  │ Validator    │  │ Dashboard    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           AgentReasoningTerminal                      │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                 │   │
│  │  │ Fase 1  │ │ Fase 2  │ │ Fase 3  │                 │   │
│  │  │ 5 pasos │ │ 9 pasos │ │ 5 pasos │                 │   │
│  │  └─────────┘ └─────────┘ └─────────┘                 │   │
│  └──────────────────────────────────────────────────────┘   │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AgenticPipeline (Kernel)                 │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ GeminiService (LLM Calls)                       │ │   │
│  │  │  - generateStepOutput(step, context, content)   │ │   │
│  │  │  - auditText(text, rules)                       │ │   │
│  │  │  - fuseFragments(parts)                         │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ DocumentProcessor                               │ │   │
│  │  │  - parseDocx(file)                              │ │   │
│  │  │  - parsePdf(file)                               │ │   │
│  │  │  - parseAudio(file)                             │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                       │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ OutputGenerator                                 │ │   │
│  │  │  - toMarkdown(doc)                              │ │   │
│  │  │  - toDocx(doc)                                  │ │   │
│  │  │  - generateReport(stats)                        │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 8. PLAN DE IMPLEMENTACIÓN

### Fase A: Datos de Prueba (30 min)
1. Crear fragmentos de transcripción basados en Acta 348
2. Guardar en /testdata/acta348/

### Fase B: Parsers (1 hora)
1. Agregar mammoth.js para DOCX
2. Mejorar extractor de PDF
3. Crear DocumentProcessor unificado

### Fase C: Gemini Integration (2 horas)
1. Crear prompts especializados por paso
2. Modificar cada step para llamar Gemini
3. Implementar retry y fallback

### Fase D: Output Generation (1 hora)
1. Ensamblar documento final
2. Generar tablas de votación
3. Crear bloque de firmas
4. Exportar a DOCX

### Fase E: Testing (30 min)
1. Probar con fragmentos de Acta 348
2. Validar output contra ejemplo del PDF
3. Ajustar prompts según resultados

## PRÓXIMO PASO INMEDIATO

Crear los fragmentos de prueba del Acta 348 para tener datos reales
con los cuales probar el pipeline completo.
