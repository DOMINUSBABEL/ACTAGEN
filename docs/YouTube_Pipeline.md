# ACTAGEN: Flujo de Elaboración de Actas Literales

## Recurso de Origen
- Canal de YouTube: [Concejo de Medellín Oficial](https://www.youtube.com/@ConcejodeMedellinOficial)
- Video de Referencia: https://www.youtube.com/live/8jf39zjjhUc

## Proceso de Elaboración (Kernel 19 Pasos)
1. **Extracción**: Obtener el audio/transmisión del video de YouTube.
2. **Transcripción**: Procesar vía Whisper o servicio similar para obtener el texto bruto.
3. **Refinamiento (Kernel 19)**:
   - Normalización de fuentes.
   - Fusión inteligente (Gemini).
   - Auditoría de intervenciones y cargos.
   - Verificación de quórum y votaciones.
   - Aplicación de Manual de Estilo V3_2026.
4. **Exportación**: Generar el documento final en formato institucional (PDF/DOCX) y TEI/XML para el archivo digital.

## Estado Actual
- Motor de procesamiento: `ACTAGEN/services/agenticPipeline.ts`
- Generador de documentos: `ACTAGEN/services/actaDocumentGenerator.ts`
- Siguiente paso: Automatizar el cross-check entre el video de YouTube y la transcripción generada.
