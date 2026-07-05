import type { Station, OperatorInfo, Edge } from './types'

// ---------------------------------------------------------------------------
// Stations (city-level nodes across the EU + UK). Coordinates are approximate
// main-station coordinates, used for distance & map positioning.
// ---------------------------------------------------------------------------
export const STATIONS: Station[] = [
  // Netherlands
  { id: 'amsterdam', name: 'Amsterdam Centraal', city: 'Amsterdam', country: 'NL', lat: 52.379, lon: 4.9 },
  { id: 'rotterdam', name: 'Rotterdam Centraal', city: 'Rotterdam', country: 'NL', lat: 51.925, lon: 4.469 },
  { id: 'utrecht', name: 'Utrecht Centraal', city: 'Utrecht', country: 'NL', lat: 52.089, lon: 5.11 },
  { id: 'denhaag', name: 'Den Haag Centraal', city: 'Den Haag', country: 'NL', lat: 52.08, lon: 4.324 },
  { id: 'eindhoven', name: 'Eindhoven Centraal', city: 'Eindhoven', country: 'NL', lat: 51.443, lon: 5.481 },
  { id: 'arnhem', name: 'Arnhem Centraal', city: 'Arnhem', country: 'NL', lat: 51.985, lon: 5.9 },
  { id: 'breda', name: 'Breda', city: 'Breda', country: 'NL', lat: 51.595, lon: 4.78 },
  // Belgium
  { id: 'brussels', name: 'Brussel-Zuid / Bruxelles-Midi', city: 'Brussel', country: 'BE', lat: 50.836, lon: 4.336 },
  { id: 'antwerp', name: 'Antwerpen-Centraal', city: 'Antwerpen', country: 'BE', lat: 51.217, lon: 4.421 },
  // UK
  { id: 'london', name: 'London St Pancras Intl', city: 'Londen', country: 'GB', lat: 51.532, lon: -0.126 },
  // France
  { id: 'paris', name: 'Paris (Nord / Lyon / Est)', city: 'Parijs', country: 'FR', lat: 48.88, lon: 2.355 },
  { id: 'lille', name: 'Lille Europe', city: 'Lille', country: 'FR', lat: 50.639, lon: 3.076 },
  { id: 'lyon', name: 'Lyon Part-Dieu', city: 'Lyon', country: 'FR', lat: 45.76, lon: 4.859 },
  { id: 'marseille', name: 'Marseille St-Charles', city: 'Marseille', country: 'FR', lat: 43.303, lon: 5.38 },
  { id: 'nice', name: 'Nice-Ville', city: 'Nice', country: 'FR', lat: 43.705, lon: 7.262 },
  { id: 'strasbourg', name: 'Strasbourg', city: 'Straatsburg', country: 'FR', lat: 48.585, lon: 7.734 },
  { id: 'montpellier', name: 'Montpellier Sud', city: 'Montpellier', country: 'FR', lat: 43.598, lon: 3.88 },
  { id: 'bordeaux', name: 'Bordeaux St-Jean', city: 'Bordeaux', country: 'FR', lat: 44.826, lon: -0.556 },
  // Germany
  { id: 'cologne', name: 'Köln Hbf', city: 'Keulen', country: 'DE', lat: 50.943, lon: 6.958 },
  { id: 'frankfurt', name: 'Frankfurt (Main) Hbf', city: 'Frankfurt', country: 'DE', lat: 50.107, lon: 8.664 },
  { id: 'mannheim', name: 'Mannheim Hbf', city: 'Mannheim', country: 'DE', lat: 49.479, lon: 8.469 },
  { id: 'karlsruhe', name: 'Karlsruhe Hbf', city: 'Karlsruhe', country: 'DE', lat: 48.994, lon: 8.4 },
  { id: 'freiburg', name: 'Freiburg Hbf', city: 'Freiburg', country: 'DE', lat: 47.997, lon: 7.841 },
  { id: 'stuttgart', name: 'Stuttgart Hbf', city: 'Stuttgart', country: 'DE', lat: 48.784, lon: 9.182 },
  { id: 'munich', name: 'München Hbf', city: 'München', country: 'DE', lat: 48.14, lon: 11.558 },
  { id: 'berlin', name: 'Berlin Hbf', city: 'Berlijn', country: 'DE', lat: 52.525, lon: 13.369 },
  { id: 'hamburg', name: 'Hamburg Hbf', city: 'Hamburg', country: 'DE', lat: 53.553, lon: 10.006 },
  // Switzerland
  { id: 'basel', name: 'Basel SBB', city: 'Basel', country: 'CH', lat: 47.547, lon: 7.59 },
  { id: 'zurich', name: 'Zürich HB', city: 'Zürich', country: 'CH', lat: 47.378, lon: 8.54 },
  { id: 'geneva', name: 'Genève-Cornavin', city: 'Genève', country: 'CH', lat: 46.21, lon: 6.142 },
  // Austria
  { id: 'vienna', name: 'Wien Hbf', city: 'Wenen', country: 'AT', lat: 48.185, lon: 16.376 },
  { id: 'innsbruck', name: 'Innsbruck Hbf', city: 'Innsbruck', country: 'AT', lat: 47.263, lon: 11.401 },
  { id: 'salzburg', name: 'Salzburg Hbf', city: 'Salzburg', country: 'AT', lat: 47.813, lon: 13.046 },
  // Italy
  { id: 'milan', name: 'Milano Centrale', city: 'Milaan', country: 'IT', lat: 45.486, lon: 9.204 },
  { id: 'turin', name: 'Torino Porta Nuova', city: 'Turijn', country: 'IT', lat: 45.062, lon: 7.678 },
  { id: 'genoa', name: 'Genova Piazza Principe', city: 'Genua', country: 'IT', lat: 44.418, lon: 8.921 },
  { id: 'verona', name: 'Verona Porta Nuova', city: 'Verona', country: 'IT', lat: 45.428, lon: 10.983 },
  { id: 'venice', name: 'Venezia Santa Lucia', city: 'Venetië', country: 'IT', lat: 45.441, lon: 12.321 },
  { id: 'bologna', name: 'Bologna Centrale', city: 'Bologna', country: 'IT', lat: 44.505, lon: 11.343 },
  { id: 'florence', name: 'Firenze S.M.N.', city: 'Florence', country: 'IT', lat: 43.777, lon: 11.248 },
  { id: 'rome', name: 'Roma Termini', city: 'Rome', country: 'IT', lat: 41.901, lon: 12.501 },
  { id: 'naples', name: 'Napoli Centrale', city: 'Napels', country: 'IT', lat: 40.853, lon: 14.272 },
  { id: 'bari', name: 'Bari Centrale', city: 'Bari', country: 'IT', lat: 41.117, lon: 16.871 },
  // Spain
  { id: 'barcelona', name: 'Barcelona Sants', city: 'Barcelona', country: 'ES', lat: 41.379, lon: 2.14 },
  { id: 'madrid', name: 'Madrid Atocha', city: 'Madrid', country: 'ES', lat: 40.407, lon: -3.69 },
  { id: 'valencia', name: 'València Joaquín Sorolla', city: 'Valencia', country: 'ES', lat: 39.459, lon: -0.377 },
  // Greece
  { id: 'patras', name: 'Patras (haven)', city: 'Patras', country: 'GR', lat: 38.246, lon: 21.735 },
  { id: 'athens', name: 'Athina (Larissa)', city: 'Athene', country: 'GR', lat: 37.992, lon: 23.72 },
  { id: 'thessaloniki', name: 'Thessaloniki', city: 'Thessaloniki', country: 'GR', lat: 40.644, lon: 22.933 },
  // Central Europe
  { id: 'prague', name: 'Praha hlavní nádraží', city: 'Praag', country: 'CZ', lat: 50.083, lon: 14.436 },
  { id: 'budapest', name: 'Budapest-Keleti', city: 'Boedapest', country: 'HU', lat: 47.5, lon: 19.084 },
  { id: 'ljubljana', name: 'Ljubljana', city: 'Ljubljana', country: 'SI', lat: 46.058, lon: 14.51 },
  { id: 'zagreb', name: 'Zagreb Glavni', city: 'Zagreb', country: 'HR', lat: 45.804, lon: 15.979 },
  { id: 'copenhagen', name: 'København H', city: 'Kopenhagen', country: 'DK', lat: 55.673, lon: 12.564 },
  { id: 'luxembourg', name: 'Luxembourg', city: 'Luxemburg', country: 'LU', lat: 49.6, lon: 6.134 },
  // Poland
  { id: 'warsaw', name: 'Warszawa Centralna', city: 'Warschau', country: 'PL', lat: 52.229, lon: 21.003 },
  { id: 'krakow', name: 'Kraków Główny', city: 'Krakau', country: 'PL', lat: 50.068, lon: 19.947 },
  { id: 'wroclaw', name: 'Wrocław Główny', city: 'Wrocław', country: 'PL', lat: 51.098, lon: 17.037 },
  { id: 'poznan', name: 'Poznań Główny', city: 'Poznań', country: 'PL', lat: 52.402, lon: 16.911 },
  // Slovakia
  { id: 'bratislava', name: 'Bratislava hlavná stanica', city: 'Bratislava', country: 'SK', lat: 48.158, lon: 17.107 },
  // Sweden
  { id: 'malmo', name: 'Malmö Centralstation', city: 'Malmö', country: 'SE', lat: 55.609, lon: 13.0 },
  { id: 'gothenburg', name: 'Göteborg Centralstation', city: 'Göteborg', country: 'SE', lat: 57.709, lon: 11.973 },
  { id: 'stockholm', name: 'Stockholm Centralstation', city: 'Stockholm', country: 'SE', lat: 59.33, lon: 18.058 },
  // Norway
  { id: 'oslo', name: 'Oslo Sentralstasjon', city: 'Oslo', country: 'NO', lat: 59.911, lon: 10.75 },
  // Portugal
  { id: 'lisbon', name: 'Lisboa Oriente', city: 'Lissabon', country: 'PT', lat: 38.768, lon: -9.099 },
  { id: 'porto', name: 'Porto Campanhã', city: 'Porto', country: 'PT', lat: 41.149, lon: -8.585 },
  // Balkans
  { id: 'belgrade', name: 'Beograd Centar', city: 'Belgrado', country: 'RS', lat: 44.803, lon: 20.42 },
  { id: 'sofia', name: 'Sofia Central', city: 'Sofia', country: 'BG', lat: 42.712, lon: 23.32 },
  { id: 'bucharest', name: 'București Nord', city: 'Boekarest', country: 'RO', lat: 44.446, lon: 26.073 },
  // Baltic states
  { id: 'vilnius', name: 'Vilnius', city: 'Vilnius', country: 'LT', lat: 54.671, lon: 25.28 },
  { id: 'kaunas', name: 'Kaunas', city: 'Kaunas', country: 'LT', lat: 54.9, lon: 23.92 },
  { id: 'riga', name: 'Rīga Centrālā', city: 'Riga', country: 'LV', lat: 56.947, lon: 24.12 },
  { id: 'tallinn', name: 'Tallinn Balti jaam', city: 'Tallinn', country: 'EE', lat: 59.44, lon: 24.738 },
  // Finland (via Baltic ferries)
  { id: 'helsinki', name: 'Helsinki päärautatieasema', city: 'Helsinki', country: 'FI', lat: 60.172, lon: 24.941 },
  { id: 'tampere', name: 'Tampere', city: 'Tampere', country: 'FI', lat: 61.498, lon: 23.773 },
  // Ireland (via SailRail)
  { id: 'dublin', name: 'Dublin Connolly', city: 'Dublin', country: 'IE', lat: 53.353, lon: -6.246 },
  { id: 'cork', name: 'Cork Kent', city: 'Cork', country: 'IE', lat: 51.901, lon: -8.459 },

  // ---- Expanded city coverage --------------------------------------------
  // Netherlands
  { id: 'groningen', name: 'Groningen', city: 'Groningen', country: 'NL', lat: 53.211, lon: 6.564 },
  { id: 'maastricht', name: 'Maastricht', city: 'Maastricht', country: 'NL', lat: 50.85, lon: 5.706 },
  // Belgium
  { id: 'gent', name: 'Gent-Sint-Pieters', city: 'Gent', country: 'BE', lat: 51.036, lon: 3.711 },
  { id: 'brugge', name: 'Brugge', city: 'Brugge', country: 'BE', lat: 51.197, lon: 3.217 },
  { id: 'liege', name: 'Liège-Guillemins', city: 'Luik', country: 'BE', lat: 50.624, lon: 5.567 },
  // United Kingdom
  { id: 'ashford', name: 'Ashford International', city: 'Ashford', country: 'GB', lat: 51.143, lon: 0.875 },
  { id: 'birmingham', name: 'Birmingham New Street', city: 'Birmingham', country: 'GB', lat: 52.478, lon: -1.9 },
  { id: 'manchester', name: 'Manchester Piccadilly', city: 'Manchester', country: 'GB', lat: 53.477, lon: -2.23 },
  { id: 'leeds', name: 'Leeds', city: 'Leeds', country: 'GB', lat: 53.795, lon: -1.548 },
  { id: 'york', name: 'York', city: 'York', country: 'GB', lat: 53.958, lon: -1.093 },
  { id: 'edinburgh', name: 'Edinburgh Waverley', city: 'Edinburgh', country: 'GB', lat: 55.952, lon: -3.188 },
  { id: 'glasgow', name: 'Glasgow Central', city: 'Glasgow', country: 'GB', lat: 55.86, lon: -4.258 },
  { id: 'bristol', name: 'Bristol Temple Meads', city: 'Bristol', country: 'GB', lat: 51.449, lon: -2.581 },
  // France
  { id: 'toulouse', name: 'Toulouse Matabiau', city: 'Toulouse', country: 'FR', lat: 43.611, lon: 1.454 },
  { id: 'nantes', name: 'Nantes', city: 'Nantes', country: 'FR', lat: 47.217, lon: -1.542 },
  { id: 'rennes', name: 'Rennes', city: 'Rennes', country: 'FR', lat: 48.104, lon: -1.672 },
  { id: 'dijon', name: 'Dijon-Ville', city: 'Dijon', country: 'FR', lat: 47.323, lon: 5.027 },
  // Germany
  { id: 'dusseldorf', name: 'Düsseldorf Hbf', city: 'Düsseldorf', country: 'DE', lat: 51.22, lon: 6.794 },
  { id: 'dortmund', name: 'Dortmund Hbf', city: 'Dortmund', country: 'DE', lat: 51.518, lon: 7.459 },
  { id: 'hannover', name: 'Hannover Hbf', city: 'Hannover', country: 'DE', lat: 52.377, lon: 9.741 },
  { id: 'leipzig', name: 'Leipzig Hbf', city: 'Leipzig', country: 'DE', lat: 51.345, lon: 12.382 },
  { id: 'dresden', name: 'Dresden Hbf', city: 'Dresden', country: 'DE', lat: 51.04, lon: 13.732 },
  { id: 'nuremberg', name: 'Nürnberg Hbf', city: 'Neurenberg', country: 'DE', lat: 49.446, lon: 11.082 },
  // Switzerland
  { id: 'bern', name: 'Bern', city: 'Bern', country: 'CH', lat: 46.949, lon: 7.439 },
  { id: 'lausanne', name: 'Lausanne', city: 'Lausanne', country: 'CH', lat: 46.517, lon: 6.629 },
  { id: 'lucerne', name: 'Luzern', city: 'Luzern', country: 'CH', lat: 47.05, lon: 8.31 },
  // Austria
  { id: 'graz', name: 'Graz Hbf', city: 'Graz', country: 'AT', lat: 47.073, lon: 15.439 },
  { id: 'linz', name: 'Linz Hbf', city: 'Linz', country: 'AT', lat: 48.29, lon: 14.292 },
  // Italy
  { id: 'pisa', name: 'Pisa Centrale', city: 'Pisa', country: 'IT', lat: 43.709, lon: 10.398 },
  // Spain
  { id: 'zaragoza', name: 'Zaragoza-Delicias', city: 'Zaragoza', country: 'ES', lat: 41.659, lon: -0.911 },
  { id: 'sevilla', name: 'Sevilla Santa Justa', city: 'Sevilla', country: 'ES', lat: 37.392, lon: -5.976 },
  { id: 'malaga', name: 'Málaga María Zambrano', city: 'Málaga', country: 'ES', lat: 36.712, lon: -4.431 },
  { id: 'bilbao', name: 'Bilbao-Abando', city: 'Bilbao', country: 'ES', lat: 43.263, lon: -2.935 },
  // Czechia
  { id: 'brno', name: 'Brno hlavní nádraží', city: 'Brno', country: 'CZ', lat: 49.191, lon: 16.612 },
  // Poland
  { id: 'gdansk', name: 'Gdańsk Główny', city: 'Gdańsk', country: 'PL', lat: 54.371, lon: 18.627 },
  { id: 'katowice', name: 'Katowice', city: 'Katowice', country: 'PL', lat: 50.259, lon: 19.034 },
  // Norway
  { id: 'bergen', name: 'Bergen stasjon', city: 'Bergen', country: 'NO', lat: 60.39, lon: 5.333 },
  { id: 'trondheim', name: 'Trondheim S', city: 'Trondheim', country: 'NO', lat: 63.436, lon: 10.399 },
  // Sweden
  { id: 'uppsala', name: 'Uppsala Centralstation', city: 'Uppsala', country: 'SE', lat: 59.858, lon: 17.646 },
  // Denmark
  { id: 'aarhus', name: 'Aarhus H', city: 'Aarhus', country: 'DK', lat: 56.15, lon: 10.204 },
  // Portugal
  { id: 'coimbra', name: 'Coimbra-B', city: 'Coimbra', country: 'PT', lat: 40.234, lon: -8.451 },
  // Croatia
  { id: 'split', name: 'Split', city: 'Split', country: 'HR', lat: 43.508, lon: 16.44 },
  // Romania
  { id: 'brasov', name: 'Brașov', city: 'Brașov', country: 'RO', lat: 45.657, lon: 25.601 },
  { id: 'cluj', name: 'Cluj-Napoca', city: 'Cluj-Napoca', country: 'RO', lat: 46.77, lon: 23.591 },
  // Finland
  { id: 'turku', name: 'Turku', city: 'Turku', country: 'FI', lat: 60.454, lon: 22.269 },
  // Hungary
  { id: 'gyor', name: 'Győr', city: 'Győr', country: 'HU', lat: 47.683, lon: 17.635 },
]

