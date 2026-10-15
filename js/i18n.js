// i18n.js — el mecanisme d'idiomes. Els TEXTOS són a web/lang/.
//
// Hi ha dues maneres d'obtenir un text traduït, i totes dues surten d'aquí:
//
//   1. Al marcatge: <span data-i18n="block1.roads">Xarxa viària</span>
//      applyTranslations() recorre el document i hi escriu el text de l'idioma
//      actiu. El text que hi ha a l'HTML és només el que es veu abans que
//      arrenqui el JavaScript; el que mana és el diccionari.
//
//   2. Al codi:    t('block2.on', { name: 'Farmàcia' })
//      Per als textos que es generen (resultats, llegenda, avisos).
//
// PER QUÈ UN DICCIONARI I NO TRES VISORS: el visor té estat viu —la posició
// al hash, la categoria triada, la consulta dibuixada— que una recàrrega
// perdria. I els PMTiles, que són 34 MB, són els mateixos en tots els idiomes.
//
// COM S'AFEGEIX UN IDIOMA: es copia web/lang/ca.js, es tradueix, s'importa
// aquí i s'afegeix a DICTS. El selector del panell apareix tot sol quan n'hi
// ha més d'un (ui.js el construeix a partir de LANGS).
//
// SEGURETAT: el diccionari és autoria nostra, i per això les claus acabades en
// '_html' es poden inserir amb innerHTML. Això NO val per a les dades: els
// noms, els horaris i les adreces vénen d'OpenStreetMap i han de passar per
// esc() abans d'entrar en cap text (vegeu utils.js). t() interpola els valors
// tal com els rep: qui crida és qui els ha d'escapar.

import ca from '../lang/ca.js';
import es from '../lang/es.js';
import en from '../lang/en.js';

/**
 * Els diccionaris carregats. Afegir-ne un idioma és afegir-lo aquí.
 *
 * Van com a imports estàtics i no com a import() dinàmic: els tres junts són
 * uns 25 KB, davant dels 34 MB de tessel·les. Carregar-los tots estalvia que
 * canviar d'idioma sigui una operació asíncrona que pugui fallar.
 */
const DICTS = { ca, es, en };

/** Els codis disponibles, en l'ordre en què surten al selector. */
export const LANGS = Object.keys(DICTS);

/** L'idioma de referència: el que s'ensenya per defecte i el que omple els forats. */
export const DEFAULT_LANG = 'ca';

/** On es recorda la tria de l'usuari entre visites. */
const STORAGE_KEY = 'geodb.lang';

let lang = DEFAULT_LANG;

/** El codi de l'idioma actiu ('ca'). El fan servir els formats de número. */
export const getLang = () => lang;

/**
 * El text d'una clau, amb els {forats} substituïts.
 *
 * Si la clau no és a l'idioma actiu, es busca en el de referència; si tampoc
 * hi és, es torna la clau mateixa. Així una traducció incompleta ensenya
 * text en català, i una clau mal escrita es veu a la pantalla en comptes de
 * deixar un buit silenciós.
 */
export function t(key, params) {
  const s = DICTS[lang]?.[key] ?? DICTS[DEFAULT_LANG][key] ?? key;
  return params
    ? s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? params[name] : m))
    : s;
}

/**
 * Escriu al document els textos de l'idioma actiu.
 *
 *   data-i18n            → textContent (text pla)
 *   data-i18n-html       → innerHTML   (només claus '_html', autoria nostra)
 *   data-i18n-title      → atribut title
 *   data-i18n-aria-label → atribut aria-label
 *
 * IMPORTANT: data-i18n substitueix TOT el contingut de l'element. Per això al
 * marcatge el text va sempre dins del seu propi <span> quan l'element porta
 * alguna altra cosa (una casella, el número del bloc, el botó d'ajuda).
 *
 * Es tradueix sobre els elements que ja hi ha, sense refer-los: així no es
 * perd ni l'estat obert/tancat dels <details> ni el focus del teclat.
 */
export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
  });
}

/**
 * Canvia d'idioma i avisa qui en depengui.
 *
 * L'esdeveniment 'geodb:lang' el recull ui.js, que és qui sap refer el que no
 * és marcatge: els dos selectors, la llegenda, la nota del mode i el resultat
 * de la consulta. Es fa amb un esdeveniment i no amb una crida directa perquè
 * i18n.js no ha de conèixer el panell.
 */
export function setLang(code) {
  if (!DICTS[code] || code === lang) return;
  lang = code;
  document.documentElement.lang = code;
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* mode privat */ }
  applyTranslations();
  document.dispatchEvent(new CustomEvent('geodb:lang'));
}

/**
 * Tria l'idioma d'arrencada i tradueix el document per primer cop.
 *
 * Ordre: el que l'usuari va triar l'última vegada, i si no, el de referència.
 * No es mira navigator.language a posta: el visor és d'un projecte en català
 * i el comportament ha de ser el mateix per a tothom que hi arriba.
 *
 * La crida main.js ABANS de construir el panell, perquè ui.js ja trobi els
 * textos posats.
 */
export function initI18n() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* mode privat */ }
  lang = DICTS[saved] ? saved : DEFAULT_LANG;
  document.documentElement.lang = lang;
  applyTranslations();
}
