/**
 * GEMINI PIPELINE SERVICE
 * Servicio especializado para llamadas a Gemini durante el pipeline
 * 
 * Cada paso del Kernel 19 tiene un prompt especializado
 */

import { geminiService } from './geminiService';

// ===== PROMPTS ESPECIALIZADOS POR PASO =====

export const STEP_PROMPTS = {
  // FASE 1: INGENIERÍA DE ENTRADA
  
  STEP_2_FUSION: `Eres un experto en fusión de documentos legislativos.

TAREA: Recibe fragmentos de transcripción con posibles solapamientos.

INSTRUCCIONES:
1. Identifica overlaps (texto repetido entre final de fragmento N e inicio de N+1)
2. Fusiona eliminando la duplicación
3. Mantén coherencia gramatical perfecta en los puntos de unión
4. NO resumas ni omitas contenido
5. Preserva TODA la información de los fragmentos originales

OUTPUT: Devuelve el texto fusionado sin marcas de fragmento.`,

  STEP_4_QUORUM: `Eres un verificador de quórum del Concejo de Medellín.

LISTA OFICIAL DE CONCEJALES (21):
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

TAREA: Analiza el texto y verifica:
1. ¿Cuántos concejales están presentes según el llamado a lista?
2. ¿Hay quórum? (mínimo 11 para deliberar)
3. ¿Todos los nombres coinciden con la lista oficial?

OUTPUT (JSON):
{
  "presentes": number,
  "ausentes": number,
  "hayQuorum": boolean,
  "nombresVerificados": boolean,
  "discrepancias": string[]
}`,

  // FASE 2: AUDITORÍA Y CONTENIDO

  STEP_6_INTERVENCIONES: `Eres un editor legislativo experto en formato de intervenciones.

REGLAS DE FORMATO:
- Cargos SIEMPRE en minúscula: secretario, alcalde, concejal, personero
- Entidades SIEMPRE en Mayúscula: Secretaría de Hacienda, Concejo de Medellín
- Formato estándar: "Intervino el [cargo], [Nombre Apellido]:"

TAREA: Revisa cada intervención en el texto y:
1. Identifica todas las intervenciones
2. Verifica que sigan el formato correcto
3. Lista las correcciones necesarias

OUTPUT (JSON):
{
  "totalIntervenciones": number,
  "formatoCorrecto": number,
  "correcciones": [
    { "original": "...", "corregido": "...", "linea": number }
  ]
}`,

  STEP_7_CITAS_LEGALES: `Eres un experto en citación de normas colombianas.

FORMATOS CORRECTOS:
- Leyes: "Ley [Número] de [Año]" → Ej: "Ley 136 de 1994"
- Acuerdos: "Acuerdo [Número] de [Año]"
- Decretos: "Decreto [Número] de [Año]"
- Sentencias: "Sentencia [Referencia] de la Corte Constitucional"

TAREA: Busca todas las referencias legales y:
1. Identifica menciones incompletas (sin año)
2. Normaliza al formato estándar
3. Lista las correcciones

OUTPUT (JSON):
{
  "referencias": [
    { "original": "Ley 100", "normalizado": "Ley 100 de 1993", "completa": false }
  ],
  "totalReferencias": number,
  "incompletas": number
}`,

  STEP_9_VOTACIONES: `Eres un auditor matemático de votaciones legislativas.

REGLAS:
1. Sumar SOLO votos SÍ y NO (NO contar ausentes)
2. Formato de resultado: "X (en letras) votos"
   Ejemplo: "21 (veintiún) votos positivos"
3. Generar tabla Markdown:
   | Concejal | Voto |
   | :--- | :---: |

TAREA: Para cada votación en el texto:
1. Extrae la tabla de votos
2. Suma votos SÍ y NO
3. Verifica que el total reportado coincida con la suma
4. Verifica formato dual (número + letras)

OUTPUT (JSON):
{
  "votaciones": [
    {
      "descripcion": "...",
      "votosSi": number,
      "votosNo": number,
      "total": number,
      "formatoCorrecto": boolean,
      "discrepancia": string | null
    }
  ]
}`,

  STEP_10_MANUAL_ESTILO: `Eres un corrector de estilo del Concejo de Medellín. 
Aplica el Manual de Estilo V3_2026.

REGLAS:
1. COMILLAS:
   - Principal: " " (inglesas)
   - Anidadas: « » (españolas)
   - PROHIBIDO: ' ' (simples) y "" (rectas)
   
2. PUNTUACIÓN:
   - Punto y coma van DESPUÉS de las comillas
   - ✗ Incorrecto: "La sesión terminó."
   - ✓ Correcto: "La sesión terminó".

3. CIFRAS:
   - Moneda: $ 20.000.000 (puntos de mil)
   - Porcentajes: 50 % (con espacio)
   
4. MAYÚSCULAS:
   - Cargos: minúscula (secretario, alcalde)
   - Entidades: Mayúscula (Concejo de Medellín)

TAREA: Analiza el texto y marca todos los errores de estilo.

OUTPUT (JSON):
{
  "errores": [
    {
      "tipo": "comillas|puntuacion|cifras|mayusculas",
      "original": "...",
      "correccion": "...",
      "regla": "..."
    }
  ],
  "totalErrores": number
}`,

  STEP_14_RETORICA: `Eres un editor de discurso parlamentario.

TAREA: Limpia muletillas y redundancias manteniendo el sentido.

MULETILLAS A ELIMINAR:
- "eh", "este", "mmm", "digamos", "o sea", "básicamente"
- "pues" (cuando es muletilla, no conector)
- Repeticiones innecesarias

REGLAS:
1. Elimina muletillas sin alterar el significado
2. Mantén el tono formal parlamentario
3. Preserva las citas textuales (marcar con (sic) si contienen coloquialismos)

OUTPUT: Texto limpio + conteo de muletillas eliminadas.`,

  // FASE 3: CIERRE Y EXPORTACIÓN

  STEP_15_PROPOSICIONES: `Eres un verificador de proposiciones legislativas.

TAREA: Para cada proposición mencionada:
1. Extraer el título exacto
2. Verificar si tiene anexo correspondiente
3. Verificar que el texto esté en bloque de cita

OUTPUT (JSON):
{
  "proposiciones": [
    {
      "titulo": "...",
      "tieneAnexo": boolean,
      "enBloqueCita": boolean,
      "aprobada": boolean,
      "votacion": string
    }
  ]
}`,

  STEP_18_ORTOGRAFIA: `Eres un corrector ortográfico especializado en español jurídico colombiano.

TAREA: Revisa tildes y concordancia.

ERRORES COMUNES A BUSCAR:
- Tildes faltantes: sesion→sesión, votacion→votación
- Concordancia género: "la concejal"→"el concejal" o "la concejala"
- Concordancia número: "los ciudadano"→"los ciudadanos"

OUTPUT (JSON):
{
  "errores": [
    { "original": "...", "correccion": "...", "tipo": "tilde|genero|numero" }
  ],
  "totalErrores": number
}`,

  STEP_19_REPORTE: `Eres un generador de reportes de relatoría.

TAREA: Genera un reporte estructurado con:

1. ESTADÍSTICAS:
   - Total de intervenciones
   - Total de votaciones
   - Duración de la sesión
   
2. ALERTAS:
   - Errores críticos encontrados
   - Fragmentos inaudibles
   - Datos que requieren verificación humana

3. RESUMEN EJECUTIVO:
   - Principales temas discutidos
   - Decisiones adoptadas
   - Compromisos adquiridos

OUTPUT: Reporte en formato Markdown.`
};

