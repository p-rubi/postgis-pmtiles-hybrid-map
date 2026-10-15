// map.js — la instància del mapa.
//
// Un sol mapa per a tot el visor. Es crea a main.js i la resta de mòduls
// l'importen d'aquí:
//
//   import { map } from './map.js';
//
// `map` val undefined fins que main.js crida createMap(). Això no és cap
// problema perquè tots els altres mòduls només el fan servir dins de funcions
// que s'executen després (els mòduls ES mantenen viva la referència: quan
// createMap() li assigna el mapa, tothom qui l'hagi importat el veu).

import { CFG } from './api.js';

/** El mapa MapLibre. No el toquis abans de createMap(). */
export let map;

/**
 * Crea el mapa amb l'estil ja resolt i hi afegeix els controls.
 *
 * `hash: true` desa la posició a l'adreça (#zoom/lat/lon): enganxar l'enllaç
 * porta l'altra persona exactament on eres.
 *
 * `transformRequest` és el punt on MapLibre deixa modificar cada petició que
 * fa pel seu compte. S'aprofita per afegir `Accept-Profile: api` a tot el que
 * va cap a Supabase, que és el que necessita PostgREST per servir l'esquema
 * correcte. La resta de peticions (els PMTiles, que són fitxers locals) passen
 * sense tocar-les.
 */
/**
 * L'atribució de les dades, com un control mínim de MapLibre: només un text
 * amb enllaços, sense botó. L'ODbL demana que es vegi al mapa; que el
 * repositori la porti no n'hi ha prou.
 */
const attribution = {
  onAdd() {
    const el = document.createElement('div');
    el.className = 'maplibregl-ctrl attrib';
    el.innerHTML = '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">' +
                   '© OpenStreetMap</a> <a href="https://www.icgc.cat" target="_blank" rel="noopener">ICGC</a>';
    return el;
  },
  onRemove() {}
};

export function createMap(style) {
  map = new maplibregl.Map({
    container: 'map',
    center: CFG.center,
    zoom: CFG.zoom,
    hash: true,
    // El control d'atribució de MapLibre (un botó (i) que es desplega) queda
    // apagat: en tema fosc no s'integrava bé. L'atribució que demana l'ODbL
    // és un text fix al cantó de baix a la dreta, al costat de l'escala
    // (attribution, a dalt).
    attributionControl: false,
    transformRequest: url => url.startsWith(CFG.supabaseUrl)
      ? { url, headers: { 'Accept-Profile': 'api' } }
      : { url },
    style
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
  // Escala i atribució a baix a la dreta, en una sola línia (app.css): a
  // baix a l'esquerra les tapava el panell. MapLibre posa cada control nou
  // de baix davant dels que ja hi són, i per això l'atribució va primer.
  map.addControl(attribution, 'bottom-right');
  map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-right');
  return map;
}
