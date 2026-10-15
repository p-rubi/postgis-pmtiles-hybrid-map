// main.js — el punt d'entrada del visor.
//
// És l'únic fitxer que index.html carrega, i el que explica l'ordre de les
// coses. Si vols entendre el visor, comença aquí i segueix els imports.
//
// MAPA DELS FITXERS
//   i18n.js                  idioma actiu i traducció del panell
//   utils.js                 funcions curtes (escapar HTML, formatar metres)
//   taxonomy.js              les categories de serveis i els seus colors
//   api.js                   totes les peticions a Supabase
//   state.js                 la selecció actual (categoria, subcategoria, mode)
//   style.js                 carrega els fitxers d'estil de web/style/
//   map.js                   crea el mapa
//   ui.js                    el panell i els seus controls
//   layer-basemap.js         interruptors de la cartografia base
//   layer-pois.js            punts d'interès (dades vives) + fitxa
//   layer-accessibility.js   accessibilitat (dades precalculades als PMTiles)
//   layer-influence.js       àrees d'influència (dades vives)
//   query-modes.js           els modes de clic i el dibuix dels resultats
//   query-run.js             les consultes en viu contra PostGIS
//
// I els fitxers que no són codi:
//   lang/ca.js               tots els textos del visor
//   style/basemap.json       colors, gruixos i ordre de les capes
//   style/accessibility.json l'escala de colors de l'accessibilitat
//   config.js, categories.js generats per etl/web_config.sh — no s'editen

import { fetchDatasetInfo } from './api.js';
import { loadMapStyle, loadAccessibilityScale } from './style.js';
import { createMap } from './map.js';
import { initI18n } from './i18n.js';
import { initPanel, setStatus } from './ui.js';
import { setAccessibilityScale } from './layer-accessibility.js';
import { initPoiPopups } from './layer-pois.js';
import { queryNearest, queryRadius } from './query-run.js';
import { state } from './state.js';

/**
 * Arrenca el visor.
 *
 * L'ordre importa:
 *   1. triar l'idioma i traduir el marcatge, abans que es vegi res: si es fes
 *      més tard, el visor ensenyaria un instant de català a qui l'hagi deixat
 *      en un altre idioma
 *   2. registrar el protocol pmtiles:// ABANS de crear cap mapa, o MapLibre
 *      no sabrà què fer amb les URL de la cartografia base
 *   3. llegir els fitxers d'estil, que són peticions i per tant s'esperen
 *   4. crear el mapa amb l'estil ja resolt
 *   5. quan el mapa hagi carregat (les fonts ja existeixen), connectar el
 *      panell i les interaccions: abans d'això, map.getSource() no trobaria res
 */
async function start() {
  initI18n();

  // pmtiles.Protocol ensenya a MapLibre a demanar trossos d'un fitxer PMTiles
  // amb peticions de rang (Range) en comptes d'anar a un servidor de tessel·les.
  maplibregl.addProtocol('pmtiles', new pmtiles.Protocol().tile);

  const [style, scale] = await Promise.all([loadMapStyle(), loadAccessibilityScale()]);
  setAccessibilityScale(scale);

  const map = createMap(style);

  // Si una tessel·la viva falla, es pregunta a l'API si respon abans d'avisar
  // de res. Una tessel·la sola pot fallar sense que l'API hagi caigut: el
  // primer minut després que Supabase es desperti, per exemple, quan alguna
  // consulta supera els 3 s que té de límit. Avisar-ne directament deixava
  // l'avís encès tota la sessió encara que la resta del mapa funcionés.
  //
  // Els errors de les fonts vives es reconeixen pel prefix 'live_' del seu
  // identificador a l'estil. Els AbortError no compten: canviar un filtre
  // (setTiles) cancel·la les tessel·les que s'estaven baixant, i MapLibre ho
  // notifica com un error.
  map.on('error', e => {
    if (/AbortError/.test(`${e.error?.name} ${e.error?.message}`)) return;
    if (e.sourceId?.startsWith('live_')) scheduleCheck();
  });

  map.on('load', () => {
    initPanel();
    initPoiPopups();

    // El clic al mapa: segons el mode, llança una consulta o no fa res
    // (en mode 'none' el clic el recull la capa de punts, a layer-pois.js).
    map.on('click', e => {
      if (state.mode === 'nearest') return queryNearest(e.lngLat);
      if (state.mode === 'radius')  return queryRadius(e.lngLat);
    });

    checkApi();
  });
}

/**
 * Comprova que l'API respon demanant-li les metadades del conjunt de dades.
 *
 * Si respon, treu l'avís (si n'hi havia). Si no, l'ensenya i hi torna al cap
 * de 30 s: quan Supabase es desperta, l'avís desapareix sol.
 */
async function checkApi() {
  try {
    await fetchDatasetInfo();
    setStatus('');
  } catch {
    setStatus('status.liveDown');
    scheduleCheck(30000);
  }
}

/** Una sola comprovació pendent alhora, per molts errors que arribin junts. */
let checkTimer = null;
function scheduleCheck(ms = 1500) {
  if (checkTimer) return;
  checkTimer = setTimeout(() => { checkTimer = null; checkApi(); }, ms);
}

start();
