// es.js — todos los textos del visor en castellano.
//
// Mismas claves que ca.js, que es la referencia. Las reglas están explicadas
// allí; `make i18n-check` comprueba que los tres diccionarios cuadran.

export default {

  // ------------------------------------------------------- barra superior
  'app.docTitle':        'Mapa de servicios de Barcelona',
  'app.title':           'Mapa de servicios de Barcelona',
  'a11y.lang':           'Idioma',
  'a11y.repo':           'Código fuente en GitHub',
  'a11y.panelCollapse':  'Ocultar el panel',
  'a11y.panelExpand':    'Mostrar el panel',

  'a11y.activeLayers':   'Hay filtros activos en este bloque',
  'a11y.activeAnalysis': 'Hay un análisis activo en el mapa',

  // ---------------------------------------------------------------- capas
  'block1.title':        'Capas',
  'block1.basemap':      'Mapa base',
  'block1.roads':        'Calles',
  'block1.buildings':    'Edificios',
  'block1.landuse':      'Usos del suelo',
  'block1.water':        'Agua',
  'block1.buildingsLocked': 'Necesaria mientras la accesibilidad está activa',
  'block1.pois':         'Servicios',
  'block1.category':     'Categoría',
  'block1.subcategory':  'Subcategoría',
  'block1.allCats':      'Todas las categorías',
  'block1.allSubs':      'Todas las subcategorías',
  'a11y.tipPois':        '¿De dónde salen los servicios?',

  // ------------------------------------------------------------- análisis
  'block2.title':        'Análisis',
  'block2.on':           'Servicio analizado: {name}',
  'block2.pick':         'Elige una subcategoría en Capas para analizarla.',
  'block2.access':       'Accesibilidad de los edificios',
  'block2.threshold':    'Umbral',
  'block2.influence':    'Área de influencia',
  'block2.radius':       'Radio',
  'a11y.tipAnalysis':    '¿Cómo se calcula el análisis?',

  'legend.lte':          '≤ {v}',
  'legend.gt':           '> {v}',
  'legend.noData':       'Sin dato: no hay ningún servicio de este tipo',

  // ------------------------------------------------------------ consultas
  'block3.title':        'Consultas',
  'block3.nearest':      'Más cercanos',
  'block3.radius':       'Resumen en un radio',
  'block3.results':      'Resultados',
  'block3.radiusLabel':  'Radio',
  'block3.clear':        'Borrar la consulta',
  'a11y.tipQueries':     '¿Cómo funcionan las consultas?',

  'block3.note.none':    'Elige una consulta y haz clic en el mapa.',
  'block3.note.nearest': 'Haz clic en el mapa para encontrar los servicios más cercanos.',
  'block3.note.radius':  'Haz clic en el mapa para ver qué hay dentro del radio.',

  // ----------------------------------------------------------- resultados
  'results.querying':       'Consultando…',
  'results.allServices':    'Todos los servicios',
  'results.nearestTitle':   'Más cercanos',
  'results.none':           'Ningún resultado.',
  'results.radiusTitle':    'Radio de {radius}',
  'results.services':       'servicios',
  'results.buildings':      'edificios',
  'results.noneInRadius':   'Ningún servicio dentro del radio.',
  'results.timing':         'Tiempo de consulta: {server} ms ({total} ms con la red)',

  // ------------------------------------------------- ficha de un punto (POI)
  'poi.noName':          '(sin nombre)',
  'poi.osmLink':         'Ver en OpenStreetMap',

  // ---------------------------------------------------------------- avisos
  'status.liveDown':     'Ahora mismo no se pueden cargar los servicios ni las consultas. El mapa base funciona igualmente.',

  // ------------------------------------------------- ayuda: servicios
  'tip.pois.head':       'Datos de OpenStreetMap',
  'tip.pois.p1':         'Los servicios provienen de OpenStreetMap y están clasificados en categorías '
                       + 'y subcategorías propias de este proyecto. Todo lo que se dibuja, se filtra '
                       + 'y se consulta es del término municipal de Barcelona.',
  'tip.pois.p2':         'De lejos, los puntos cercanos se agrupan y cada círculo dice cuántos hay; un '
                       + 'clic acerca el mapa. Más de cerca, o con una subcategoría elegida, se ven '
                       + 'uno a uno.',
  'tip.pois.p3':         'OpenStreetMap es un mapa colaborativo, no cartografía oficial: los datos '
                       + 'pueden estar incompletos. Los límites administrativos son del ICGC.',

  // -------------------------------------------------- ayuda: análisis
  'tip.analysis.head':   'Análisis de la subcategoría elegida',
  'tip.analysis.p1_html':'<b>Accesibilidad:</b> cada edificio se pinta según la distancia al servicio '
                       + 'más cercano. Está precalculada y viaja dentro del fichero de teselas: mover '
                       + 'el umbral no hace ninguna petición al servidor.',
  'tip.analysis.p2_html':'<b>Área de influencia:</b> la zona a menos del radio elegido de algún '
                       + 'servicio. La sirve la base de datos en cada petición.',
  'tip.analysis.p3':     'Distancias en línea recta, no por las calles. Sólo cuentan los edificios '
                       + 'mapeados en OpenStreetMap.',

  // ------------------------------------------------- ayuda: consultas
  'tip.queries.head':    'Consultas en tiempo real',
  'tip.queries.intro':   'Cada clic en el mapa ejecuta una consulta a PostGIS con el filtro de Capas. '
                       + 'Bajo el resultado se muestra cuánto ha tardado.',
  'tip.queries.nearest.title': 'Más cercanos',
  'tip.queries.nearest.desc':  'Los servicios más cercanos al punto, ordenados por distancia.',
  'tip.queries.radius.title':  'Resumen en un radio',
  'tip.queries.radius.desc':   'Cuántos servicios y edificios hay dentro del círculo, por categorías.',
  'tip.queries.outro':   'Vuelve a pulsar el botón activo para desactivar la consulta.'
};
