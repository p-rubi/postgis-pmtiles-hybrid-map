// ui.js — el panell de l'esquerra.
//
// Aquí hi ha tot el que toca el DOM del panell: omplir els selectors, activar
// i desactivar controls, i connectar cada control amb la funció que li toca.
// Cap altre mòdul escolta esdeveniments del panell.
//
// La regla que ho ordena tot: el panell no dibuixa res ell mateix. Quan
// l'usuari canvia alguna cosa, s'actualitza l'estat (state.js) i es demana a
// les capes que es refresquin. Així només hi ha un camí possible:
//
//   control del panell → state → refresh de les capes
//
// Això és el que fa que canviar de categoria, marcar una casella o moure el
// llindar no es trepitgin entre ells.
//
// Els textos surten del diccionari (i18n.js): el marcatge amb data-i18n el
// tradueix applyTranslations(), i el que es genera aquí, t(). Canviar
// d'idioma no refà el panell, només els textos i el que no és marcatge.

import { $, esc, fmtM, fmtN } from './utils.js';
import { t, applyTranslations, setLang, getLang, LANGS } from './i18n.js';
import { CATEGORIES, subsOf, label } from './taxonomy.js';
import { state, isAnalysable } from './state.js';
import { map } from './map.js';
import { refreshPois } from './layer-pois.js';
import { refreshAccessibility, dragThreshold } from './layer-accessibility.js';
import { refreshInfluence } from './layer-influence.js';
import { initBasemapToggles } from './layer-basemap.js';
import { setMode, refreshModeNote, highlightRank, getLastClick } from './query-modes.js';
import { rerunQuery } from './query-run.js';

/**
 * Avís a dalt del panell, o cap avís amb una clau buida.
 *
 * Es desa la CLAU i no el text: si l'usuari canvia d'idioma amb l'avís a la
 * vista, s'ha de tornar a escriure en el nou (initLangRefresh).
 *
 * L'únic avís que hi ha és el de l'API caiguda. El visor està fet perquè la
 * cartografia base i l'accessibilitat funcionin sense servidor (són
 * PMTiles); si Supabase no respon, només cauen els serveis i les consultes, i
 * cal dir-ho en comptes de deixar l'usuari mirant un mapa que sembla
 * incomplet.
 */
let statusKey = '';
const drawStatus = () => {
  $('status').textContent = statusKey ? t(statusKey) : '';
  $('status').hidden = !statusKey;
};
export const setStatus = key => { statusKey = key; drawStatus(); };

/**
 * Omple el selector de categories amb el recompte de punts de cadascuna.
 * Els selectors no porten etiqueta visible: la primera opció ja diu què són.
 */
function fillCategories() {
  $('sel-cat').innerHTML = `<option value="">${esc(t('block1.allCats'))}</option>` +
    CATEGORIES.map(c => `<option value="${esc(c.code)}">${esc(label(c.code))} (${fmtN(c.n)})</option>`).join('');
  $('sel-cat').value = state.cat;
}

/**
 * Omple el selector de subcategories amb les de la categoria triada. Sense
 * categoria queda desactivat, i la seva primera opció fa d'etiqueta.
 */
function fillSubcategories() {
  const subs = state.cat ? subsOf(state.cat) : [];
  $('sel-sub').disabled = !state.cat;
  $('sel-sub').innerHTML = `<option value="">${esc(t(state.cat ? 'block1.allSubs' : 'block1.subcategory'))}</option>` +
    subs.map(s => `<option value="${esc(s.code)}">${esc(label(s.code))} (${fmtN(s.n)})</option>`).join('');
  $('sel-sub').value = state.sub;
}

/**
 * Encén el punt de la capçalera dels blocs que tenen alguna cosa activa.
 *
 * PER QUÈ: els blocs 1 i 2 es poden plegar amb els seus controls fent efecte
 * sobre el mapa. Plegats, l'usuari veu un mapa filtrat o pintat i no té a la
 * vista què ho provoca. El punt ho diu sense haver d'obrir el bloc (el bloc 3
 * no el necessita: plegar-lo desactiva la consulta).
 */
