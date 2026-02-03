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
    const collectText = (node: any): string => {
      if (typeof node === 'string') return node;
      if (Array.isArray(node)) return node.map(collectText).join(' ');
      
      let text = "";
      // Priorizar el cuerpo (body) si existe
      const target = node.body || node;
      
      for (const key in target) {
        if (key === '#text') {
          text += target[key];
        } else if (!key.startsWith('@_')) {
          text += collectText(target[key]) + " ";
        }
      }
      return text.trim();
    };

    return collectText(textNode);
  }
}

export default new TeiParser();
