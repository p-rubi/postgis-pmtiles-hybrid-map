// query-modes.js — els modes de clic i el llenç compartit dels resultats.
//
// El visor té un únic clic esquerre, i què fa depèn de la consulta activa:
//
//   none     cap consulta         → obre la fitxa del punt (layer-pois.js)
//   nearest  Més propers          → calcula els N serveis més propers al clic
//   radius   Resum en un radi     → compta què hi ha dins d'un cercle
//
// Els botons del panell són interruptors: tornar a clicar el de la consulta
// activa la desactiva i el clic torna a obrir fitxes.
//
// Aquest mòdul guarda el mode, el que hi ha dibuixat, l'últim punt consultat
// i el que hi ha escrit al panell de resultats. Qui fa les consultes és
// query-run.js.

import { $ } from './utils.js';
import { t } from './i18n.js';
import { state } from './state.js';
import { map } from './map.js';

/**
 * Escriu HTML al calaix de resultats del panell.
 *
 * Quan hi ha contingut, avisa amb l'esdeveniment 'geodb:results': ui.js
 * l'escolta per desplegar el panell si estava plegat (en un mòbil, l'usuari
 * el plega per poder clicar el mapa) i portar el resultat a la vista.
 */
export const results = html => {
  $('results').innerHTML = html;
  if (html) document.dispatchEvent(new CustomEvent('geodb:results'));
};

/**
 * Els marcadors numerats (1, 2, 3…) del mode "Més propers".
 *
 * Són elements HTML damunt del mapa, no una capa de text, perquè una capa de
 * text necessitaria un servidor de tipografies (glyphs) i aquí no n'hi ha cap.
 * Cal desar-los en una llista per poder-los treure: MapLibre no ho fa sol.
 */
let markers = [];

/**
 * L'últim punt consultat. Permet repetir la consulta quan canvia alguna cosa
 * que en canvia la resposta (el filtre del bloc 1, el radi, el nombre de
 * resultats) sense que l'usuari hagi de tornar a clicar.
 */
let lastClick = null;
export const getLastClick = () => lastClick;
export const rememberClick = lngLat => { lastClick = lngLat; };

/** Esborra el dibuix de l'última consulta: geometries, marcadors i punt. */
export function clearQuery() {
  map.getSource('query').setData({ type: 'FeatureCollection', features: [] });
  markers.forEach(m => m.remove());
  markers = [];
  lastClick = null;
}

/**
 * Afegeix un marcador numerat i el recorda per poder-lo esborrar després.
 *
 * El clic sobre el marcador ressalta el seu resultat a la llista. S'atura la
 * propagació: el marcador és dins del contenidor del mapa, i sense això el
 * clic arribaria al mapa i llançaria una consulta nova des d'aquell punt.
 */
export function addRankMarker(coordinates, rank) {
  const el = document.createElement('div');
  el.className = 'rank';
  el.dataset.rank = rank;
  el.textContent = rank;
  el.addEventListener('click', e => { e.stopPropagation(); highlightRank(rank); });
  markers.push(new maplibregl.Marker({ element: el }).setLngLat(coordinates).addTo(map));
}

/**
 * Ressalta un resultat de "Més propers": el marcador fa uns polsos i passa al
 * davant dels altres, i la línia de la llista es marca.
 *
 * Es treu la classe i es torna a posar (forçant un reflow entremig) perquè
 * l'animació es repeteixi encara que el mateix resultat es triï dues vegades.
 */
export function highlightRank(rank) {
  markers.forEach(m => {
    const el = m.getElement();
    const on = el.dataset.rank === String(rank);
    el.classList.remove('hl');
    if (on) { void el.offsetWidth; el.classList.add('hl'); }
    el.style.zIndex = on ? 1 : '';
  });
  $('results').querySelectorAll('li.hit').forEach(li =>
    li.classList.toggle('sel', li.dataset.rank === String(rank)));
}

/** La clau del diccionari amb l'ajuda de cada mode (web/lang/). */
const MODE_NOTES = {
  none:    'block3.note.none',
  nearest: 'block3.note.nearest',
  radius:  'block3.note.radius'
};

/**
 * Reescriu l'ajuda del mode actual.
 *
 * Existeix a part de setMode() perquè en canviar d'idioma cal refer el text
 * sense tocar res més: passar per setMode() esborraria el dibuix i el punt
 * de l'última consulta, i el resultat que hi ha a la vista es perdria.
 */
export const refreshModeNote = () => { $('mode-note').textContent = t(MODE_NOTES[state.mode]); };

/**
 * Canvia de mode: actualitza l'estat, els botons, l'ajuda i el cursor, i
 * neteja el que hi hagués de la consulta anterior (barrejar resultats de dos
 * modes al mapa només despistaria).
 *
 * Demanar el mode que ja està actiu el desactiva: és el que passa en tornar a
 * clicar el mateix botó.
 */
export function setMode(mode) {
  if (mode === state.mode) mode = 'none';
  state.mode = mode;
  document.querySelectorAll('#mode button').forEach(b => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
  $('q-clear').disabled = mode === 'none';
  $('opt-nearest').hidden = mode !== 'nearest';
  $('opt-radius').hidden  = mode !== 'radius';
  refreshModeNote();
  // La creu avisa que el clic anirà al mapa i no als punts.
  map.getCanvas().style.cursor = mode === 'none' ? '' : 'crosshair';
  clearQuery();
  results('');
}
