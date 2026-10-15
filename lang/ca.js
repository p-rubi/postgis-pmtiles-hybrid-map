// ca.js — tots els textos del visor en català.
//
// Aquest fitxer és CONTINGUT, no codi: per això viu a web/lang/ i no a web/js/,
// igual que els colors viuen a web/style/ i la taxonomia a config/. Qui vulgui
// canviar una paraula del visor només ha de tocar aquí dins.
//
// REGLES
//   - Les claus són planes i amb espai de noms ('block2.access'), no objectes
//     imbricats: així es poden buscar amb grep i comparar entre idiomes.
//   - Els tres diccionaris (ca, es, en) han de tenir EXACTAMENT les mateixes
//     claus. `make i18n-check` ho comprova.
//   - {nom} és un forat que omple el codi. Si una clau en té, tots els idiomes
//     han de fer servir els mateixos.
//   - Les claus acabades en '_html' porten marcatge a dins i s'insereixen amb
//     innerHTML. La resta són text pla. Vegeu la nota de seguretat a i18n.js.
//   - Textos curts. El que cal explicar va als globus d'ajuda (tip.*), no al
//     panell.
//
// El català és l'idioma de referència: si una clau falta en un altre idioma,
// i18n.js cau aquí.

export default {

  // ------------------------------------------------------- barra superior
  'app.docTitle':        'Mapa de serveis de Barcelona',
  'app.title':           'Mapa de serveis de Barcelona',
  'a11y.lang':           'Idioma',
  'a11y.repo':           'Codi font a GitHub',
  'a11y.panelCollapse':  'Amaga el panell',
  'a11y.panelExpand':    'Mostra el panell',

  // Avís del punt de la capçalera d'un bloc plegat: diu per què el mapa no
  // està com l'usuari se l'esperava sense haver d'obrir el bloc.
  'a11y.activeLayers':   'Hi ha filtres actius en aquest bloc',
  'a11y.activeAnalysis': 'Hi ha una anàlisi activa al mapa',

  // ---------------------------------------------------------------- capes
  'block1.title':        'Capes',
  'block1.basemap':      'Mapa base',
  'block1.roads':        'Carrers',
  'block1.buildings':    'Edificis',
  'block1.landuse':      'Usos del sòl',
  'block1.water':        'Aigua',
  'block1.buildingsLocked': "Necessària mentre l'accessibilitat és activa",
  'block1.pois':         'Serveis',
  'block1.category':     'Categoria',
  'block1.subcategory':  'Subcategoria',
  'block1.allCats':      'Totes les categories',
  'block1.allSubs':      'Totes les subcategories',
  'a11y.tipPois':        "D'on surten els serveis?",

  // -------------------------------------------------------------- anàlisi
  'block2.title':        'Anàlisi',
  'block2.on':           'Servei analitzat: {name}',
  'block2.pick':         'Tria una subcategoria a Capes per analitzar-la.',
  'block2.access':       'Accessibilitat dels edificis',
  'block2.threshold':    'Llindar',
  'block2.influence':    "Àrea d'influència",
  'block2.radius':       'Radi',
  'a11y.tipAnalysis':    "Com es calcula l'anàlisi?",

  // Llegenda de l'accessibilitat (layer-accessibility.js)
  'legend.lte':          '≤ {v}',
  'legend.gt':           '> {v}',
  'legend.noData':       "Sense dada: no hi ha cap servei d'aquest tipus",

  // ------------------------------------------------------------ consultes
  'block3.title':        'Consultes',
  'block3.nearest':      'Més propers',
  'block3.radius':       'Resum en un radi',
  'block3.results':      'Resultats',
  'block3.radiusLabel':  'Radi',
  'block3.clear':        'Esborra la consulta',
  'a11y.tipQueries':     'Com funcionen les consultes?',

  'block3.note.none':    'Tria una consulta i fes clic al mapa.',
  'block3.note.nearest': 'Fes clic al mapa per trobar els serveis més propers.',
  'block3.note.radius':  'Fes clic al mapa per veure què hi ha dins del radi.',

  // ------------------------------------------------------------ resultats
  'results.querying':       'Consultant…',
  'results.allServices':    'Tots els serveis',
  'results.nearestTitle':   'Més propers',
  'results.none':           'Cap resultat.',
  'results.radiusTitle':    'Radi de {radius}',
  'results.services':       'serveis',
  'results.buildings':      'edificis',
  'results.noneInRadius':   'Cap servei dins del radi.',
  'results.timing':         'Temps de consulta: {server} ms ({total} ms amb la xarxa)',

  // -------------------------------------------------- fitxa d'un punt (POI)
  'poi.noName':          '(sense nom)',
  'poi.osmLink':         'Veure a OpenStreetMap',

  // ---------------------------------------------------------------- avisos
  'status.liveDown':     'Ara mateix no es poden carregar els serveis ni les consultes. El mapa base funciona igualment.',

  // ---------------------------------------------- globus d'ajuda: serveis
  'tip.pois.head':       "Dades d'OpenStreetMap",
  'tip.pois.p1':         "Els serveis provenen d'OpenStreetMap i estan classificats en categories i "
                       + "subcategories pròpies d'aquest projecte. Tot el que es dibuixa, es filtra i "
                       + 'es consulta és del terme municipal de Barcelona.',
  'tip.pois.p2':         "De lluny, els punts propers s'agrupen i cada cercle diu quants n'hi ha; un "
                       + 'clic hi apropa el mapa. De més a prop, o amb una subcategoria triada, es '
                       + 'veuen un per un.',
  'tip.pois.p3':         'OpenStreetMap és un mapa col·laboratiu, no cartografia oficial: les dades '
                       + "poden ser incompletes. Els límits administratius són de l'ICGC.",

  // ---------------------------------------------- globus d'ajuda: anàlisi
  'tip.analysis.head':   'Anàlisi de la subcategoria triada',
  'tip.analysis.p1_html':'<b>Accessibilitat:</b> cada edifici es pinta segons la distància al servei '
                       + 'més proper. Està precalculada i viatja dins del fitxer de tessel·les: moure '
                       + 'el llindar no fa cap petició al servidor.',
  'tip.analysis.p2_html':"<b>Àrea d'influència:</b> la zona a menys del radi triat d'algun servei. "
                       + 'La serveix la base de dades a cada petició.',
  'tip.analysis.p3':     'Distàncies en línia recta, no pels carrers. Només compten els edificis '
                       + 'mapats a OpenStreetMap.',

  // -------------------------------------------- globus d'ajuda: consultes
  'tip.queries.head':    'Consultes en temps real',
  'tip.queries.intro':   'Cada clic al mapa executa una consulta a PostGIS amb el filtre de Capes. '
                       + "Sota el resultat se'n mostra el temps.",
  'tip.queries.nearest.title': 'Més propers',
  'tip.queries.nearest.desc':  'Els serveis més propers al punt, ordenats per distància.',
  'tip.queries.radius.title':  'Resum en un radi',
  'tip.queries.radius.desc':   'Quants serveis i edificis hi ha dins del cercle, per categories.',
  'tip.queries.outro':   'Torna a clicar el botó actiu per desactivar la consulta.'
};
