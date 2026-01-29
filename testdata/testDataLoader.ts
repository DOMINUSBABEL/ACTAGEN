/**
 * TEST DATA LOADER - ACTA 348
 * Datos de prueba basados en el formato real del Concejo de Medellín
 * Concejales: Período 2024-2027 (lista oficial)
 */

// Lista oficial de concejales del período 2024-2027
export const CONCEJALES_2024_2027 = [
  { nombre: 'Sebastián López Valencia', bancada: 'Centro Democrático', cargo: 'presidente' },
  { nombre: 'Santiago Perdomo Montoya', bancada: 'Creemos' },
  { nombre: 'Carlos Alberto Gutiérrez Bustamante', bancada: 'Conservador' },
  { nombre: 'Andrés Felipe Tobón Villada', bancada: 'Centro Democrático' },
  { nombre: 'María Paulina Suárez Roldán', bancada: 'Creemos' },
  { nombre: 'Alejandro De Bedout Arango', bancada: 'Creemos' },
  { nombre: 'Juan Carlos de la Cuesta Galvis', bancada: 'Creemos' },
  { nombre: 'Santiago Narváez Lombana', bancada: 'Creemos' },
  { nombre: 'Damián Pérez Arroyave', bancada: 'Creemos' },
  { nombre: 'Camila Gaviria Barreneche', bancada: 'Creemos' },
  { nombre: 'Janeth Hurtado Betancur', bancada: 'Creemos' },
  { nombre: 'Farley Jhaír Macías Betancur', bancada: 'Liberal' },
  { nombre: 'José Luis Marín Mora', bancada: 'Polo Democrático' },
  { nombre: 'Alejandro Arias García', bancada: 'Alianza Verde' },
  { nombre: 'Miguel Ángel Iguarán Osorio', bancada: 'Coalición Juntos' },
  { nombre: 'Juan Ramón Jiménez Lara', bancada: 'ASI' },
  { nombre: 'Brisvani Alexis Arenas Suaza', bancada: 'Conservador' },
  { nombre: 'Leticia Orrego Pérez', bancada: 'Centro Democrático' },
  { nombre: 'Andrés Felipe Rodríguez Puerta', bancada: 'Independiente' },
  { nombre: 'Claudia Victoria Carrasquilla Minami', bancada: 'Creemos' },
  { nombre: 'Luis Guillermo de Jesús Vélez Álvarez', bancada: 'Centro Democrático' },
];

