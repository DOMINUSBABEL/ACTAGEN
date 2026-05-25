/**
 * TEI/XML PARSER SERVICE (Draft)
 * Proporciona utilidades para procesar documentos en formato TEI (Text Encoding Initiative).
 */

import { XMLParser } from 'fast-xml-parser';

export interface TeiElement {
  tag: string;
  attributes: any;
  content: string | TeiElement[];
}

export class TeiParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
  }

  /**
   * Parsea un string XML TEI a un objeto JS manejable.
   */
  public parse(xmlContent: string): any {
    try {
      return this.parser.parse(xmlContent);
    } catch (error) {
      console.error("Error parsing TEI XML:", error);
      throw new Error("Failed to parse TEI content.");
    }
  }

  /**
   * Extrae el texto plano del cuerpo del TEI (elemento <text>).
   */
  public extractBodyText(teiObj: any): string {
    const textNode = teiObj?.TEI?.text;
    if (!textNode) return "";

    // Función recursiva para recolectar texto de nodos p, div, etc.
    const collectText = (node: any, parts: string[]) => {
      if (typeof node === 'string') {
        parts.push(node);
        return;
      }
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) {
          collectText(node[i], parts);
          if (i < node.length - 1) {
            parts.push(' ');
          }
        }
        return;
      }
      
      const start = parts.length;
      // Priorizar el cuerpo (body) si existe
      const target = node.body || node;
      
      for (const key in target) {
        if (key === '#text') {
          parts.push(target[key]);
        } else if (!key.startsWith('@_')) {
          collectText(target[key], parts);
          parts.push(" ");
        }
      }

      // Simulate trim() on the joined result of this segment
      const end = parts.length;
      if (end > start) {
        // Trim Start
        let firstNonEmpty = -1;
        for (let i = start; i < end; i++) {
            if (!/\S/.test(parts[i])) {
                 parts[i] = "";
                 continue;
            }

            parts[i] = parts[i].trimStart();
            firstNonEmpty = i;
            break;
        }

        // Trim End
        if (firstNonEmpty !== -1) {
            for (let i = end - 1; i >= firstNonEmpty; i--) {
                if (!/\S/.test(parts[i])) {
                    parts[i] = "";
                    continue;
                }
                parts[i] = parts[i].trimEnd();
                break;
            }
        }
      }
    };

    const parts: string[] = [];
    collectText(textNode, parts);
    return parts.join('').trim();
  }
}

export default new TeiParser();
