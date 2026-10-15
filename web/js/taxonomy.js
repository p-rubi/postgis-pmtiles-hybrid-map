// taxonomy.js — tot el que sap el visor sobre la taxonomia de serveis.
//
// D'ON SURT: de `window.GEODB_CATEGORIES`, que escriu web/categories.js.
// Aquell fitxer el genera etl/web_config.sh llegint la vista api.categories,
// i s'incrusta a la pàgina en comptes de demanar-lo a l'API perquè els
// selectors han de funcionar encara que Supabase estigui pausat: la capa
// d'accessibilitat (PMTiles) no depèn del servidor.
//
// Cada categoria és un objecte:
//   { code, parent, label, label_es, label_en, color, sort, analysis, is_service, n }
//   parent    null = categoria de primer nivell; si no, el codi de la seva mare
//   label     l'etiqueta en català, que és la de referència
//   label_es  i label_en: les traduccions, que poden faltar
//   analysis  true = té capa d'accessibilitat i àrea d'influència precalculades
//   is_service true = és un servei a la població (i no, p. ex., una piscina privada)
//   n         nombre de punts d'interès del terme municipal
//
// Les etiquetes són a la base (config/categories.csv → osm.categories →
// api.categories) i no en un diccionari del visor: la taxonomia és dada, i
// partir-la en dos llocs seria demanar que se'n desincronitzin.

import { getLang } from './i18n.js';

const CATS = window.GEODB_CATEGORIES;

/** Índex codi → categoria, per no recórrer la llista cada cop. */
export const BY_CODE = Object.fromEntries(CATS.map(c => [c.code, c]));

/** Les categories de primer nivell que surten al selector (només serveis). */
export const CATEGORIES = CATS.filter(c => !c.parent && c.is_service);

/** Les subcategories d'una categoria, en l'ordre en què les dona la base. */
export const subsOf = cat => CATS.filter(c => c.parent === cat);

/**
 * L'etiqueta llegible d'un codi ('farmacia' → 'Farmàcia'), en l'idioma actiu.
 *
 * Si la traducció falta, cau al català, i si el codi no existeix, torna el
 * codi: val més veure 'farmacia' que un buit.
 *
 * Aquesta funció és també la que fa que les respostes de l'API siguin
 * agnòstiques de l'idioma: nearest_services i radius_summary retornen un
 * `label` en català, i el visor l'ignora i resol l'etiqueta pel `code`.
 */
export const label = code => {
  const c = BY_CODE[code];
  if (!c) return code;
  const lang = getLang();
  return (lang === 'ca' ? c.label : c[`label_${lang}`]) || c.label;
};

/** El color d'un codi, per als punts de les llistes de resultats. */
export const color = code => BY_CODE[code]?.color ?? '#9a9c92';

/**
 * Expressió MapLibre que dona color a una entitat segons la seva categoria.
 *
 * Es construeix un sol cop i es fa servir a tres capes (punts, àrea
 * d'influència i el seu contorn) a través del marcador {{color.category}}
 * de style/basemap.json. El resultat té aquesta forma:
 *   ['match', ['get','category'], 'salut','#ef4444', 'educacio','#3b82f6', …, '#9a9c92']
 * L'últim valor és el color per defecte quan la categoria no és cap de les llistades.
 */
export const catColorExpr = ['match', ['get', 'category'],
  ...CATEGORIES.flatMap(c => [c.code, c.color]), '#9a9c92'];
