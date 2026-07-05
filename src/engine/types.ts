// Core domain types for the Spoorwijs journey engine.

export type CountryCode =
  | 'NL' | 'BE' | 'GB' | 'FR' | 'DE' | 'CH' | 'AT' | 'IT'
  | 'ES' | 'GR' | 'CZ' | 'HU' | 'SI' | 'HR' | 'DK' | 'LU'
  | 'PL' | 'SK' | 'SE' | 'NO' | 'PT' | 'RS' | 'BG' | 'RO'
  | 'LT' | 'LV' | 'EE' | 'FI' | 'IE'

export interface Station {
  id: string
  name: string
  city: string
  country: CountryCode
  lat: number
  lon: number
}

/** Any origin/destination: a station, city, town, address or POI in Europe. */
export interface Place {
  id: string
  name: string
  lat: number
  lon: number
  isStation: boolean
  country?: string
  region?: string
}

export type AccessMode = 'WALK' | 'CAR' | 'BIKE'

/** First/last mile between the traveller's place and the nearest station. */
export interface AccessLeg {
  mode: AccessMode
  minutes: number
  km: number
  placeName: string
  stationName: string
}

export type ServiceCategory =
  | 'hsr'        // high-speed (TGV, ICE, Frecciarossa, AVE, Eurostar)
  | 'ic'         // intercity
  | 'regional'   // regional / local
  | 'night'      // night train (Nightjet)
  | 'ferry'      // rail+ferry link
  | 'transfer'   // walk/metro between stations in one city

export type ReservationPolicy = 'required' | 'recommended' | 'optional'

export interface OperatorInfo {
  id: string
  name: string
  short: string
  color: string
  textColor?: string
  country: CountryCode
  /** How many days before departure tickets typically open for sale. */
  bookingWindowDays: number
  /** Base site used for the "buy at operator" deep link. */
  site: string
}

export interface Edge {
  from: string
  to: string
  operator: string
  category: ServiceCategory
  /** Typical in-vehicle minutes. */
  minutes: number
  /** Approx daily services (used to synthesise a timetable). */
  freqPerDay: number
  reservation: ReservationPolicy
  /** For night/ferry: fixed departure minutes-after-midnight. */
  fixedDep?: number[]
  /** Optional explicit distance (km); otherwise haversine from coords. */
  km?: number
}

export interface Leg {
  from: Station
  to: Station
  operator: OperatorInfo
  category: ServiceCategory
  depMin: number      // minutes after midnight (day offset handled by dayOffset)
  arrMin: number
  depDayOffset: number
  arrDayOffset: number
  durationMin: number
  km: number
  reservation: ReservationPolicy
  trainName: string
  priceBase: number   // 2nd class standard base fare for this leg
}

export type FareClass = 'saver' | 'standard' | 'flex'

export interface Fare {
  cls: FareClass
  price: number
  refundable: boolean
  changeable: boolean
  seatIncluded: boolean
}

export interface Journey {
  id: string
  legs: Leg[]
  depMin: number
  arrMin: number
  arrDayOffset: number
  durationMin: number
  changes: number
  km: number
  fares: Record<FareClass, Fare>
  tags: JourneyTag[]
  /** Earliest date tickets can be booked (ISO), if in the future. */
  bookableFrom?: string
  reservationRequired: boolean
  co2Kg: number
  co2CarKg: number
  co2PlaneKg: number
  /** First/last mile to a place without its own station (if any). */
  access?: AccessLeg
  egress?: AccessLeg
}

export type JourneyTag = 'fastest' | 'cheapest' | 'fewest' | 'night' | 'direct'

export interface SearchQuery {
  from: Place
  to: Place
  date: string        // ISO yyyy-mm-dd
  timePref: number    // preferred earliest departure minutes-after-midnight
  passengers: number
  card: string        // discount-card id (see engine/cards.ts)
  minTransfer: number // minimum transfer time in minutes (0 = standard)
}
