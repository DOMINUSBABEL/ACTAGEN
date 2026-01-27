# MANUAL DE ESTILO Y REDACCIÓN - CONCEJO DE MEDELLÍN
> **Agent Config ID:** STYLE_V3_2026
> **Strictness Level:** 10/10 (MAXIMUM)
> **Target Language:** Español Jurídico/Legislativo (Colombia)

## 1. PUNTUACIÓN Y COMILLAS
- **Jerarquía:** 
  1. Inglesas (“...”) para citas directas y títulos de conferencias.
  2. Españolas («...») para citas dentro de citas.
- **Prohibición Absoluta:** NO usar comillas simples ('') ni comillas rectas (""). El agente debe reemplazarlas automáticamente.
- **Puntuación Lógica:** El punto, la coma y el punto y coma van **después** de las comillas de cierre.
  - *Incorrecto:* "Terminó la sesión."
  - *Correcto:* “Terminó la sesión”.

## 2. CIFRAS, MONEDA Y PORCENTAJES
- **Moneda:** `$ [espacio] [Cifra]`. Ej: `$ 10.500`. (Uso de punto para miles).
- **Decimales:** Coma (,). Ej: `3,5 %`.
- **Porcentajes:** Separado de la cifra. Ej: `50 %` (con espacio duro).
- **Números en texto:**
  - Del cero al nueve: En letras (uno, dos, nueve).
  - Del 10 en adelante: En cifras (10, 11, 250).
  - Excepción: Al iniciar oración, siempre en letras. "Veinte concejales asistieron...".

## 3. CARGOS, ENTIDADES Y TRATAMIENTOS
- **Cargos (Minúsculas):** alcalde, concejal, secretario, personero, contralor, presidente, gobernador.
- **Instituciones (Mayúsculas):** Concejo de Medellín, Alcaldía de Medellín, Personería, Contraloría General.
- **Tratamientos:**
  - *Mesa Directiva:* "Señor Presidente", "Señora Presidenta".
  - *Concejales:* "Honorable Concejal" (primera vez), luego "el concejal [Apellido]".
  - *Ciudadanos:* "El señor [Apellido]", "La señora [Apellido]".

## 4. TIEMPOS VERBALES Y VOZ
- **Relatoría:** Usar pretérito perfecto simple para acciones concluidas.
  - *Ej:* "El secretario **llamó** a lista", "El presidente **puso** en consideración".
- **Intervenciones:** Respetar el tiempo verbal del orador, pero eliminar redundancias temporales.
- **Impersonalidad:** El relator NUNCA habla en primera persona.
  - *Incorrecto:* "No escuché esta parte".
  - *Correcto:* "[Se presenta fallo de audio en origen]".

## 5. FORMATOS DE TIEMPO Y FECHA
- **Horas:** Sistema de 12 horas con puntos y espacios.
  - *Correcto:* `09:00 a. m.`, `04:30 p. m.`, `12:00 m.` (mediodía).
  - *Incorrecto:* 9am, 9:00am, 16:30.
- **Fechas:** Formato largo.
  - *Correcto:* `24 de octubre de 2026`.
  - *Incorrecto:* Oct 24/26, 24-10-2026.

## 6. CITAS JURÍDICAS
- **Leyes:** `Ley [Número] de [Año]`. Ej: `Ley 136 de 1994`.
- **Acuerdos:** `Acuerdo [Número] de [Año]`.
- **Sentencias:** `Sentencia [Referencia] de la Corte Constitucional`.

## 7. ESTRUCTURA DE VOTACIONES (TABLAS)
El agente debe generar tablas Markdown para votaciones nominales:

| Concejal | Voto |
| :--- | :---: |
| Apellido, Nombre | SÍ |
| Apellido, Nombre | NO |
| **TOTAL** | **X Votos** |

## 8. LISTA NEGRA DE EXPRESIONES (AUTO-CORRECCIÓN)
Si el audio contiene estas expresiones coloquiales, el agente debe transcribirlas literalmente solo si son vitales para el sentido, de lo contrario, limpiar la redacción:

| Expresión Coloquial | Acción del Agente |
| :--- | :--- |
| "Eh, este, mmm" | ELIMINAR (Limpieza de muletillas) |
| "Plata" (refiriéndose a dinero público) | CAMBIAR POR "Recursos" o "Dineros" (Si es narrativo) |
| "El man", "La vieja" | CAMBIAR POR "El sujeto", "La ciudadana" (O mantener literal + (sic)) |
| "¿Sí o qué?" | ELIMINAR o mantener literal con (sic) |

---
*Este manual es mandatorio. Cualquier desviación reduce la puntuación de calidad del Agente.*