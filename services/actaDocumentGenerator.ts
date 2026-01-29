/**
 * ACTA DOCUMENT GENERATOR
 * Genera el documento final del acta en formato Word/PDF
 * Basado en el formato oficial del Concejo de Medellín
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
  19: 'diecinueve', 20: 'veinte', 21: 'veintiún'
};

// ===== HELPERS =====

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

export function numeroALetras(n: number): string {
  if (NUMEROS_LETRAS[n]) return NUMEROS_LETRAS[n];
  if (n < 30) return `veinti${NUMEROS_LETRAS[n - 20]}`;
  return n.toString(); // Fallback
}

export function formatearVotoDual(numero: number): string {
  return `${numero} (${numeroALetras(numero)})`;
}

export function formatearHora(hora: string): string {
  const [h, m] = hora.split(':').map(Number);
  const periodo = h >= 12 ? 'p. m.' : 'a. m.';
  const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hora12}:${m.toString().padStart(2, '0')} ${periodo}`;
}

// ===== GENERADOR DE SECCIONES =====

export function generarPortada(metadata: ActaMetadata): string {
  return `
# ACTA DE SESIÓN PLENARIA No. ${metadata.numero}
## MODALIDAD: ${metadata.tipo.toUpperCase()}

**CONCEJO DE MEDELLÍN**
PERÍODO 2024-2027

---

**FECHA:** ${formatearFechaOficial(metadata.fecha)}
`;
}

export function generarEncabezado(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  lugar: string,
  asistentes: Concejal[],
  ausentes: { concejal: Concejal; justificada: boolean; motivo?: string }[]
): string {
  const tablaAsistencia = asistentes.map(c => 
    `| ${c.apellidos?.toUpperCase() || c.nombreCompleto.split(' ').slice(-2).join(' ').toUpperCase()}, ${c.nombre} | ✓ |`
  ).join('\n');

  const tablaAusentes = ausentes.map(a => 
    `| ${a.concejal.nombreCompleto} | ${a.justificada ? 'Excusa' : 'Ausente'} |`
  ).join('\n');

  return `
**HORA DE INICIO:** ${formatearHora(horaInicio)}
**HORA DE FINALIZACIÓN:** ${formatearHora(horaFin)}
**LUGAR:** ${lugar}

---

## 1. LLAMADO A LISTA Y VERIFICACIÓN DEL QUÓRUM

| HONORABLE CONCEJAL | ASISTENCIA |
|:---|:---:|
${tablaAsistencia}
${tablaAusentes}

**TOTAL PRESENTES:** ${asistentes.length} honorables concejales.
${ausentes.length > 0 ? `**AUSENCIAS:** ${ausentes.length} (${ausentes.filter(a => a.justificada).length} justificadas)` : ''}

*Existe quórum para deliberar y decidir.*
`;
}

export function generarOrdenDelDia(items: { numero: number; titulo: string; descripcion?: string }[]): string {
  const lista = items.map(item => {
    let linea = `${item.numero}. ${item.titulo}`;
    if (item.descripcion) {
      linea += `\n   *${item.descripcion}*`;
    }
    return linea;
  }).join('\n');

  return `
## 2. ORDEN DEL DÍA

${lista}

**Votación:** Aprobado por unanimidad.
`;
}

export function generarIntervencion(intervencion: Intervencion): string {
  const { orador, contenido, timestampVideo } = intervencion;
  
  let encabezado = '';
  if (orador.esConcejal) {
    encabezado = `**H.C. ${orador.nombre.toUpperCase()}${orador.dependencia ? ` (${orador.dependencia})` : ''}:**`;
  } else if (orador.esFuncionario) {
    encabezado = `**${orador.cargo.toUpperCase()}, ${orador.nombre}:**`;
  } else {
    encabezado = `**${orador.nombre}${orador.organizacion ? `, ${orador.organizacion}` : ''}:**`;
  }

  const timestamp = timestampVideo ? ` *[${timestampVideo}]*` : '';

  return `
${encabezado}${timestamp}

"${contenido}"
`;
}

export function generarVotacionNominal(votacion: VotacionInfo): string {
  if (!votacion.votosNominales || votacion.votosNominales.length === 0) {
    return `
**VOTACIÓN ORDINARIA**

**Resultado:** ${votacion.resultado === 'aprobado' ? 'Aprobado' : 'Rechazado'} con ${formatearVotoDual(votacion.votosSi || 0)} votos afirmativos.
`;
  }

  const tabla = votacion.votosNominales.map(v => 
    `| ${v.concejal} | ${v.voto.toUpperCase()} |`
  ).join('\n');

  const afirmativos = votacion.votosNominales.filter(v => v.voto === 'si').length;
  const negativos = votacion.votosNominales.filter(v => v.voto === 'no').length;
  const abstenciones = votacion.votosNominales.filter(v => v.voto === 'abstencion').length;

  let resultado = `${formatearVotoDual(afirmativos)} votos afirmativos`;
  if (negativos > 0) resultado += `, ${formatearVotoDual(negativos)} negativos`;
  if (abstenciones > 0) resultado += `, ${formatearVotoDual(abstenciones)} abstenciones`;

  return `
**VOTACIÓN NOMINAL**

| HONORABLE CONCEJAL | VOTO |
|:---|:---:|
${tabla}

**Resultado:** ${votacion.resultado === 'aprobado' ? 'Aprobado' : 'Rechazado'} con ${resultado}.
`;
}

export function generarCierre(
  horaFin: string,
  proximaSesion: { dia: string; fecha: string; hora: string; lugar: string },
  presidente: string,
  secretario: string
): string {
  return `
## CIERRE DE LA SESIÓN

Agotado el orden del día, el presidente del Concejo agradece a los funcionarios de la Administración Municipal, a los honorables concejales y a la ciudadanía presente y conectada virtualmente.

Se convoca para la próxima sesión ordinaria el día ${proximaSesion.dia}, ${proximaSesion.fecha}, a las ${formatearHora(proximaSesion.hora)}, en el mismo recinto.

Siendo las ${formatearHora(horaFin)}, se levanta la sesión.

---

Para constancia se firma por quienes en ella intervinieron:



**${presidente.toUpperCase()}**
Presidente del Concejo



**${secretario.toUpperCase()}**
Secretario General
`;
}

// ===== GENERADOR PRINCIPAL =====

export function generarActaCompleta(acta: ActaFinal): string {
  const secciones: string[] = [];

  // 1. Portada
  secciones.push(generarPortada(acta.metadata));

  // 2. Encabezado con asistencia
  secciones.push(generarEncabezado(
    acta.metadata.fecha,
    acta.encabezado.horaInicio,
    acta.encabezado.horaFin,
    acta.encabezado.lugar,
    acta.encabezado.asistentes,
    acta.encabezado.ausentes
  ));

  // 3. Orden del día
  secciones.push(generarOrdenDelDia(acta.ordenDelDia));

  // 4. Desarrollo (intervenciones)
  secciones.push('\n## 3. DESARROLLO DE LA SESIÓN\n');
  
  if (acta.desarrollo.debatePrincipal) {
    secciones.push(`\n### ${acta.desarrollo.debatePrincipal.titulo.toUpperCase()}\n`);
    
    // Intervenciones agrupadas
    const { intervenciones } = acta.desarrollo.debatePrincipal;
    
    if (intervenciones.concejales.length > 0) {
      secciones.push('\n#### Intervenciones de los Honorables Concejales\n');
      intervenciones.concejales.forEach(i => secciones.push(generarIntervencion(i)));
    }
    
    if (intervenciones.administracion.length > 0) {
      secciones.push('\n#### Intervenciones de la Administración\n');
      intervenciones.administracion.forEach(i => secciones.push(generarIntervencion(i)));
    }

    // Votación final si existe
    if (acta.desarrollo.debatePrincipal.votacionFinal) {
      secciones.push(generarVotacionNominal(acta.desarrollo.debatePrincipal.votacionFinal));
    }
  }

  // 5. Comunicaciones
  if (acta.comunicaciones.length > 0) {
    secciones.push('\n## 4. COMUNICACIONES\n');
    acta.comunicaciones.forEach(c => {
      secciones.push(`${c.numero}. Oficio No. ${c.radicado} de ${c.remitente}: ${c.asunto}\n`);
    });
  }

  // 6. Proposiciones
  if (acta.proposiciones.length > 0) {
    secciones.push('\n## 5. PROPOSICIONES Y VARIOS\n');
    acta.proposiciones.forEach(p => {
      secciones.push(`- **${p.iniciativa.concejal}:** ${p.titulo}\n`);
    });
  }

  // 7. Cierre
  secciones.push(generarCierre(
    acta.cierre.horaLevantamiento,
    acta.cierre.convocatoria,
    acta.cierre.firmas.find(f => f.cargo === 'Presidente')?.nombre || 'PRESIDENTE',
    acta.cierre.firmas.find(f => f.cargo === 'Secretario General')?.nombre || 'SECRETARIO GENERAL'
  ));

  // 8. Nota final
  if (acta.metadata.youtubeUrl) {
    secciones.push(`\n---\n\n*Esta sesión puede ser consultada en:*\n- YouTube: ${acta.metadata.youtubeUrl}\n`);
  }

  return secciones.join('\n');
}

// ===== EXPORT DEFAULT =====
export default {
  generarActaCompleta,
  generarPortada,
  generarEncabezado,
  generarOrdenDelDia,
  generarIntervencion,
  generarVotacionNominal,
  generarCierre,
  formatearFechaCompleta,
  formatearHora,
  formatearVotoDual
};
