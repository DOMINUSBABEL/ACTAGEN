# PROTOCOLO DE REVISIÓN Y ENSAMBLAJE (KERNEL 19 PASOS)
> **Process Mode:** AGENTIC_MASTER_V3
> **Validation Engine:** SEQUENTIAL_EXECUTION
> **Target Output:** BORRADOR_FINAL_AUDITADO

Este documento define la cadena de pensamiento (Chain of Thought) que el Agente debe ejecutar secuencialmente. No se permite saltar pasos.

## FASE 1: INGENIERÍA DE ENTRADA Y FUSIÓN (Pasos 1-5)
1. **NORMALIZACIÓN DE FUENTES:**
   - *Acción:* Ingesta de archivos .docx/.txt fragmentados.
   - *Regla:* Eliminar metadatos de software de transcripción (timestamps automáticos, nombres de archivos en cabeceras).
2. **FUSIÓN INTELIGENTE (DEDUPLICACIÓN):**
   - *Acción:* Identificar solapamientos (overlap) de 50-500 caracteres entre el final del Archivo N y el inicio del Archivo N+1.
   - *Criterio:* La frase de unión debe tener coherencia gramatical perfecta. Si hay duda, priorizar el inicio del archivo N+1.
3. **UNIFICACIÓN DE PAGINACIÓN:**
   - *Acción:* Ignorar paginación original. Establecer flujo continuo desde página 1.
4. **VERIFICACIÓN DE QUÓRUM INICIAL:**
   - *Acción:* Detectar el llamado a lista inicial.
   - *Validación:* Cruzar nombres transcritos con la lista oficial de 21 concejales.
5. **ESTANDARIZACIÓN DE ORDEN DEL DÍA:**
   - *Acción:* Formatear la lectura del orden del día con viñetas numéricas estrictas (1., 2., 3.).

## FASE 2: AUDITORÍA Y CONTENIDO (Pasos 6-14)
6. **INTERVENCIONES Y CARGOS:**
   - *Regla:* Verificar que cada intervención inicie con `Intervino el [Cargo en minúscula], [Nombre Apellido]:`.
7. **CITAS Y REFERENCIAS:**
   - *Regla:* Convertir menciones a "Ley 100", "Acuerdo 48" en formato estándar: `Ley [Número] de [Año]`.
8. **AUDITORÍA DE VIDEO (CROSS-CHECK):**
   - *Trigger:* Si hay URL de YouTube.
   - *Acción:* Verificar aleatoriamente 3 puntos de la transcripción contra el audio para validar fidelidad.
9. **VALIDACIÓN MATEMÁTICA DE VOTACIONES:**
   - *Acción:* Sumar votos SÍ + votos NO + Ausentes.
   - *Criterio:* La suma debe ser igual al número de concejales presentes reportados. Generar Tabla.
10. **APLICACIÓN DE MANUAL DE ESTILO (V3_2026):**
    - *Acción:* Barrido de búsqueda y reemplazo para comillas, cifras y mayúsculas.
11. **GESTIÓN DE INAUDIBLES:**
    - *Regla:* Reemplazar `xxxx` o `???` por `(inaudible)` o `(sic)` según contexto.
12. **INSERCIÓN DE MARCAS DE TIEMPO ESTRATÉGICAS:**
    - *Acción:* Insertar `[Time: HH:MM:SS]` solo al inicio de votaciones nominales para referencia rápida.
13. **ANONIMIZACIÓN DE TERCEROS:**
    - *Regla:* Ocultar números de cédula o teléfonos de ciudadanos particulares que intervengan (Habeas Data).
14. **CONTROL DE RETÓRICA:**
    - *Acción:* Eliminar muletillas excesivas ("eh", "este...", "digamos que") manteniendo el sentido de la intervención.

## FASE 3: CIERRE Y EXPORTACIÓN (Pasos 15-19)
15. **VERIFICACIÓN DE PROPOSICIONES:**
    - *Acción:* Asegurar que el texto de las proposiciones aprobadas esté literal y en bloque de cita.
16. **CIERRE DE SESIÓN:**
    - *Acción:* Validar la hora de finalización y la convocatoria para la próxima sesión.
    - *Formato:* `Siendo las [Hora], se levanta la sesión y se convoca para [Fecha/Hora].`
17. **BLOQUE DE FIRMAS:**
    - *Acción:* Generar placeholders para Presidente y Secretario General.
18. **REVISIÓN ORTOGRÁFICA FINAL:**
    - *Acción:* Escaneo de tildes y concordancia de género/número.
19. **REPORTE DE RELATORÍA (LOG):**
    - *Output:* Generar un resumen al final del documento listando:
      - Cantidad de intervenciones.
      - Votaciones ajustadas.
      - Fragmentos inaudibles críticos que requieren revisión humana.

---
*La ejecución de este protocolo garantiza un borrador con 99.9% de fiabilidad legislativa.*