function updateSectionFlags() {
  const filtered = !!state.cat || !!state.sub || !$('c-pois').checked ||
                   ['c-roads', 'c-buildings', 'c-landuse', 'c-water'].some(id => !$(id).checked);
  const analysing = $('c-access').checked || $('c-infl').checked;
  $('blk-layers').querySelector('.act').classList.toggle('on', filtered);
  $('blk-analysis').querySelector('.act').classList.toggle('on', analysing);
}

/**
 * Posa al dia tot el que depèn de la selecció: el text d'ajuda, els controls
 * d'anàlisi, les tres capes i, si n'hi ha, el resultat de la consulta, que
 * s'ha de refer perquè segueix el mateix filtre.
 *
 * L'anàlisi (bloc 2) sempre és d'una subcategoria concreta. Sense cap de
 * triada, les caselles i els seus controls es desactiven I es desmarquen:
 * deixar-les marcades però sense efecte seria pitjor que apagar-les.
 */
function applySelection() {
  const ok = isAnalysable();

  $('an-note').textContent = ok
    ? t('block2.on', { name: label(state.sub) })
    : t('block2.pick');

  for (const id of ['access', 'infl']) {
    $(`c-${id}`).disabled = !ok;
    $(`lbl-${id}`).classList.toggle('off', !ok);
    $(`ctl-${id}`).classList.toggle('off', !ok);
    $(`ctl-${id}`).querySelectorAll('input, select, button').forEach(el => { el.disabled = !ok; });
    if (!ok) $(`c-${id}`).checked = false;
  }

  refreshPois();
  refreshInfluence();
  refreshAccessibility();
  updateSectionFlags();
  rerunQuery();
}

/**
 * Mesura el lloc reservat per a la barra de desplaçament i el desa a --sbw.
 *
 * PER QUÈ: el panell reserva sempre el lloc de la barra (scrollbar-gutter a
 * app.css), perquè el contingut no s'estreti quan apareix en allargar-se el
 * panell amb un resultat. Aquest lloc es descompta del marge de la dreta, i
 * per això cal saber quant fa: a Windows i Linux uns pocs píxels, i a macOS
 * o en un mòbil 0, perquè la barra se superposa al contingut.
 *
 * Es mesura sobre el panell mateix (amplada total menys l'interior i les
 * vores), que és exactament el lloc reservat. Plegat no es pot mesurar, i per
 * això es torna a fer cada cop que es desplega.
 */
function measureScrollbar() {
  const p = $('panel');
  if (p.classList.contains('collapsed')) return;
  const cs = getComputedStyle(p);
  const w = p.offsetWidth - p.clientWidth - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth);
  document.documentElement.style.setProperty('--sbw', `${Math.max(0, w)}px`);
}

/**
 * El botó de la barra superior plega i desplega el panell.
 *
 * En una pantalla estreta el panell és un full que puja des de baix (app.css)
 * i arrenca plegat: desplegat, taparia el mapa. Quan una consulta dona
 * resultat, el panell es desplega sol i el porta a la vista: si no, en un
 * mòbil, on l'usuari el plega per poder clicar el mapa, el resultat quedaria
 * amagat. I si en desplegar-se el full tapa el punt consultat, el mapa es
 * desplaça fins a deixar-lo a la part visible.
 */
function initPanelToggle() {
  const panel = $('panel'), btn = $('panel-toggle');
  const narrow = matchMedia('(max-width: 700px)');
  const setOpen = open => {
    panel.classList.toggle('collapsed', !open);
    btn.setAttribute('aria-expanded', open);
    btn.title = t(open ? 'a11y.panelCollapse' : 'a11y.panelExpand');
    btn.setAttribute('aria-label', btn.title);
    if (open) measureScrollbar();
  };
  setOpen(!narrow.matches);
  btn.addEventListener('click', () => setOpen(panel.classList.contains('collapsed')));
  // En canviar d'idioma el títol del botó s'ha de refer: no és marcatge amb
  // data-i18n perquè depèn de si el panell està plegat o no.
  document.addEventListener('geodb:lang', () => setOpen(!panel.classList.contains('collapsed')));

  document.addEventListener('geodb:results', () => {
    setOpen(true);
    $('results').scrollIntoView({ block: 'nearest' });
    const lngLat = getLastClick();
    if (!narrow.matches || !lngLat) return;
    const visible = map.getContainer().clientHeight - panel.offsetHeight;
    const y = map.project(lngLat).y;
    if (y > visible - 30) map.panBy([0, y - visible / 2]);
  });
}

