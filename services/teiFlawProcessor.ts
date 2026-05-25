/**
 * TEI FLAW PROCESSOR
 * Procesador de etiquetas <FLAW> en documentos TEI/XML
 * Permite extraer errores, aplicar sugerencias y limpiar el texto.
 */

export interface TeiFlaw {
  type: string;
  suggestion?: string;
  original: string;
  context?: string; // Optional: 50 chars before/after
}

export interface ProcessResult {
  cleanText: string;
  flaws: TeiFlaw[];
}

/**
 * Procesa un texto con etiquetas <FLAW> incrustadas.
 * Extrae los errores y aplica sugerencias si existen.
 */
export function processFlawTags(text: string): ProcessResult {
  const flaws: TeiFlaw[] = [];

  // Regex explanation:
  // <FLAWMatch start tag, capturing attributes part
  // ([\s\S]*?)Match content non-greedily
  // <\/FLAW>Match end tag
  const regex = /<FLAW([^>]*)>([\s\S]*?)<\/FLAW>/g;

  const cleanText = text.replace(regex, (match, attributes, content) => {
    // Parse attributes
    const typeMatch = attributes.match(/Type="([^"]*)"/i);
    const suggestionMatch = attributes.match(/Suggestion="([^"]*)"/i);

    const type = typeMatch ? typeMatch[1] : 'unknown';
    const suggestion = suggestionMatch ? suggestionMatch[1] : undefined;

    flaws.push({
      type,
      suggestion,
      original: content
    });

    // If suggestion exists and is not empty, use it. Otherwise keep original content.
    if (suggestion && suggestion.trim() !== '') {
      return suggestion;
    }

    return content;
  });

  return { cleanText, flaws };
}
