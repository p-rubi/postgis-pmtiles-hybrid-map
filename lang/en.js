// en.js — every text of the viewer in English.
//
// Same keys as ca.js, which is the reference. The rules are explained there;
// `make i18n-check` checks that the three dictionaries match.

export default {

  // --------------------------------------------------------------- top bar
  'app.docTitle':        'Barcelona services map',
  'app.title':           'Barcelona services map',
  'a11y.lang':           'Language',
  'a11y.repo':           'Source code on GitHub',
  'a11y.panelCollapse':  'Hide the panel',
  'a11y.panelExpand':    'Show the panel',

  'a11y.activeLayers':   'Filters are active in this section',
  'a11y.activeAnalysis': 'An analysis is active on the map',

  // ---------------------------------------------------------------- layers
  'block1.title':        'Layers',
  'block1.basemap':      'Basemap',
  'block1.roads':        'Streets',
  'block1.buildings':    'Buildings',
  'block1.landuse':      'Land use',
  'block1.water':        'Water',
  'block1.buildingsLocked': 'Required while accessibility is on',
  'block1.pois':         'Services',
  'block1.category':     'Category',
  'block1.subcategory':  'Subcategory',
  'block1.allCats':      'All categories',
  'block1.allSubs':      'All subcategories',
  'a11y.tipPois':        'Where do the services come from?',

  // -------------------------------------------------------------- analysis
  'block2.title':        'Analysis',
  'block2.on':           'Service analysed: {name}',
  'block2.pick':         'Pick a subcategory in Layers to analyse it.',
  'block2.access':       'Building accessibility',
  'block2.threshold':    'Threshold',
  'block2.influence':    'Catchment area',
  'block2.radius':       'Radius',
  'a11y.tipAnalysis':    'How is the analysis calculated?',

  'legend.lte':          '≤ {v}',
  'legend.gt':           '> {v}',
  'legend.noData':       'No data: there is no service of this type',

  // --------------------------------------------------------------- queries
  'block3.title':        'Queries',
  'block3.nearest':      'Nearest',
  'block3.radius':       'Summary in a radius',
  'block3.results':      'Results',
  'block3.radiusLabel':  'Radius',
  'block3.clear':        'Clear the query',
  'a11y.tipQueries':     'How do the queries work?',

  'block3.note.none':    'Pick a query and click on the map.',
  'block3.note.nearest': 'Click on the map to find the nearest services.',
  'block3.note.radius':  'Click on the map to see what lies within the radius.',

  // --------------------------------------------------------------- results
  'results.querying':       'Querying…',
  'results.allServices':    'All services',
  'results.nearestTitle':   'Nearest',
  'results.none':           'No results.',
  'results.radiusTitle':    'Radius of {radius}',
  'results.services':       'services',
  'results.buildings':      'buildings',
  'results.noneInRadius':   'No services within the radius.',
  'results.timing':         'Query time: {server} ms ({total} ms with network)',

  // ------------------------------------------------------ point details (POI)
  'poi.noName':          '(unnamed)',
  'poi.osmLink':         'View on OpenStreetMap',

  // ---------------------------------------------------------------- alerts
  'status.liveDown':     "Services and queries can't be loaded right now. The basemap still works.",

  // ------------------------------------------------------ help: services
  'tip.pois.head':       'OpenStreetMap data',
  'tip.pois.p1':         'The services come from OpenStreetMap and are sorted into categories and '
                       + 'subcategories specific to this project. Everything drawn, filtered and '
                       + 'queried belongs to the municipality of Barcelona.',
  'tip.pois.p2':         'From afar, nearby points are grouped and each circle says how many there '
                       + 'are; a click zooms in. Closer in, or with a subcategory selected, they '
                       + 'appear one by one.',
  'tip.pois.p3':         'OpenStreetMap is a collaborative map, not official cartography: the data '
                       + 'may be incomplete. The administrative boundaries come from the ICGC.',

  // ------------------------------------------------------ help: analysis
  'tip.analysis.head':   'Analysis of the selected subcategory',
  'tip.analysis.p1_html':'<b>Accessibility:</b> each building is coloured by its distance to the '
                       + 'nearest service. It is precomputed and travels inside the tile file: '
                       + 'moving the threshold makes no request to the server.',
  'tip.analysis.p2_html':'<b>Catchment area:</b> the area within the selected radius of any service. '
                       + 'The database serves it on every request.',
  'tip.analysis.p3':     'Straight-line distances, not along the streets. Only buildings mapped in '
                       + 'OpenStreetMap are counted.',

  // ------------------------------------------------------- help: queries
  'tip.queries.head':    'Live queries',
  'tip.queries.intro':   'Every click on the map runs a PostGIS query with the filter from Layers. '
                       + 'The time it took is shown under the result.',
  'tip.queries.nearest.title': 'Nearest',
  'tip.queries.nearest.desc':  'The services nearest to the point, ordered by distance.',
  'tip.queries.radius.title':  'Summary in a radius',
  'tip.queries.radius.desc':   'How many services and buildings lie within the circle, by category.',
  'tip.queries.outro':   'Click the active button again to turn the query off.'
};
