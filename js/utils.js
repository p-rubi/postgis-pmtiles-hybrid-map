// utils.js — funcions curtes que fa servir tothom.
//
// No depèn ni del mapa, ni de l'API, ni de l'estat. L'única cosa que demana és
// l'idioma actiu (i18n.js), perquè els números no s'escriuen igual a tot
// arreu: 1,5 km en català i en castellà, 1.5 km en anglès.

import { getLang } from './i18n.js';

/** Accés curt a un element del panell pel seu id: $('status') → <div id="status">. */
export const $ = id => document.getElementById(id);

/**
 * Escapa un text abans d'inserir-lo com a HTML.
 *
 * PER QUÈ: els noms, horaris i adreces venen d'OpenStreetMap, i OSM l'edita
 * qualsevol. Un nom com `<img src=x onerror=alert(1)>` executaria codi al
 * navegador de tothom qui visiti el visor (un atac XSS). Tracta sempre les
 * dades d'OSM com a entrada no fiable: tot el que acabi dins d'un innerHTML
 * o d'un setHTML() ha de passar per aquí.
 */
export const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

/**
 * Formata una distància en metres per mostrar-la: 240 → "240 m", 1500 → "1,5 km".
 * La convenció decimal la posa l'idioma actiu: coma en català i en castellà,
 * punt en anglès. Entre el número i la unitat hi va un espai no separable
 * ( ): en una llista estreta, "190 m" no s'ha de partir en dues línies.
 */
export const fmtM = m => m >= 1000
  ? `${(m / 1000).toLocaleString(getLang(), { maximumFractionDigits: 1 })} km`
  : `${Math.round(m)} m`;

/** Un recompte amb el separador de milers de l'idioma actiu: 1435 → "1.435". */
export const fmtN = n => Number(n).toLocaleString(getLang());