// Fragmentos del Acta 348 para pruebas (citación sobre seguridad ciudadana)
export const ACTA_348_FRAGMENTS = [
  {
    name: 'fragmento_01_encabezado.txt',
    content: `# ACTA DE SESIÓN PLENARIA No. 348
## MODALIDAD: ORDINARIA

CONCEJO DE MEDELLÍN
PERÍODO 2024-2027

---

**FECHA:** Martes, 27 de enero de 2026
**HORA DE INICIO:** 09:00 a. m.
**HORA DE FINALIZACIÓN:** 01:45 p. m.
**LUGAR:** Recinto de Sesiones "Bernardo Guerra Serna", Centro Administrativo La Alpujarra, Medellín.

---

## 1. LLAMADO A LISTA Y VERIFICACIÓN DEL QUÓRUM

Siendo las nueve de la mañana (09:00 a. m.) del día martes veintisiete (27) de enero del año dos mil veintiséis (2026), el señor presidente del Concejo, honorable concejal Sebastián López Valencia, declara abierta la sesión e instruye al secretario general para que proceda con el llamado a lista.

El secretario general, doctor Juan Fernando Sánchez Vélez, realiza el llamado:

| HONORABLE CONCEJAL | ASISTENCIA |
|:---|:---:|
| LÓPEZ VALENCIA, Sebastián | ✓ |
| PERDOMO MONTOYA, Santiago | ✓ |
| GUTIÉRREZ BUSTAMANTE, Carlos Alberto | ✓ |
| TOBÓN VILLADA, Andrés Felipe | ✓ |
| SUÁREZ ROLDÁN, María Paulina | ✓ |
| DE BEDOUT ARANGO, Alejandro | ✓ |
| DE LA CUESTA GALVIS, Juan Carlos | ✓ |
| NARVÁEZ LOMBANA, Santiago | ✓ |
| PÉREZ ARROYAVE, Damián | ✓ |
| GAVIRIA BARRENECHE, Camila | ✓ |
| HURTADO BETANCUR, Janeth | Excusa |
| MACÍAS BETANCUR, Farley Jhaír | ✓ |
| MARÍN MORA, José Luis | ✓ |
| ARIAS GARCÍA, Alejandro | ✓ |
| IGUARÁN OSORIO, Miguel Ángel | ✓ |
| JIMÉNEZ LARA, Juan Ramón | ✓ |
| ARENAS SUAZA, Brisvani Alexis | ✓ |
| ORREGO PÉREZ, Leticia | ✓ |
| RODRÍGUEZ PUERTA, Andrés Felipe | ✓ |
| CARRASQUILLA MINAMI, Claudia Victoria | ✓ |
| VÉLEZ ÁLVAREZ, Luis Guillermo de Jesús | ✓ |

**SECRETARIO GENERAL:** "Señor presidente, informo que se encuentran presentes veinte (20) honorables concejales. La honorable concejal Janeth Hurtado Betancur presentó excusa justificada por cita médica. Existe quórum para deliberar y decidir".

**PRESIDENTE:** "Se declara abierta la sesión. Proceda con la lectura del orden del día".`
  },
  {
    name: 'fragmento_02_orden_dia.txt',
    content: `## 2. ORDEN DEL DÍA

El secretario general procede a dar lectura al orden del día propuesto por la Mesa Directiva:

1. Llamado a lista y verificación del quórum.
2. Lectura y aprobación del orden del día.
3. **DEBATE DE CONTROL POLÍTICO: "Evaluación de la Política de Seguridad Ciudadana y Convivencia en el Distrito Especial de Ciencia, Tecnología e Innovación de Medellín – Primer Semestre 2025".**
   - Citantes: Bancada Centro Democrático
   - Citados: Secretario de Seguridad y Convivencia, Comandante Policía Metropolitana, Director Seccional de Fiscalías
4. Lectura de comunicaciones.
5. Proposiciones y varios.
6. Cierre de la sesión.

**PRESIDENTE:** "Se somete a consideración de la plenaria el orden del día. ¿Hay intervenciones?"

*No se solicitan intervenciones.*

**PRESIDENTE:** "En consideración. ¿Lo aprueba la plenaria?"

**VOTACIÓN ORDINARIA**
*Por medios electrónicos*

**Resultado:** Aprobado por unanimidad con veinte (20) votos afirmativos.

---

## 3. DEBATE DE CONTROL POLÍTICO

### SEGURIDAD CIUDADANA Y CONVIVENCIA – PRIMER SEMESTRE 2025

**PRESIDENTE:** "Damos inicio al debate de control político. Tiene la palabra el honorable concejal Andrés Felipe Tobón Villada, citante principal".`
  },
  {
    name: 'fragmento_03_debate_central.txt',
    content: `### INTERVENCIÓN DEL CITANTE

**H.C. ANDRÉS FELIPE TOBÓN VILLADA (Centro Democrático):**

"Gracias, señor presidente. Honorables colegas, funcionarios de la Administración, ciudadanía que nos sigue por el Canal Telemedellín y las redes institucionales.

Hemos citado este debate porque Medellín enfrenta una crisis de seguridad que no podemos seguir ignorando. Las cifras oficiales del primer semestre de 2025 muestran un incremento del 18% en hurtos a personas respecto al mismo período del año anterior. En las comunas 10, 13 y 16 se concentra el 45% de estos delitos.

Pero no son solo números. Son ciudadanos que tienen miedo de salir a la calle con su celular, comerciantes que pagan extorsiones para poder trabajar, mujeres que no pueden caminar tranquilas por un parque después de las seis de la tarde.

Le pregunto al señor secretario de Seguridad:

1. ¿Cuál es la estrategia integral para reducir el hurto a personas?
2. ¿Qué pasó con los 200 nuevos cuadrantes prometidos en el Plan de Desarrollo?
3. ¿Por qué el sistema de cámaras de la ciudad tiene un 30% de dispositivos no operativos?

Esperamos respuestas concretas, no más cifras maquilladas".

**PRESIDENTE:** "Tiene la palabra el secretario de Seguridad y Convivencia".

---

### INTERVENCIÓN DE LA ADMINISTRACIÓN

**SECRETARIO DE SEGURIDAD Y CONVIVENCIA, doctor Manuel Alejandro Villa Mejía:**

"Señor presidente, honorables concejales, buenos días.

Agradezco la oportunidad de presentar ante esta corporación el informe de gestión en materia de seguridad ciudadana. Antes de responder las preguntas puntuales del honorable concejal citante, permítanme contextualizar:

Medellín pasó de una tasa de homicidios de 25 por cada 100.000 habitantes en 2019 a 17.8 en 2025. Eso representa una reducción del 28.8% en seis años. Sin embargo, reconocemos que el hurto a personas sigue siendo un desafío estructural.

Respecto a las preguntas formuladas:

**Primera pregunta - Estrategia integral:**
Implementamos el modelo de "Cuadrantes Inteligentes" que combina presencia policial con análisis de datos en tiempo real. En las zonas priorizadas (comunas 10, 13 y 16), hemos logrado una reducción del 12% en el segundo trimestre respecto al primero.

**Segunda pregunta - Nuevos cuadrantes:**
De los 200 cuadrantes prometidos, 156 ya están operando. Los 44 restantes están en proceso de dotación de motocicletas, con entrega programada para marzo de 2026.

**Tercera pregunta - Sistema de cámaras:**
Efectivamente teníamos un 32% de cámaras fuera de servicio. A la fecha, hemos recuperado el 18% y estamos en proceso de licitación para la modernización del sistema completo con un presupuesto de $45.000 millones".

**PRESIDENTE:** "Honorables concejales que deseen intervenir, favor inscribirse".`
  },
  {
    name: 'fragmento_04_intervenciones.txt',
    content: `### INTERVENCIONES DE LOS HONORABLES CONCEJALES

**H.C. MARÍA PAULINA SUÁREZ ROLDÁN (Creemos):**

"Señor presidente, mi intervención se centrará en el enfoque de género de la política de seguridad. Las cifras de violencia contra las mujeres son alarmantes: 4.500 casos de violencia intrafamiliar en el primer semestre, un 15% más que el año anterior.

Le pregunto al secretario: ¿Cuántos de los nuevos cuadrantes tienen formación específica en atención a violencias basadas en género? ¿Cuál es el tiempo promedio de respuesta a una llamada de la Línea 123 por violencia intrafamiliar?

No podemos seguir hablando de seguridad ciudadana sin hablar de la seguridad de las mujeres, que somos el 52% de la población".

---

**H.C. JOSÉ LUIS MARÍN MORA (Polo Democrático):**

"Presidente, la seguridad no se garantiza solo con más policías. Necesitamos inversión social en los territorios más vulnerables. El 70% de los jóvenes que ingresan al sistema de responsabilidad penal vienen de hogares en pobreza extrema.

Solicito que se destine al menos el 20% del presupuesto de seguridad a programas de prevención y oportunidades para la juventud. La cárcel no resuelve la desigualdad".

---

**H.C. LETICIA ORREGO PÉREZ (Centro Democrático):**

"Apoyo la intervención del concejal Tobón. Es inaceptable que en una ciudad que se autodenomina Distrito de Ciencia, Tecnología e Innovación, un tercio de las cámaras de seguridad no funcionen.

Propongo que se cree una comisión accidental de seguimiento a la inversión en tecnología de seguridad, con informes mensuales a esta corporación".

---

**SECRETARIO DE SEGURIDAD (respuesta):**

"Respecto al enfoque de género: el 100% de los nuevos cuadrantes reciben formación obligatoria en atención a víctimas de violencia basada en género. El tiempo promedio de respuesta a la Línea 123 por VIF es de 8 minutos con 32 segundos.

Coincidimos con el honorable concejal Marín en la importancia de la prevención. Por eso, el 35% del presupuesto de la Secretaría se destina a programas como "Jóvenes con Futuro" y "Medellín Me Cuida".`
  },
  {
    name: 'fragmento_05_cierre.txt',
    content: `### PROPOSICIONES DERIVADAS DEL DEBATE

**PRESIDENTE:** "Se somete a votación la proposición presentada por la honorable concejal Leticia Orrego Pérez para crear una Comisión Accidental de Seguimiento a la Inversión en Tecnología de Seguridad".

**VOTACIÓN NOMINAL**
*Por solicitud de la bancada Creemos*

| HONORABLE CONCEJAL | VOTO |
|:---|:---:|
| LÓPEZ VALENCIA, Sebastián | SÍ |
| PERDOMO MONTOYA, Santiago | SÍ |
| GUTIÉRREZ BUSTAMANTE, Carlos Alberto | SÍ |
| TOBÓN VILLADA, Andrés Felipe | SÍ |
| SUÁREZ ROLDÁN, María Paulina | SÍ |
| DE BEDOUT ARANGO, Alejandro | SÍ |
| DE LA CUESTA GALVIS, Juan Carlos | SÍ |
| NARVÁEZ LOMBANA, Santiago | SÍ |
| PÉREZ ARROYAVE, Damián | SÍ |
| GAVIRIA BARRENECHE, Camila | SÍ |
| MACÍAS BETANCUR, Farley Jhaír | SÍ |
| MARÍN MORA, José Luis | ABSTENCIÓN |
| ARIAS GARCÍA, Alejandro | SÍ |
| IGUARÁN OSORIO, Miguel Ángel | SÍ |
| JIMÉNEZ LARA, Juan Ramón | SÍ |
| ARENAS SUAZA, Brisvani Alexis | SÍ |
| ORREGO PÉREZ, Leticia | SÍ |
| RODRÍGUEZ PUERTA, Andrés Felipe | SÍ |
| CARRASQUILLA MINAMI, Claudia Victoria | SÍ |
| VÉLEZ ÁLVAREZ, Luis Guillermo de Jesús | SÍ |

**SECRETARIO GENERAL:** "Señor presidente, la proposición ha sido aprobada con diecinueve (19) votos afirmativos y una (1) abstención".

---

## 4. COMUNICACIONES

Se da lectura a las siguientes comunicaciones:

4.1. Oficio No. 2026-001-0234 del Departamento Administrativo de Planeación, dando respuesta a la proposición 892 de 2025.

4.2. Invitación de la Universidad de Antioquia al Foro "Ciudades Seguras" el 15 de febrero de 2026.

---

## 5. PROPOSICIONES Y VARIOS

- El H.C. **Santiago Perdomo Montoya** solicita citar al gerente de EPM para debatir el impacto tarifario del fenómeno de El Niño.

- La H.C. **Camila Gaviria Barreneche** solicita reconocimiento con Distinción de Plata a la Fundación "Mujeres que Inspiran" por su labor en las comunas.

---

## 6. CIERRE DE LA SESIÓN

Agotado el orden del día, el presidente del Concejo agradece a los funcionarios de la Administración Municipal, a los honorables concejales y a la ciudadanía presente y conectada virtualmente.

Se convoca para la próxima sesión ordinaria el día miércoles, veintiocho (28) de enero de 2026, a las nueve de la mañana (09:00 a. m.), en el mismo recinto.

Siendo la una y cuarenta y cinco de la tarde (01:45 p. m.), se levanta la sesión.

---

Para constancia se firma por quienes en ella intervinieron:

**SEBASTIÁN LÓPEZ VALENCIA**
Presidente del Concejo

**JUAN FERNANDO SÁNCHEZ VÉLEZ**
Secretario General`
  }
];

// Función para obtener todos los fragmentos como array de strings
export function getActa348Fragments(): string[] {
  return ACTA_348_FRAGMENTS.map(f => f.content);
}

// Función para crear un PipelineInput listo para usar
export function createActa348TestInput() {
  return {
    sessionId: '348',
    sessionName: 'Sesión Plenaria Ordinaria No. 348 - Control Político Seguridad',
    transcriptParts: getActa348Fragments(),
    youtubeUrl: 'https://www.youtube.com/watch?v=example348',
    metadata: {
      tipo: 'Ordinaria' as const,
      fecha: '2026-01-27',
      citantes: ['Bancada Centro Democrático'],
      tema: 'Evaluación de la Política de Seguridad Ciudadana y Convivencia'
    }
  };
}

// Función para obtener la lista de concejales como string[] (para validación de quórum)
export function getConcejalesNombres(): string[] {
  return CONCEJALES_2024_2027.map(c => c.nombre);
}
