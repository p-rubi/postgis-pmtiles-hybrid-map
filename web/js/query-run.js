// query-run.js — les dues consultes en viu contra PostGIS.
//
// Totes dues tenen la mateixa forma, i val la pena veure-la un cop:
//   1. avisar que s'està consultant
//   2. cridar rpc(), que torna la resposta i el temps total
//   3. dibuixar el resultat al mapa i escriure'l al panell
//   4. si el servidor es queixa, ensenyar el seu missatge en vermell
//
// El pas 4 és deliberat: les funcions SQL tornen missatges pensats per llegir
// ("El punt és fora de l'àmbit"), no codis. Un clic fora de l'àmbit ho mostra.
// PENDENT: aquests missatges surten de PostGIS sempre en català. Quan hi hagi
// més d'un idioma, sql/functions/030_live_queries.sql ha de portar un token
// estable al DETAIL de cada RAISE i aquí s'ha de traduir per token, amb el
// text del servidor com a recurs si el token no es reconeix.
//
// Totes dues segueixen el filtre del bloc 1 (subcategoria, o categoria, o
// tots els serveis): el que es veu al mapa, el que es busca i el que es compta
// són sempre el mateix conjunt de punts.
//
// Aquí és on es veu que la base de dades ANALITZA, i no només serveix dades:
// el càlcul de proximitat i el recompte per categories els fa PostGIS.

import { $, esc, fmtM, fmtN } from './utils.js';
import { t } from './i18n.js';
import { label } from './taxonomy.js';
import { rpc } from './api.js';
import { state } from './state.js';
import { map } from './map.js';
import { results, clearQuery, addRankMarker, rememberClick, getLastClick } from './query-modes.js';

/**
 * El filtre del bloc 1 tal com l'esperen les funcions SQL: si hi ha
 * subcategoria, mana ella; la categoria només s'envia si no n'hi ha. Els
 * valors buits no viatgen (els treu rpc()).
 */
const filter = () => ({ subcategory: state.sub, category: state.sub ? '' : state.cat });

/** El nom del filtre per als textos, o null si són tots els serveis. */
const filterLabel = () => state.sub ? label(state.sub) : state.cat ? label(state.cat) : null;

/**
 * Cada consulta rep un número. Si en surt una de nova abans que torni
 * l'anterior (en moure el radi, per exemple), la resposta vella es descarta:
 * sense això, una resposta lenta podria arribar l'última i trepitjar la bona.
 */
let seq = 0;

/**
 * El peu de cada resultat: temps de PostGIS contra temps total.
 *
 * La diferència entre els dos números és la xarxa. Ensenyar-los junts deixa
 * clar què costa la consulta i què costa arribar fins al servidor.
 */
const timing = (serverMs, totalMs) =>
  `<div class="qtime">${esc(t('results.timing',
    { server: serverMs, total: Math.round(totalMs) }))}</div>`;

/**
 * Capçalera de la targeta de resultats: el títol i una línia secundària amb
 * el filtre. Tots dos textos ja escapats. Per esborrar el resultat hi ha el
 * botó del costat dels modes (ui.js).
 */
const head = (title, sub) =>
  `<div class="rhead"><b>${title}</b></div><div class="rsub">${sub}</div>`;

/** Mostra l'error d'una consulta amb el missatge que ha donat el servidor. */
const showError = e => results(`<span class="err">${esc(e.message)}</span>`);

/**
 * Mode "Més propers": els N serveis del tipus triat més a prop d'un punt.
 *
 * La funció nearest_services fa servir l'índex espacial amb l'operador <->,
 * que li deixa aturar-se en trobar els N primers sense mesurar la distància
 * de tots els punts de l'àmbit.
 *
 * El dibuix són tres coses: el punt on s'ha fet clic, una línia cap a cada
 * resultat i un marcador numerat a sobre de cadascun. Les línies i el punt
 * van a la font 'query' amb una propietat 'kind' que diu a quina capa de
 * l'estil pertoquen (vegeu les capes q-* de style/basemap.json).
 */