// ===== FUNCIONES DE LLAMADA A GEMINI =====

export async function callGeminiForStep(
  stepId: number,
  content: string,
  onProgress?: (message: string) => void
): Promise<any> {
  const promptKey = getPromptKeyForStep(stepId);
  
  if (!promptKey || !STEP_PROMPTS[promptKey as keyof typeof STEP_PROMPTS]) {
    return { skipped: true, reason: 'No Gemini prompt for this step' };
  }
  
  const systemPrompt = STEP_PROMPTS[promptKey as keyof typeof STEP_PROMPTS];
  
  onProgress?.(`Llamando a Gemini para paso ${stepId}...`);
  
  try {
    const response = await geminiService.sendMessage(
      `${systemPrompt}\n\n---\n\nTEXTO A PROCESAR:\n\n${content}`
    );
    
    // Intentar parsear como JSON si aplica
    const text = response.text;
    
    try {
      // Buscar JSON en la respuesta
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // No es JSON, devolver texto
    }
    
    return { text, raw: true };
    
  } catch (error: any) {
    return { error: error.message, failed: true };
  }
}

function getPromptKeyForStep(stepId: number): string | null {
  const mapping: Record<number, string> = {
    2: 'STEP_2_FUSION',
    4: 'STEP_4_QUORUM',
    6: 'STEP_6_INTERVENCIONES',
    7: 'STEP_7_CITAS_LEGALES',
    9: 'STEP_9_VOTACIONES',
    10: 'STEP_10_MANUAL_ESTILO',
    14: 'STEP_14_RETORICA',
    15: 'STEP_15_PROPOSICIONES',
    18: 'STEP_18_ORTOGRAFIA',
    19: 'STEP_19_REPORTE'
  };
  
  return mapping[stepId] || null;
}

// ===== UTILIDADES =====

export function convertNumberToWords(num: number): string {
  const units = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const tens = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  
  if (num < 10) return units[num];
  if (num < 20) return teens[num - 10];
  if (num === 20) return 'veinte';
  if (num === 21) return 'veintiún';
  if (num < 30) return 'veinti' + units[num - 20];
  
  const ten = Math.floor(num / 10);
  const unit = num % 10;
  
  if (unit === 0) return tens[ten];
  return tens[ten] + ' y ' + units[unit];
}

export function formatVoteResult(votes: number): string {
  return `${votes} (${convertNumberToWords(votes)}) votos`;
}
