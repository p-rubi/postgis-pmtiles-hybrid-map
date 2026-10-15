// layer-accessibility.js — la capa d'accessibilitat.
//
// QUÈ MOSTRA: cada edifici pintat segons com de lluny li queda el servei triat.
//
// D'ON SURT: la distància ja ve calculada. Durant la generació dels PMTiles,
// PostGIS calcula per a cada edifici la distància a cada subcategoria
// analitzable i la desa en una columna d_<codi> (d_farmacia, d_escola…), que
// viatja dins de la tessel·la com un atribut més.
//
// PER QUÈ IMPORTA: moure el llindar NO demana res al servidor. L'únic que
// canvia és una expressió d'estil que avalua el navegador sobre dades que ja
// té. Obre la pestanya "Network" de les eines de desenvolupament i mou el
// control: no hi apareix cap petició. Aquest és el contrast amb els punts
// d'interès (layer-pois.js), que sí que tornen a demanar tessel·les.
//
// LIMITACIÓ: són distàncies en línia recta, no per la xarxa viària, i només
// compten els edificis mapats a OpenStreetMap. Es mesuren tots els edificis
// del terme, sigui quin sigui el seu ús.

import { $, esc, fmtM } from './utils.js';
import { t } from './i18n.js';
import { BY_CODE } from './taxonomy.js';
import { state, isAnalysable } from './state.js';
import { map } from './map.js';
import { requireBuildings } from './layer-basemap.js';

/** L'escala de colors, carregada de style/accessibility.json per main.js. */
let scale = null;

/** main.js li passa l'escala un cop llegida del JSON, abans d'ensenyar res. */
export function setAccessibilityScale(loaded) { scale = loaded; }

/**
 * Construeix l'expressió de color de la capa a partir de l'escala i el llindar.
 *
 * L'expressió té forma de cadena de condicions que MapLibre avalua edifici a
 * edifici, i es llegeix de dalt a baix, com un if/else if:
 *
 *   si no té la propietat d_<sub>   → color de "sense dada"
 *   si d_<sub> <= llindar × 0,5     → verd
 *   si d_<sub> <= llindar × 1       → llima
 *   si d_<sub> <= llindar × 2       → taronja
 *   altrament                       → vermell
 *
 * El primer cas és important: ['has', …] distingeix "no hi ha dada" de "la
 * distància és gran". Tippecanoe no escriu els atributs nuls, i un edifici
 * queda sense la propietat si a l'àmbit no hi ha cap servei d'aquella
 * subcategoria.
 *
 * S'exporta —com legendRows()— perquè no toca ni el mapa ni el DOM: amb els
 * mateixos arguments dona sempre el mateix resultat, i això la fa comprovable.
 */
export function colorExpression(field, threshold) {
  const limits = scale.classes.filter(c => c.factor != null);
  const rest = scale.classes[scale.classes.length - 1];
  return [
    'case',
    ['!', ['has', field]], scale.sense_dada,
    ...limits.flatMap(c => [['<=', ['get', field], threshold * c.factor], c.color]),
    rest.color
  ];
}

/**
 * Els trams de la llegenda, amb el seu color i el text de sota: "≤ 250 m",
 * "≤ 500 m", …, "> 1 km".
 */
export function legendRows(threshold) {
  const limits = scale.classes.filter(c => c.factor != null);
  const last = limits[limits.length - 1];
  return scale.classes.map(c => [
    c.color,
    c.factor != null ? t('legend.lte', { v: fmtM(threshold * c.factor) })
                     : t('legend.gt',  { v: fmtM(threshold * last.factor) })
  ]);
}

/** Escriu el valor del llindar i la llegenda: és immediat i no toca el mapa. */
function drawLegend(threshold) {
  $('thr-val').textContent = fmtM(threshold);
  // Una barra de colors amb el límit de cada tram a sota. "Sense dada" només
  // surt quan pot aparèixer: si la subcategoria no té cap servei a l'àmbit.
  const rows = legendRows(threshold);
  $('legend').innerHTML =
    `<div class="ramp">${rows.map(([c]) => `<i style="background:${c}"></i>`).join('')}</div>` +
    `<div class="ticks">${rows.map(([, txt]) => `<span>${esc(txt)}</span>`).join('')}</div>` +
    (BY_CODE[state.sub].n > 0 ? '' :
      `<div class="nodata"><i style="background:${scale.sense_dada}"></i>${esc(t('legend.noData'))}</div>`);
}

/**
 * Canvia el color dels edificis. El nom de la columna es construeix amb el
 * codi de la subcategoria: 'farmacia' → 'd_farmacia'. Totes les columnes són
 * dins de cada tessel·la.
 */
const paint = threshold =>
  map.setPaintProperty('access', 'fill-color', colorExpression(`d_${state.sub}`, threshold));

const isOn = () => $('c-access').checked && isAnalysable();

/**
 * Torna a pintar la capa amb el llindar i la subcategoria actuals.
 * Es crida en canviar de subcategoria i en marcar o desmarcar la casella.
 */
export function refreshAccessibility() {
  const threshold = +$('threshold').value;
  $('thr-val').textContent = fmtM(threshold);

  const on = isOn();
  map.setLayoutProperty('access', 'visibility', on ? 'visible' : 'none');
  requireBuildings(on);
  $('legend').hidden = !on;
  if (!on) return;

  paint(threshold);
  drawLegend(threshold);
}

/**
 * El llindar mentre s'arrossega el control.
 *
 * PER QUÈ NO ES REPINTA A CADA MOVIMENT: un color que depèn de les dades
 * (['get', 'd_…']) obliga MapLibre a tornar a processar totes les tessel·les
 * de la capa, i això passa en segon pla i triga. El control llança desenes
 * d'esdeveniments per segon: repintant a cada un, les feines s'encuaven i el
 * mapa arribava al valor final segons després d'haver deixat anar el ratolí.
 *
 * Ara n'hi ha com a molt una en curs. El text i la llegenda s'actualitzen a
 * l'instant; el mapa es repinta amb l'últim valor quan acaba la feina
 * anterior ('idle'), i els valors intermedis que no han arribat a temps es
 * descarten. Segueix sense haver-hi cap petició de xarxa pel mig.
 */
let painting = false, pending = false;
export function dragThreshold() {
  if (!isOn()) { $('thr-val').textContent = fmtM(+$('threshold').value); return; }
  drawLegend(+$('threshold').value);
  if (painting) { pending = true; return; }
  painting = true;
  paint(+$('threshold').value);
  map.once('idle', () => {
    painting = false;
    if (pending) { pending = false; dragThreshold(); }
  });
  map.triggerRepaint();   // assegura que hi haurà un fotograma i, per tant, un 'idle'
}