export async function queryNearest(lngLat) {
  const my = ++seq;
  const what = filterLabel();
  rememberClick(lngLat);
  results(`<span class="muted">${esc(t('results.querying'))}</span>`);
  try {
    const { data, ms } = await rpc('nearest_services', {
      lon: lngLat.lng.toFixed(6), lat: lngLat.lat.toFixed(6),
      ...filter(), n: $('nearest-n').dataset.value
    });
    if (my !== seq) return;

    clearQuery();
    rememberClick(lngLat);
    const feats = data.features;
    map.getSource('query').setData({ type: 'FeatureCollection', features: [
      { type:'Feature', properties:{ kind:'origin' },
        geometry:{ type:'Point', coordinates: data.origin } },
      ...feats.map(f => ({ type:'Feature', properties:{ kind:'link' },
        geometry:{ type:'LineString', coordinates: [data.origin, f.geometry.coordinates] } }))
    ]});
    feats.forEach(f => addRankMarker(f.geometry.coordinates, f.properties.rank));

    // Cada <li class="hit"> porta les coordenades i el número: ui.js els fa
    // servir per volar-hi i ressaltar-ne el marcador quan s'hi fa clic. El
    // número el posa el CSS (un comptador), el nom va al mig i la distància
    // a la dreta. El tipus de cada resultat només es diu si no és ja al títol.
    results(
      head(esc(t('results.nearestTitle')), esc(what || t('results.allServices'))) +
      (feats.length
        ? `<ol>${feats.map(f => {
            const p = f.properties;
            return `<li class="hit" data-rank="${p.rank}" data-lon="${f.geometry.coordinates[0]}" ` +
                   `data-lat="${f.geometry.coordinates[1]}">` +
                   `<span>${esc(p.name || t('poi.noName'))}</span>` +
                   `<span class="d">${fmtM(p.dist_m)}</span>` +
                   // L'etiqueta surt del codi i no del label que torna el
                   // servidor: la base respon sempre en un sol idioma.
                   (state.sub ? '' : `<small>${esc(label(p.subcategory))}</small>`) +
                   `</li>`;
          }).join('')}</ol>`
        : `<div class="muted">${esc(t('results.none'))}</div>`) +
      timing(data.query_ms, ms));
  } catch (e) {
    if (my === seq) showError(e);
  }
}

/**
 * Mode "Resum en un radi": què hi ha dins d'un cercle al voltant del clic.
 *
 * El cercle també el dibuixa PostGIS (torna el polígon a data.area): així el
 * que es veu és exactament la mateixa geometria amb què s'ha comptat, i no una
 * aproximació feta al navegador.
 *
 * El desglossament arriba ja agrupat per categoria i subcategoria: l'agregació
 * és una consulta SQL, no un bucle al client. Es mostra plegat, una línia per
 * categoria; cadascuna es desplega fins a les subcategories. Amb una
 * subcategoria triada ja no hi ha res a desplegar i surt una sola línia.
 */
export async function queryRadius(lngLat) {
  const my = ++seq;
  const radius = +$('q-radius').value;
  const what = filterLabel();
  rememberClick(lngLat);
  results(`<span class="muted">${esc(t('results.querying'))}</span>`);
  try {
    const { data, ms } = await rpc('radius_summary', {
      lon: lngLat.lng.toFixed(6), lat: lngLat.lat.toFixed(6), radius_m: radius, ...filter()
    });
    if (my !== seq) return;

    clearQuery();
    rememberClick(lngLat);
    map.getSource('query').setData({ type: 'FeatureCollection', features: [
      { type:'Feature', properties:{ kind:'area' }, geometry: data.area },
      { type:'Feature', properties:{ kind:'origin' },
        geometry:{ type:'Point', coordinates: data.origin } }
    ]});

    // Com a "Més propers": les etiquetes es resolen pel codi (label()) i no
    // pel label que ve del servidor, que sempre és en el mateix idioma.
    const dot = c => `<span class="dot" style="background:${esc(c.color)}"></span>`;
    const breakdown = data.by_category.map(c => state.sub
      ? c.subcategories.map(s =>
          `<div class="cat">${dot(c)}${esc(label(s.code))}<span class="n">${fmtN(s.n)}</span></div>`).join('')
      : `<details class="cat"><summary>${dot(c)}${esc(label(c.code))}<span class="n">${fmtN(c.n)}</span></summary>` +
        `<ul>${c.subcategories.map(s =>
          `<li><span>${esc(label(s.code))}</span><span class="n">${fmtN(s.n)}</span></li>`).join('')}</ul></details>`
    ).join('');

    results(
      head(esc(t('results.radiusTitle', { radius: fmtM(data.radius_m) })),
           esc(what || t('results.allServices'))) +
      `<div class="kpis">` +
        `<div><b>${fmtN(data.services)}</b>${esc(t('results.services'))}</div>` +
        `<div><b>${fmtN(data.buildings)}</b>${esc(t('results.buildings'))}</div>` +
      `</div>` +
      (data.services
        ? breakdown
        : `<div class="muted">${esc(t('results.noneInRadius'))}</div>`) +
      timing(data.query_ms, ms));
  } catch (e) {
    if (my === seq) showError(e);
  }
}

/**
 * Torna a fer l'última consulta, des del mateix punt, amb els controls
 * actuals. La crida ui.js quan canvia el filtre, el radi o el nombre de
 * resultats: el que hi ha al panell ha de respondre sempre al que està triat.
 */
export function rerunQuery() {
  const lngLat = getLastClick();
  if (!lngLat) return;
  if (state.mode === 'nearest') queryNearest(lngLat);
  if (state.mode === 'radius')  queryRadius(lngLat);
}