/**
 * Globus d'ajuda dels botons (i).
 *
 * El text de cada botó és en un <template> d'index.html (data-tip en diu
 * l'id). Es mostra en un únic element #tip penjat del <body> i posicionat
 * amb `position: fixed`: dins del panell, que té scroll, quedaria retallat.
 * Surt en passar-hi el ratolí o amb el focus del teclat.
 *
 * El contingut es tradueix en el moment d'ensenyar-lo i no en carregar la
 * pàgina: els <template> no són al document viu, i applyTranslations() no hi
 * arriba sola.
 */
function initTooltips() {
  const tip = document.createElement('div');
  tip.id = 'tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.append(tip);

  const show = btn => {
    tip.replaceChildren(document.getElementById(btn.dataset.tip).content.cloneNode(true));
    applyTranslations(tip);
    tip.hidden = false;
    // A la dreta del botó; si no hi cap, a sota. Mai fora de la finestra.
    const r = btn.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = r.right + 10, top = r.top - 8;
    if (left + w > innerWidth - 8) { left = r.left - w / 2; top = r.bottom + 8; }
    tip.style.left = `${Math.max(8, Math.min(left, innerWidth - w - 8))}px`;
    tip.style.top  = `${Math.max(8, Math.min(top, innerHeight - h - 8))}px`;
  };
  const hide = () => { tip.hidden = true; };

  document.querySelectorAll('.info').forEach(btn => {
    btn.addEventListener('mouseenter', () => show(btn));
    btn.addEventListener('focus',      () => show(btn));
    btn.addEventListener('mouseleave', hide);
    btn.addEventListener('blur',       hide);
    // El botó és dins d'un <summary>: sense això, el clic plegaria o
    // desplegaria el bloc a més d'ensenyar l'ajuda.
    btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); show(btn); });
  });

  // El globus va amb position:fixed i no segueix el panell: si es fa scroll
  // amb el globus obert, quedaria surant damunt d'una altra cosa.
  $('panel').addEventListener('scroll', hide, { passive: true });
}

/**
 * El selector d'idioma de la barra superior.
 *
 * Es construeix a partir dels diccionaris carregats (i18n.js) i no d'una
 * llista escrita aquí: afegir un idioma és afegir-lo allà i prou. Amb un sol
 * idioma no es dibuixa cap botó, i un .lang buit no es veu (app.css).
 */
function initLangSwitch() {
  const box = $('lang');
  if (LANGS.length < 2) return;

  box.innerHTML = LANGS.map(code =>
    `<button type="button" data-lang="${esc(code)}" aria-pressed="false">` +
    `${esc(code.toUpperCase())}</button>`).join('');

  const mark = () => box.querySelectorAll('button').forEach(b => {
    const on = b.dataset.lang === getLang();
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });

  box.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn) setLang(btn.dataset.lang);
  });
  document.addEventListener('geodb:lang', mark);
  mark();
}

/**
 * Refà tot el que NO és marcatge quan es canvia d'idioma.
 *
 * applyTranslations() ja ha reescrit el que porta data-i18n. Queda el que
 * genera el codi: els dos selectors (que es refan sencers, i per això cal
 * tornar-hi a posar la selecció), la nota i la llegenda del bloc 2, la nota
 * del mode de consulta i el resultat que hi hagi a la vista.
 *
 * El resultat es refà repetint la consulta —ho fa applySelection()— i no
 * guardant-ne la resposta: és una petició de pocs mil·lisegons i estalvia
 * mantenir una còpia de l'última resposta només per a aquest cas.
 */
function initLangRefresh() {
  document.addEventListener('geodb:lang', () => {
    drawStatus();
    fillCategories();
    fillSubcategories();
    refreshModeNote();
    applySelection();   // nota del bloc 2, capes, llegenda i consulta
  });
}