export const STATION_MAP: Record<string, Station> = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
)

function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLon = ((bLon - aLon) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Nearest curated station to a coordinate (used by the offline fallback planner). */
export function nearestStation(lat: number, lon: number): Station {
  let best = STATIONS[0]
  let bestD = Infinity
  for (const s of STATIONS) {
    const d = haversineKm(lat, lon, s.lat, s.lon)
    if (d < bestD) { bestD = d; best = s }
  }
  return best
}

export function stationToPlace(s: Station): import('./types').Place {
  return { id: s.id, name: s.name, lat: s.lat, lon: s.lon, isStation: true, country: s.country, region: s.city }
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------
export const OPERATORS: Record<string, OperatorInfo> = {
  ns: { id: 'ns', name: 'NS Nederlandse Spoorwegen', short: 'NS', color: '#ffc917', textColor: '#1a1a1a', country: 'NL', bookingWindowDays: 90, site: 'https://www.ns.nl' },
  eurostar: { id: 'eurostar', name: 'Eurostar', short: 'Eurostar', color: '#00285a', country: 'BE', bookingWindowDays: 180, site: 'https://www.eurostar.com' },
  sncb: { id: 'sncb', name: 'NMBS/SNCB', short: 'NMBS', color: '#005baa', country: 'BE', bookingWindowDays: 120, site: 'https://www.belgiantrain.be' },
  sncf: { id: 'sncf', name: 'SNCF TGV INOUI', short: 'TGV', color: '#8f1a3b', country: 'FR', bookingWindowDays: 120, site: 'https://www.sncf-connect.com' },
  ter: { id: 'ter', name: 'SNCF TER / Intercités', short: 'TER', color: '#e2001a', country: 'FR', bookingWindowDays: 90, site: 'https://www.sncf-connect.com' },
  db: { id: 'db', name: 'Deutsche Bahn ICE/IC', short: 'DB', color: '#ec0016', country: 'DE', bookingWindowDays: 180, site: 'https://www.bahn.com' },
  sbb: { id: 'sbb', name: 'SBB CFF FFS', short: 'SBB', color: '#eb0000', country: 'CH', bookingWindowDays: 180, site: 'https://www.sbb.ch' },
  oebb: { id: 'oebb', name: 'ÖBB Railjet', short: 'ÖBB', color: '#e2002a', country: 'AT', bookingWindowDays: 180, site: 'https://www.oebb.at' },
  nightjet: { id: 'nightjet', name: 'ÖBB Nightjet', short: 'Nightjet', color: '#1a2b6b', country: 'AT', bookingWindowDays: 180, site: 'https://www.nightjet.com' },
  trenitalia: { id: 'trenitalia', name: 'Trenitalia Frecciarossa', short: 'Trenitalia', color: '#c1272d', country: 'IT', bookingWindowDays: 120, site: 'https://www.trenitalia.com' },
  trenitalia_ic: { id: 'trenitalia_ic', name: 'Trenitalia Intercity', short: 'Trenitalia IC', color: '#87189d', country: 'IT', bookingWindowDays: 120, site: 'https://www.trenitalia.com' },
  renfe: { id: 'renfe', name: 'Renfe AVE', short: 'Renfe', color: '#63175a', country: 'ES', bookingWindowDays: 60, site: 'https://www.renfe.com' },
  hellenic: { id: 'hellenic', name: 'Hellenic Train', short: 'Hellenic', color: '#005ca9', country: 'GR', bookingWindowDays: 90, site: 'https://www.hellenictrain.gr' },
  ferry: { id: 'ferry', name: 'Superfast Ferries (Bari–Patras)', short: 'Ferry', color: '#0a5aa0', country: 'GR', bookingWindowDays: 300, site: 'https://www.superfast.com' },
  cd: { id: 'cd', name: 'České dráhy', short: 'ČD', color: '#005caa', country: 'CZ', bookingWindowDays: 90, site: 'https://www.cd.cz' },
  pkp: { id: 'pkp', name: 'PKP Intercity', short: 'PKP IC', color: '#c8102e', country: 'PL', bookingWindowDays: 30, site: 'https://www.intercity.pl' },
  zssk: { id: 'zssk', name: 'ZSSK Slovakia', short: 'ZSSK', color: '#0a4d8c', country: 'SK', bookingWindowDays: 60, site: 'https://www.zssk.sk' },
  sj: { id: 'sj', name: 'SJ Sverige', short: 'SJ', color: '#1d1d1b', country: 'SE', bookingWindowDays: 90, site: 'https://www.sj.se' },
  vy: { id: 'vy', name: 'Vy Norge', short: 'Vy', color: '#c4123f', country: 'NO', bookingWindowDays: 90, site: 'https://www.vy.no' },
  cp: { id: 'cp', name: 'Comboios de Portugal', short: 'CP', color: '#009ee0', country: 'PT', bookingWindowDays: 60, site: 'https://www.cp.pt' },
  srbvoz: { id: 'srbvoz', name: 'Srbija Voz', short: 'Srbija Voz', color: '#004a99', country: 'RS', bookingWindowDays: 30, site: 'https://www.srbvoz.rs' },
  bdz: { id: 'bdz', name: 'BDŽ Bulgarije', short: 'BDŽ', color: '#c8102e', country: 'BG', bookingWindowDays: 30, site: 'https://www.bdz.bg' },
  cfr: { id: 'cfr', name: 'CFR Călători', short: 'CFR', color: '#004b8d', country: 'RO', bookingWindowDays: 30, site: 'https://www.cfrcalatori.ro' },
  ltglink: { id: 'ltglink', name: 'LTG Link Lietuva', short: 'LTG Link', color: '#00a19a', country: 'LT', bookingWindowDays: 30, site: 'https://www.ltglink.lt' },
  vivi: { id: 'vivi', name: 'Vivi (Pasažieru vilciens)', short: 'Vivi', color: '#3aa35a', country: 'LV', bookingWindowDays: 30, site: 'https://www.vivi.lv' },
  elron: { id: 'elron', name: 'Elron Eesti', short: 'Elron', color: '#5aaa46', country: 'EE', bookingWindowDays: 30, site: 'https://elron.ee' },
  vr: { id: 'vr', name: 'VR Suomi', short: 'VR', color: '#00a651', country: 'FI', bookingWindowDays: 90, site: 'https://www.vr.fi' },
  irishrail: { id: 'irishrail', name: 'Iarnród Éireann', short: 'Irish Rail', color: '#006b3c', country: 'IE', bookingWindowDays: 90, site: 'https://www.irishrail.ie' },
  balticferry: { id: 'balticferry', name: 'Tallink Silja (veerboot)', short: 'Tallink', color: '#0057a8', country: 'FI', bookingWindowDays: 180, site: 'https://www.tallink.com' },
  sailrail: { id: 'sailrail', name: 'SailRail (trein + veerboot)', short: 'SailRail', color: '#008a3e', country: 'IE', bookingWindowDays: 90, site: 'https://www.stenaline.com' },
  avanti: { id: 'avanti', name: 'Avanti West Coast', short: 'Avanti', color: '#00364b', country: 'GB', bookingWindowDays: 84, site: 'https://www.avantiwestcoast.co.uk' },
  lner: { id: 'lner', name: 'LNER', short: 'LNER', color: '#ce0e2d', country: 'GB', bookingWindowDays: 84, site: 'https://www.lner.co.uk' },
  gwr: { id: 'gwr', name: 'Great Western Railway', short: 'GWR', color: '#0a493e', country: 'GB', bookingWindowDays: 84, site: 'https://www.gwr.com' },
  dsb: { id: 'dsb', name: 'DSB Danmark', short: 'DSB', color: '#a30014', country: 'DK', bookingWindowDays: 60, site: 'https://www.dsb.dk' },
  hzpp: { id: 'hzpp', name: 'HŽPP Hrvatska', short: 'HŽPP', color: '#005eb8', country: 'HR', bookingWindowDays: 30, site: 'https://www.hzpp.hr' },
}

// ---------------------------------------------------------------------------
// Network edges (bidirectional). minutes = typical in-vehicle time.
// ---------------------------------------------------------------------------
// Operators whose overnight services are boats, not trains (category 'ferry').
const FERRY_OPERATORS = new Set(['ferry', 'balticferry', 'sailrail'])

export const EDGES: Edge[] = [
  // NL domestic
  e('amsterdam', 'utrecht', 'ns', 'ic', 27, 80, 'optional'),
  e('amsterdam', 'rotterdam', 'ns', 'ic', 40, 80, 'optional'),
  e('amsterdam', 'denhaag', 'ns', 'ic', 50, 60, 'optional'),
  e('utrecht', 'arnhem', 'ns', 'ic', 35, 60, 'optional'),
  e('utrecht', 'eindhoven', 'ns', 'ic', 47, 60, 'optional'),
  e('rotterdam', 'breda', 'ns', 'ic', 24, 40, 'optional'),
  e('rotterdam', 'denhaag', 'ns', 'ic', 26, 60, 'optional'),
  // NL -> neighbours
  e('amsterdam', 'london', 'eurostar', 'hsr', 250, 4, 'required'),
  e('amsterdam', 'brussels', 'eurostar', 'hsr', 112, 16, 'required'),
  e('rotterdam', 'brussels', 'eurostar', 'hsr', 73, 16, 'required'),
  e('amsterdam', 'antwerp', 'eurostar', 'hsr', 74, 16, 'required'),
  e('antwerp', 'brussels', 'sncb', 'ic', 45, 40, 'optional'),
  e('amsterdam', 'cologne', 'db', 'hsr', 160, 7, 'recommended'),
  e('arnhem', 'cologne', 'db', 'ic', 105, 6, 'recommended'),
  e('amsterdam', 'frankfurt', 'db', 'hsr', 235, 5, 'recommended'),
  e('amsterdam', 'berlin', 'db', 'ic', 384, 7, 'recommended'),
  // BE / FR / UK
  e('brussels', 'paris', 'eurostar', 'hsr', 85, 24, 'required'),
  e('brussels', 'london', 'eurostar', 'hsr', 125, 10, 'required'),
  e('london', 'paris', 'eurostar', 'hsr', 140, 18, 'required'),
  e('brussels', 'lille', 'eurostar', 'hsr', 38, 12, 'required'),
  e('lille', 'paris', 'sncf', 'hsr', 62, 20, 'required'),
  e('lille', 'london', 'eurostar', 'hsr', 82, 8, 'required'),
  e('paris', 'lyon', 'sncf', 'hsr', 116, 25, 'required'),
  e('paris', 'strasbourg', 'sncf', 'hsr', 108, 16, 'required'),
  e('paris', 'marseille', 'sncf', 'hsr', 195, 18, 'required'),
  e('paris', 'bordeaux', 'sncf', 'hsr', 125, 16, 'required'),
  e('lyon', 'marseille', 'sncf', 'hsr', 100, 16, 'required'),
  e('lyon', 'geneva', 'sncf', 'hsr', 115, 8, 'required'),
  e('marseille', 'montpellier', 'sncf', 'hsr', 85, 14, 'required'),
  e('marseille', 'nice', 'ter', 'regional', 155, 20, 'optional'),
  e('montpellier', 'barcelona', 'renfe', 'hsr', 168, 6, 'required'),
  // DE corridors
  e('cologne', 'frankfurt', 'db', 'hsr', 62, 30, 'recommended'),
  e('frankfurt', 'mannheim', 'db', 'hsr', 38, 40, 'recommended'),
  e('mannheim', 'karlsruhe', 'db', 'hsr', 30, 30, 'recommended'),
  e('mannheim', 'stuttgart', 'db', 'hsr', 38, 30, 'recommended'),
  e('karlsruhe', 'freiburg', 'db', 'hsr', 55, 20, 'recommended'),
  e('freiburg', 'basel', 'db', 'hsr', 45, 20, 'recommended'),
  e('frankfurt', 'munich', 'db', 'hsr', 190, 20, 'recommended'),
  e('stuttgart', 'munich', 'db', 'hsr', 130, 20, 'recommended'),
  e('frankfurt', 'berlin', 'db', 'hsr', 240, 20, 'recommended'),
  e('berlin', 'hamburg', 'db', 'hsr', 105, 30, 'recommended'),
  e('cologne', 'hamburg', 'db', 'hsr', 245, 15, 'recommended'),
  e('cologne', 'berlin', 'db', 'hsr', 275, 14, 'recommended'),
  // Long-distance directs (fewer changes on the main corridors)
  e('amsterdam', 'basel', 'db', 'hsr', 320, 8, 'recommended'),
  e('frankfurt', 'basel', 'db', 'hsr', 170, 12, 'recommended'),
  e('frankfurt', 'zurich', 'db', 'hsr', 235, 6, 'recommended'),
  e('paris', 'montpellier', 'sncf', 'hsr', 195, 8, 'required'),
  // CH / AT
  e('basel', 'zurich', 'sbb', 'ic', 55, 40, 'optional'),
  e('zurich', 'milan', 'sbb', 'hsr', 200, 10, 'recommended'),
  e('basel', 'milan', 'sbb', 'hsr', 245, 8, 'recommended'),
  e('munich', 'vienna', 'oebb', 'hsr', 240, 12, 'recommended'),
  e('munich', 'innsbruck', 'oebb', 'ic', 110, 12, 'recommended'),
  e('munich', 'salzburg', 'oebb', 'ic', 90, 20, 'optional'),
  e('salzburg', 'vienna', 'oebb', 'hsr', 150, 20, 'recommended'),
  e('innsbruck', 'verona', 'db', 'ic', 205, 6, 'recommended'),
  e('vienna', 'budapest', 'oebb', 'hsr', 160, 12, 'recommended'),
  e('vienna', 'prague', 'oebb', 'hsr', 240, 8, 'recommended'),
  e('zurich', 'vienna', 'oebb', 'hsr', 465, 4, 'recommended'),
  // IT
  e('milan', 'turin', 'trenitalia', 'hsr', 52, 20, 'required'),
  e('milan', 'genoa', 'trenitalia_ic', 'ic', 95, 16, 'optional'),
  e('milan', 'verona', 'trenitalia', 'hsr', 72, 16, 'required'),
  e('milan', 'bologna', 'trenitalia', 'hsr', 65, 30, 'required'),
  e('milan', 'rome', 'trenitalia', 'hsr', 178, 30, 'required'),
  e('milan', 'naples', 'trenitalia', 'hsr', 280, 10, 'required'),
  e('verona', 'venice', 'trenitalia', 'hsr', 70, 20, 'required'),
  e('bologna', 'florence', 'trenitalia', 'hsr', 37, 30, 'required'),
  e('florence', 'rome', 'trenitalia', 'hsr', 95, 30, 'required'),
  e('rome', 'naples', 'trenitalia', 'hsr', 70, 30, 'required'),
  e('naples', 'bari', 'trenitalia_ic', 'ic', 210, 8, 'optional'),
  e('rome', 'bari', 'trenitalia_ic', 'ic', 240, 6, 'optional'),
  e('bologna', 'bari', 'trenitalia', 'hsr', 260, 6, 'required'),
  // ES
  e('barcelona', 'madrid', 'renfe', 'hsr', 155, 24, 'required'),
  e('barcelona', 'valencia', 'renfe', 'ic', 200, 10, 'recommended'),
  e('madrid', 'valencia', 'renfe', 'hsr', 105, 15, 'required'),
  // Night trains (Nightjet & co) — depart once in the evening
  en('amsterdam', 'vienna', 'nightjet', 810, 'required', [1140]),   // 19:00
  en('amsterdam', 'innsbruck', 'nightjet', 795, 'required', [1140]),
  en('amsterdam', 'munich', 'nightjet', 660, 'required', [1155]),
  en('paris', 'vienna', 'nightjet', 830, 'required', [1150]),
  en('brussels', 'vienna', 'nightjet', 780, 'required', [1145]),
  en('munich', 'rome', 'nightjet', 690, 'required', [1230]),
  // GR — ferry + rail
  en('bari', 'patras', 'ferry', 930, 'required', [1140]),           // overnight ferry ~15.5h
  e('patras', 'athens', 'hellenic', 'regional', 210, 6, 'recommended'),
  e('athens', 'thessaloniki', 'hellenic', 'ic', 245, 8, 'recommended'),
  // CZ / misc
  e('prague', 'munich', 'db', 'ic', 240, 6, 'recommended'),
  e('berlin', 'prague', 'cd', 'ic', 260, 6, 'recommended'),
  e('ljubljana', 'zagreb', 'oebb', 'ic', 140, 6, 'recommended'),
  e('vienna', 'ljubljana', 'oebb', 'ic', 360, 4, 'recommended'),
  e('copenhagen', 'hamburg', 'db', 'ic', 285, 5, 'recommended'),
  e('luxembourg', 'strasbourg', 'ter', 'regional', 130, 8, 'optional'),
  e('brussels', 'luxembourg', 'sncb', 'ic', 190, 10, 'optional'),
  // Poland (PKP) — via Berlin / Prague / Vienna
  e('berlin', 'poznan', 'pkp', 'ic', 165, 6, 'recommended'),
  e('poznan', 'warsaw', 'pkp', 'ic', 140, 10, 'recommended'),
  e('warsaw', 'krakow', 'pkp', 'ic', 150, 12, 'recommended'),
  e('krakow', 'wroclaw', 'pkp', 'ic', 200, 6, 'recommended'),
  e('wroclaw', 'poznan', 'pkp', 'ic', 140, 8, 'optional'),
  e('berlin', 'wroclaw', 'pkp', 'ic', 260, 4, 'recommended'),
  e('prague', 'wroclaw', 'cd', 'ic', 250, 3, 'recommended'),
  e('vienna', 'krakow', 'oebb', 'ic', 340, 3, 'recommended'),
  // Slovakia (ZSSK) — Vienna / Budapest / Prague
  e('vienna', 'bratislava', 'zssk', 'ic', 60, 20, 'optional'),
  e('budapest', 'bratislava', 'zssk', 'ic', 155, 8, 'recommended'),
  e('prague', 'bratislava', 'zssk', 'ic', 250, 5, 'recommended'),
  // Sweden (SJ) — via Copenhagen (Øresund)
  e('copenhagen', 'malmo', 'sj', 'regional', 40, 30, 'optional'),
  e('malmo', 'gothenburg', 'sj', 'ic', 165, 10, 'recommended'),
  e('malmo', 'stockholm', 'sj', 'hsr', 270, 8, 'recommended'),
  e('gothenburg', 'stockholm', 'sj', 'hsr', 200, 12, 'recommended'),
  // Norway (Vy)
  e('gothenburg', 'oslo', 'vy', 'ic', 220, 6, 'recommended'),
  e('stockholm', 'oslo', 'vy', 'ic', 300, 4, 'recommended'),
  // Portugal (CP) — via Madrid (overnight)
  e('porto', 'lisbon', 'cp', 'hsr', 170, 10, 'recommended'),
  en('madrid', 'lisbon', 'cp', 600, 'required', [1290]),           // ~21:30 night train
  // Balkans — overland corridor Central Europe → Greece
  e('budapest', 'belgrade', 'srbvoz', 'ic', 480, 3, 'recommended'),
  e('zagreb', 'belgrade', 'srbvoz', 'ic', 360, 3, 'recommended'),
  e('belgrade', 'sofia', 'bdz', 'ic', 480, 2, 'recommended'),
  e('sofia', 'thessaloniki', 'hellenic', 'ic', 420, 1, 'recommended'),
  en('budapest', 'bucharest', 'cfr', 900, 'required', [1200]),      // overnight ~15h
  e('bucharest', 'sofia', 'cfr', 'ic', 540, 2, 'recommended'),
  // Baltic states (Rail Baltica corridor) — via Warsaw
  e('warsaw', 'kaunas', 'ltglink', 'ic', 480, 2, 'recommended'),
  e('kaunas', 'vilnius', 'ltglink', 'ic', 70, 8, 'optional'),
  e('vilnius', 'riga', 'vivi', 'ic', 300, 2, 'recommended'),
  e('riga', 'tallinn', 'elron', 'ic', 360, 2, 'recommended'),
  // Finland — Baltic Sea ferries
  e('tallinn', 'helsinki', 'balticferry', 'ferry', 150, 8, 'recommended'),   // ~2.5h daytime crossing
  en('stockholm', 'helsinki', 'balticferry', 960, 'recommended', [1080]),    // overnight ferry ~16h
  e('helsinki', 'tampere', 'vr', 'ic', 90, 10, 'optional'),
  // Ireland — SailRail (rail + ferry) via London
  e('dublin', 'london', 'sailrail', 'ferry', 510, 3, 'recommended'),
  e('dublin', 'cork', 'irishrail', 'ic', 150, 8, 'optional'),

  // ---- Expanded city coverage: edges -------------------------------------
  // Netherlands
  e('amsterdam', 'groningen', 'ns', 'ic', 130, 8, 'optional'),
  e('eindhoven', 'maastricht', 'ns', 'ic', 62, 10, 'optional'),
  // Belgium
  e('brussels', 'gent', 'sncb', 'ic', 32, 12, 'optional'),
  e('gent', 'brugge', 'sncb', 'ic', 25, 10, 'optional'),
  e('brussels', 'liege', 'sncb', 'ic', 62, 10, 'optional'),
  e('liege', 'cologne', 'db', 'hsr', 90, 6, 'recommended'),
  // United Kingdom
  e('london', 'ashford', 'eurostar', 'hsr', 37, 8, 'required'),
  e('ashford', 'lille', 'eurostar', 'hsr', 65, 6, 'required'),
  e('london', 'birmingham', 'avanti', 'hsr', 84, 12, 'recommended'),
  e('london', 'manchester', 'avanti', 'hsr', 128, 10, 'recommended'),
  e('birmingham', 'manchester', 'avanti', 'ic', 88, 8, 'optional'),
  e('manchester', 'leeds', 'avanti', 'ic', 60, 8, 'optional'),
  e('london', 'york', 'lner', 'hsr', 110, 10, 'recommended'),
  e('york', 'leeds', 'lner', 'ic', 25, 8, 'optional'),
  e('york', 'edinburgh', 'lner', 'hsr', 150, 8, 'recommended'),
  e('london', 'edinburgh', 'lner', 'hsr', 270, 6, 'recommended'),
  e('edinburgh', 'glasgow', 'lner', 'ic', 50, 12, 'optional'),
  e('manchester', 'glasgow', 'avanti', 'ic', 200, 5, 'recommended'),
  e('london', 'bristol', 'gwr', 'hsr', 100, 10, 'recommended'),
  // France
  e('bordeaux', 'toulouse', 'sncf', 'hsr', 130, 8, 'required'),
  e('paris', 'nantes', 'sncf', 'hsr', 130, 10, 'required'),
  e('paris', 'rennes', 'sncf', 'hsr', 95, 10, 'required'),
  e('paris', 'dijon', 'sncf', 'hsr', 100, 8, 'required'),
  e('dijon', 'lyon', 'sncf', 'ic', 100, 6, 'recommended'),
  // Germany
  e('cologne', 'dusseldorf', 'db', 'ic', 25, 20, 'recommended'),
  e('dusseldorf', 'dortmund', 'db', 'ic', 40, 12, 'recommended'),
  e('hamburg', 'hannover', 'db', 'hsr', 78, 12, 'recommended'),
  e('hannover', 'berlin', 'db', 'hsr', 98, 10, 'recommended'),
  e('frankfurt', 'hannover', 'db', 'hsr', 145, 8, 'recommended'),
  e('berlin', 'leipzig', 'db', 'hsr', 75, 10, 'recommended'),
  e('frankfurt', 'leipzig', 'db', 'hsr', 190, 6, 'recommended'),
  e('leipzig', 'dresden', 'db', 'ic', 70, 8, 'recommended'),
  e('dresden', 'prague', 'db', 'ic', 135, 6, 'recommended'),
  e('frankfurt', 'nuremberg', 'db', 'hsr', 125, 10, 'recommended'),
  e('nuremberg', 'munich', 'db', 'hsr', 65, 12, 'recommended'),
  e('nuremberg', 'berlin', 'db', 'hsr', 175, 6, 'recommended'),
  // Switzerland
  e('bern', 'zurich', 'sbb', 'ic', 56, 12, 'optional'),
  e('bern', 'basel', 'sbb', 'ic', 55, 10, 'optional'),
  e('geneva', 'lausanne', 'sbb', 'ic', 40, 12, 'optional'),
  e('lausanne', 'bern', 'sbb', 'ic', 66, 8, 'optional'),
  e('zurich', 'lucerne', 'sbb', 'ic', 45, 10, 'optional'),
  // Austria
  e('vienna', 'graz', 'oebb', 'ic', 150, 8, 'recommended'),
  e('vienna', 'linz', 'oebb', 'hsr', 75, 12, 'recommended'),
  e('linz', 'salzburg', 'oebb', 'ic', 75, 10, 'optional'),
  // Italy
  e('florence', 'pisa', 'trenitalia_ic', 'ic', 60, 10, 'optional'),
  e('pisa', 'genoa', 'trenitalia_ic', 'ic', 110, 6, 'optional'),
  // Spain
  e('madrid', 'zaragoza', 'renfe', 'hsr', 75, 10, 'required'),
  e('zaragoza', 'barcelona', 'renfe', 'hsr', 90, 10, 'required'),
  e('madrid', 'sevilla', 'renfe', 'hsr', 155, 10, 'required'),
  e('madrid', 'malaga', 'renfe', 'hsr', 160, 8, 'required'),
  e('madrid', 'bilbao', 'renfe', 'ic', 300, 4, 'recommended'),
  // Czechia
  e('prague', 'brno', 'cd', 'ic', 150, 10, 'recommended'),
  e('brno', 'vienna', 'oebb', 'ic', 95, 6, 'recommended'),
  e('brno', 'bratislava', 'zssk', 'ic', 90, 6, 'recommended'),
  // Poland
  e('warsaw', 'gdansk', 'pkp', 'ic', 170, 8, 'recommended'),
  e('krakow', 'katowice', 'pkp', 'ic', 50, 10, 'optional'),
  e('katowice', 'warsaw', 'pkp', 'ic', 150, 8, 'recommended'),
  // Norway
  e('oslo', 'bergen', 'vy', 'ic', 390, 4, 'recommended'),
  e('oslo', 'trondheim', 'vy', 'ic', 400, 3, 'recommended'),
  // Sweden
  e('stockholm', 'uppsala', 'sj', 'ic', 38, 15, 'optional'),
  // Denmark
  e('copenhagen', 'aarhus', 'dsb', 'ic', 180, 8, 'recommended'),
  // Portugal
  e('porto', 'coimbra', 'cp', 'ic', 70, 8, 'optional'),
  e('coimbra', 'lisbon', 'cp', 'hsr', 105, 8, 'recommended'),
  // Croatia
  e('zagreb', 'split', 'hzpp', 'ic', 360, 3, 'recommended'),
  // Romania
  e('bucharest', 'brasov', 'cfr', 'ic', 150, 8, 'recommended'),
  e('brasov', 'cluj', 'cfr', 'ic', 300, 3, 'optional'),
  // Finland
  e('helsinki', 'turku', 'vr', 'ic', 115, 10, 'optional'),
  // Hungary
  e('budapest', 'gyor', 'oebb', 'ic', 65, 10, 'optional'),
]

function e(
  from: string, to: string, operator: string,
  category: Edge['category'], minutes: number, freqPerDay: number,
  reservation: Edge['reservation'],
): Edge {
  return { from, to, operator, category, minutes, freqPerDay, reservation }
}

function en(
  from: string, to: string, operator: string,
  minutes: number, reservation: Edge['reservation'], fixedDep: number[],
): Edge {
  const category = FERRY_OPERATORS.has(operator) ? 'ferry' : 'night'
  return { from, to, operator, category, minutes, freqPerDay: fixedDep.length, reservation, fixedDep }
}
