# ACTAGEN: Plan Maestro de Mejora Continua (V10+)
*Basado en las observaciones de Esteban y Ruth Navarro (Actualizado: 2026-02-03)*

## 1. Núcleo de Fidelidad Diplomática (Implementado V10.2)
- [x] **Réplica de Portada:** Escudo centrado, fuentes de 28pt (56 twips) para Sesión Plenaria y Acta.
- [x] **Asistencia Técnica:** Encabezado con etiquetas en mayúsculas (FECHA, HORA, LUGAR, ASISTENTES) y alineación por tabulación.
- [x] **Encabezado de Página:** Logo Concejo (izq), Identidad del Acta (centro, gris, 9pt), Numeración (der).
- [x] **Protección de Intervenciones:** Bloqueo de sangría automática tras etiqueta "Intervino...".
- [x] **Listas de Votación:** Separación automática de nombres y listado vertical en negrita.

## 2. Refinamiento Lingüístico y Jurídico (En Progreso)
- [x] **Diccionario de Extranjerismos:** Cursivas automáticas para latín y términos técnicos (lapsus calami, quorum, etc.).
- [x] **Banco de Nombres Oficiales:** Verificación cruzada (fuzzy match) para tildar y completar nombres de los 19 concejales y funcionarios clave.
- [x] **Expansión de Siglas:** Inyección automática del significado completo en la primera mención (FONSET, ESCNNA, USPEC, HSI).
- [ ] **Auditoría de Segundo Debate (Iteración 7):** Módulo de comparación letra por letra entre el acta y el "Informe de Ponencia" original.

## 3. Calidad Visual y Estructural (V11)
- [x] **Control de "Parrafotes":** Restauración de la lógica de espaciado en puntos aparte.
- [x] **Legibilidad de Imágenes:** Escalado optimizado (max 480 width) manteniendo la resolución de tablas y gráficos.
- [ ] **Hardened OCR Support:** Filtro para eliminar caracteres "huérfanos" o basura de transcripción al final de líneas.
- [ ] **Hyperlink Audit:** Inserción de hipervínculos a los radicados mencionados (si existe base de datos externa).

## 4. Automatización de Comunicación (Iteración 6)
- [ ] **Legal Liaison:** Generador automático de borradores de correo para la abogada/Ruth en caso de detectar "Banderas de Incoherencia" (ej. años 2024 vs 2025).
- [⚙️] **YouTube Sync:** Mapeo de fragmentos de texto con marcas de tiempo del video oficial para verificación rápida. (En desarrollo dentro de ACTAGEN WebApp).

## 5. Próximos Pasos (Mañana)
1. **Validación de V10.2:** Confirmación por parte de Esteban de que el Acta 348 es "El Molde Perfecto".
2. **Producción Masiva (Batch 1 & 2):** Procesamiento de las Actas 349, 350, 351, 352, 353, 354 y 355 bajo el estándar V10.2.
3. **Refinamiento de Enmiendas:** Ajuste del motor para el tratamiento especial de textos de enmienda según instrucciones del audio final.
