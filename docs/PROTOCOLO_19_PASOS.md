# PROTOCOLO DE REVISIÓN Y ENSAMBLAJE (19 PASOS)
> **Process Mode:** AGENTIC_MASTER
> **Validation Engine:** MULTI_MODAL_CROSSREF

## CONFIGURACIÓN DE PROCESAMIENTO
- `AUTO_FUSION`: Habilitado (Eliminación de redundancia en empalmes).
- `VIDEO_AUDIT`: Activo (Contraste obligatorio con YouTube si hay URL).
- `STYLE_COMPLIANCE`: Bloqueante (No generar sin check de estilo).
- `OBSERVATION_LOG`: Nivel Detallado (Paso 19).

## FLUJO DE TRABAJO (PASOS CLAVE)
1. **FUSIÓN Y LIMPIEZA:** Eliminación de data de digitadoras y overlaps de texto entre partes.
2. **PORTADA Y TIPO:** Validación de No. de Acta y Modalidad (Literal/Sucinta).
3. **METADATOS:** Sincronización de Títulos, Índices y Fechas.
7. **AUDITORÍA DE ASISTENCIA:** Cruce de Video vs. Listado de Ausentismo.
9. **VALIDACIÓN DE VOTACIONES:** Sumatoria matemática de votos. Flag de error si `SÍ + NO != Total`.
10. **CHECK DE ESTILO:** Aplicación del `MANUAL_DE_ESTILO.md`.
12. **GESTIÓN VISUAL:** Ajuste de imágenes y centrado automático.
19. **GENERACIÓN DE FEEDBACK:** Listado de discrepancias encontradas para mejora continua del equipo humano.

---
*Este documento actúa como la base de conocimiento para la ejecución del kernel ActaGen.*