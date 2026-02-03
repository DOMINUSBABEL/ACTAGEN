/**
 * ACTA DOCUMENT GENERATOR
 * Genera el documento final del acta en formato institucional del Concejo de Medellín
 * Basado en el formato de las actas 349 y 350.
 */

import { ActaFinal, ActaMetadata, Concejal, Intervencion, VotacionInfo } from '../types/actaOutput';

// ===== CONSTANTES DE FORMATO =====

const MESES_ESPANOL = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const NUMEROS_LETRAS: Record<number, string> = {
  0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro',
  5: 'cinco', 6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve',
  10: 'diez', 11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce',
  15: 'quince', 16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho',
  19: 'diecinueve', 20: 'veinte', 21: 'veintiuno'
};

// ===== HELPERS =====

/**
 * Convierte un número en su representación textual formal (estilo legislativo)
 * @param n Número a convertir (0-999)
 * @returns string con el número en letras
 */
export function numeroALetras(n: number): string {
  if (n < 0) return 'menos ' + numeroALetras(Math.abs(n));
  if (n <= 21) return NUMEROS_LETRAS[n];
  
  if (n < 30) return `veinti${NUMEROS_LETRAS[n - 20]}`;
  
  const unidades = n % 10;
  const decenas = Math.floor(n / 10);
  
  const DECENAS_LETRAS: Record<number, string> = {
    3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta',
    7: 'setenta', 8: 'ochenta', 9: 'noventa'
  };

  if (unidades === 0) return DECENAS_LETRAS[decenas];
  return `${DECENAS_LETRAS[decenas]} y ${NUMEROS_LETRAS[unidades]}`;
}

export function formatearFechaCompleta(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const dia = d.getDate();
  const mes = MESES_ESPANOL[d.getMonth()];
  const año = d.getFullYear();
  return `${dia} de ${mes} de ${año}`;
}

export function formatearFechaOficial(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const diaSemana = dias[d.getDay()];
  return `${diaSemana}, ${formatearFechaCompleta(fecha)}`;
}

export function formatearVotoDual(numero: number): string {
  return `${numero} (${numeroALetras(numero)})`;
}

export function formatearHora(hora: string): string {
  if (!hora) return "";
  const parts = hora.split(':').map(Number);
  if (parts.length < 2) return hora;
  const [h, m] = parts;
  const periodo = h >= 12 ? 'p. m.' : 'a. m.';
  const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hora12}:${m.toString().padStart(2, '0')} ${periodo}`;
}

// ===== GENERADOR DE SECCIONES =====

export function generarPortada(metadata: ActaMetadata): string {
  const fecha = metadata.fechaFormateada || formatearFechaCompleta(metadata.fecha);
  return `
Sesión Plenaria
Ordinaria

Acta ${metadata.numero}

${fecha}
\f`; // Page break
}

export function generarEncabezado(
  metadata: ActaMetadata,
  encabezado: any
): string {
  const asistentesStr = encabezado.asistentes.map((c: Concejal) => c.nombreCompleto).join('\n            ');
  const ausentesStr = encabezado.ausentes.length > 0 
    ? encabezado.ausentes.map((a: any) => `${a.concejal.nombreCompleto}, concejal(a)\n            Ausencia ${a.justificada ? 'justificada' : 'no justificada'}${a.motivo ? `. ${a.motivo}` : ''}`).join('\n            ')
    : "No se presentaron inasistencias.";

  return `
SESIÓN PLENARIA ORDINARIA
ACTA ${metadata.numero}

FECHA:      Medellín, ${formatearFechaCompleta(metadata.fecha)}

HORA:       De las ${encabezado.horaInicio} a las ${encabezado.horaFin} horas

LUGAR:      Recinto oficial de sesiones

ASISTENTES: ${asistentesStr}

AUSENTES:   ${ausentesStr}

El secretario General informó que se contaba con cuórum suficiente para deliberar y decidir

Siendo las ${encabezado.horaApertura || encabezado.horaInicio} horas el presidente declaró abierta la sesión
`;
}

export function generarOrdenDelDia(items: { numero: number; titulo: string; descripcion?: string }[]): string {
  const lista = items.map(item => {
    return `${item.numero}.  ${item.titulo}`;
  }).join('\n\n');

  return `