/**
 * Un control segmentat d'opcions (el radi, el nombre de resultats).
 *
 * El valor triat viu a l'atribut data-value del contenidor, i és d'on el
 * llegeixen les capes i les consultes. El botó d'aquell valor es marca .on.
 */
function initSeg(id, onChange) {
  const box = $(id);
  const mark = () => box.querySelectorAll('button').forEach(b => {
    const on = b.dataset.value === box.dataset.value;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on);
  });
  box.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || btn.disabled || btn.dataset.value === box.dataset.value) return;
    box.dataset.value = btn.dataset.value;
    mark();
    onChange();
  });
  mark();
}

/**
 * Deixa el panell a punt: l'omple i connecta tots els controls.
 * La crida main.js un cop el mapa ja ha carregat l'estil.
 */
export function initPanel() {
  fillCategories();
  fillSubcategories();
  applySelection();

  initTooltips();
  initPanelToggle();
  initLangSwitch();
  initLangRefresh();

  // --- POIs: canviar de categoria reinicia la subcategoria -------------
  $('sel-cat').addEventListener('change', e => {
    state.cat = e.target.value;
    state.sub = '';
    fillSubcategories();
    applySelection();
  });
  $('sel-sub').addEventListener('change', e => {
    state.sub = e.target.value;
    applySelection();
  });

  // --- Capes i anàlisi: cada control crida només el que ha de canviar --
  // updateSectionFlags() va a tots els que poden deixar el mapa canviat amb
  // el seu bloc plegat.
  $('c-pois').addEventListener('change', () => { refreshPois(); updateSectionFlags(); });
  $('c-access').addEventListener('change', () => { refreshAccessibility(); updateSectionFlags(); });
  // 'input' i no 'change': el mapa es repinta mentre s'arrossega el control,
  // cosa que només és possible perquè no hi ha cap petició pel mig.
  $('threshold').addEventListener('input', dragThreshold);
  $('c-infl').addEventListener('change', () => { refreshInfluence(); updateSectionFlags(); });
  initSeg('radius', refreshInfluence);
  initBasemapToggles(updateSectionFlags);

  // --- Consultes espacials ----------------------------------------------
  // Cada botó és un interruptor: setMode() desactiva la consulta si ja era
  // l'activa. La crida inicial deixa escrita l'ajuda del mode "cap".
  setMode('none');
  document.querySelectorAll('#mode button')
    .forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  // El botó d'esborrar desactiva la consulta: treu el dibuix i el resultat, i
  // el clic torna a obrir la fitxa dels punts.
  $('q-clear').addEventListener('click', () => setMode('none'));
  // Plegar el bloc desactiva la consulta: si no, el clic al mapa seguiria
  // llançant consultes des d'uns controls que ja no es veuen. Als blocs 1 i 2
  // no s'hi fa: el que hi ha actiu és estat del mapa, no del clic, i el punt
  // de la capçalera ja avisa que hi és.
  $('blk-queries').addEventListener('toggle', e => {
    if (!e.target.open && state.mode !== 'none') setMode(state.mode);
  });

  // El radi s'escriu mentre s'arrossega, però la consulta es refà en deixar
  // anar ('change'): una petició per posició intermèdia no serviria de res.
  $('q-radius').addEventListener('input', e => { $('q-radius-val').textContent = fmtM(+e.target.value); });
  $('q-radius').addEventListener('change', rerunQuery);
  initSeg('nearest-n', rerunQuery);

  // Clic sobre un resultat: hi vola i en ressalta el marcador. Les
  // coordenades i el número viatgen en atributs data-* que hi posa
  // query-run.js. S'escolta la targeta sencera i no cada element, perquè els
  // elements es refan a cada consulta i els seus escoltadors es perdrien.
  $('results').addEventListener('click', e => {
    const li = e.target.closest('li.hit');
    if (!li) return;
    map.flyTo({
      center: [+li.dataset.lon, +li.dataset.lat],
      zoom: Math.max(map.getZoom(), 16)   // acosta't, però no t'allunyis mai
    });
    highlightRank(li.dataset.rank);
  });
}