ORDEN DEL DÍA:

${lista}
`;
}

export function generarIntervencion(intervencion: Intervencion): string {
  const { orador, contenido } = intervencion;
  
  let cargoStr = '';
  if (orador.esConcejal) {
    cargoStr = 'el/la concejal(a)';
  } else if (orador.cargo) {
    cargoStr = `el/la ${orador.cargo.toLowerCase()}${orador.dependencia ? ` de ${orador.dependencia}` : ''}`;
  } else {
    cargoStr = 'el ciudadano';
  }

  return `
Intervino ${cargoStr}, ${orador.nombre}:

${contenido}
`;
}

export function generarVotacion(asunto: string, resultado: string): string {
  return `
Se sometió a consideración ${asunto}. No se presentaron intervenciones. ${resultado}.
`;
}

export function generarCierre(
  cierre: any
): string {
  const fechaProc = cierre.convocatoria.fecha;
  const diaSemana = cierre.convocatoria.dia;
  const hora = cierre.convocatoria.hora;

  return `
Agotado el orden del día, el presidente levantó la sesión siendo las ${cierre.horaLevantamiento} horas.


CONVOCATORIA: la próxima sesión plenaria se realizará el ${diaSemana} ${fechaProc} a las ${hora} horas, en el recinto oficial de sesiones del Concejo Distrital de Medellín.

---

Para constancia se firma por quienes en ella intervinieron:



${cierre.firmas[0]?.nombre.toUpperCase() || 'PRESIDENTE'}         ${cierre.firmas[1]?.nombre.toUpperCase() || 'SECRETARIO GENERAL'}
       Presidente                                   Secretario General
`;
}

// ===== GENERADOR PRINCIPAL =====

export function generarActaCompleta(acta: ActaFinal): string {
  const secciones: string[] = [];

  // 1. Portada
  secciones.push(generarPortada(acta.metadata));

  // 2. Encabezado
  secciones.push(generarEncabezado(acta.metadata, acta.encabezado));

  // 3. Orden del día
  secciones.push(generarOrdenDelDia(acta.ordenDelDia));

  // 4. Desarrollo
  secciones.push('\nDESARROLLO\n');
  
  // Aprobación orden del día
  secciones.push(generarVotacion("el orden del día", acta.desarrollo.aprobacionOrdenDia.resultado === 'aprobado' ? "Fue aprobado" : "No fue aprobado"));

  if (acta.desarrollo.debatePrincipal) {
    secciones.push(`\n${acta.desarrollo.debatePrincipal.titulo.toUpperCase()}\n`);
    
    const { intervenciones } = acta.desarrollo.debatePrincipal;
    
    // Concejales citantes
    if (intervenciones.concejales.length > 0) {
      secciones.push('\n• Iniciaron las intervenciones de los concejales citantes:\n');
      intervenciones.concejales.forEach(i => secciones.push(generarIntervencion(i)));
    }
    
    // Administración
    if (intervenciones.administracion.length > 0) {
      secciones.push('\n• Iniciaron las intervenciones de la Administración distrital:\n');
      intervenciones.administracion.forEach(i => secciones.push(generarIntervencion(i)));
    }
  }

  // 5. Cierre
  secciones.push(generarCierre(acta.cierre));

  // 6. Firmas (SIMI Standard)
  secciones.push(`\n\n${acta.cierre.firmas[0]?.nombre.toUpperCase() || 'PRESIDENTE'}\nPresidente\n\n${acta.cierre.firmas[1]?.nombre.toUpperCase() || 'SECRETARIO GENERAL'}\nSecretario General\n`);

  // 7. Nota final
  secciones.push(`\nNota:\n\nSi desea conocer el contenido completo de la sesión, por favor diríjase a YouTube para acceder al video.\n\nEnlace vídeo sesión plenaria:\n${acta.metadata.youtubeUrl || 'https://www.youtube.com/@ConcejodeMedellinOficial'}\n`);

  return secciones.join('\n');
}

// ===== EXPORT DEFAULT =====
export default {
  generarActaCompleta,
  generarPortada,
  generarEncabezado,
  generarOrdenDelDia,
  generarIntervencion,
  generarCierre,
  numeroALetras,
  formatearFechaCompleta,
  formatearHora,
  formatearVotoDual
};
