// Discount-card catalogue for the countries we cover, plus international passes.
// Each card carries what it gives, an approximate price, the modelled discount,
// and links to read more / order it directly at the carrier.

export interface DiscountCard {
  id: string
  name: string
  country: 'NL' | 'BE' | 'FR' | 'IT' | 'DE' | 'EU'
  flag: string
  issuer: string
  priceLabel: string
  blurb: string
  eligibility?: string
  /** Modelled fare discount (0..1) applied to legs of `operatorIds`. */
  discountPct: number
  operatorIds: string[]
  /** Rail pass: fare is covered, you pay only seat reservations. */
  reservationsOnly?: boolean
  infoUrl: string
  orderUrl: string
}

export const DISCOUNT_CARDS: DiscountCard[] = [
  { id: 'none', name: 'Geen kortingskaart', country: 'EU', flag: '🚆', issuer: '', priceLabel: 'gratis', blurb: 'Reguliere prijzen, geen korting.', discountPct: 0, operatorIds: [], infoUrl: '', orderUrl: '' },

  // Netherlands — NS
  { id: 'ns_dalvoordeel', name: 'NS Dal Voordeel', country: 'NL', flag: '🇳🇱', issuer: 'NS', priceLabel: '± € 5,60 / maand', blurb: '40% korting buiten de spits in heel Nederland, plus in het weekend.', eligibility: 'Iedereen', discountPct: 0.4, operatorIds: ['ns'], infoUrl: 'https://www.ns.nl/abonnementen/dal-voordeel', orderUrl: 'https://www.ns.nl/abonnementen/dal-voordeel' },
  { id: 'ns_altijdvoordeel', name: 'NS Altijd Voordeel', country: 'NL', flag: '🇳🇱', issuer: 'NS', priceLabel: '± € 27 / maand', blurb: '40% korting in de spits én 40% buiten de spits, altijd.', eligibility: 'Iedereen', discountPct: 0.4, operatorIds: ['ns'], infoUrl: 'https://www.ns.nl/abonnementen/altijd-voordeel', orderUrl: 'https://www.ns.nl/abonnementen/altijd-voordeel' },

  // Belgium — SNCB/NMBS
  { id: 'sncb_standardmulti', name: 'SNCB Standard Multi', country: 'BE', flag: '🇧🇪', issuer: 'NMBS/SNCB', priceLabel: '± € 96 / 10 ritten', blurb: '10 losse ritten in 2e klas door heel België, deelbaar met anderen.', eligibility: 'Iedereen', discountPct: 0.2, operatorIds: ['sncb'], infoUrl: 'https://www.belgiantrain.be/nl/tickets-and-railcards/railcards/standard-multi', orderUrl: 'https://www.belgiantrain.be/nl/tickets-and-railcards/railcards' },
  { id: 'sncb_gopass', name: 'SNCB Go Pass 10', country: 'BE', flag: '🇧🇪', issuer: 'NMBS/SNCB', priceLabel: '± € 62 / 10 ritten', blurb: 'Voor jongeren onder de 26: 10 ritten tegen een sterk gereduceerd tarief.', eligibility: 'Jonger dan 26', discountPct: 0.5, operatorIds: ['sncb'], infoUrl: 'https://www.belgiantrain.be/nl/tickets-and-railcards/go-pass-rail-pass/go-pass-10', orderUrl: 'https://www.belgiantrain.be/nl/tickets-and-railcards' },
  { id: 'sncb_senior', name: 'SNCB Senior Ticket', country: 'BE', flag: '🇧🇪', issuer: 'NMBS/SNCB', priceLabel: '± € 8,20 / rit', blurb: 'Vast laag tarief voor 65-plussers voor een enkele reis.', eligibility: '65-plus', discountPct: 0.5, operatorIds: ['sncb'], infoUrl: 'https://www.belgiantrain.be/nl/tickets-and-railcards/tickets/senior-ticket', orderUrl: 'https://www.belgiantrain.be/nl/tickets-and-railcards' },

  // France — SNCF
  { id: 'sncf_avantage', name: 'Carte Avantage', country: 'FR', flag: '🇫🇷', issuer: 'SNCF', priceLabel: '± € 49 / jaar', blurb: 'Tot 30% korting op TGV INOUI en Intercités, met prijsplafonds. Jeune / Adulte / Senior.', eligibility: 'Per leeftijdsgroep', discountPct: 0.3, operatorIds: ['sncf', 'ter'], infoUrl: 'https://www.sncf-connect.com/en-en/cards-and-subscriptions/avantage', orderUrl: 'https://www.sncf-connect.com/en-en/cards-and-subscriptions' },
  { id: 'sncf_liberte', name: 'Carte Liberté', country: 'FR', flag: '🇫🇷', issuer: 'SNCF', priceLabel: '± € 399 / jaar', blurb: 'Voor veelreizigers: tot 45% korting en volledig flexibele tickets.', eligibility: 'Iedereen', discountPct: 0.45, operatorIds: ['sncf', 'ter'], infoUrl: 'https://www.sncf-connect.com/en-en/cards-and-subscriptions/liberte', orderUrl: 'https://www.sncf-connect.com/en-en/cards-and-subscriptions' },
  { id: 'sncf_tgvmax', name: 'TGVmax', country: 'FR', flag: '🇫🇷', issuer: 'SNCF', priceLabel: '± € 79 / maand', blurb: 'Onbeperkt reizen met TGV en Intercités voor jongeren (mits plek).', eligibility: '16 t/m 27 jaar', discountPct: 0.6, operatorIds: ['sncf'], infoUrl: 'https://www.maxjeune-tgvinoui.sncf/en', orderUrl: 'https://www.maxjeune-tgvinoui.sncf/en' },

  // Italy — Trenitalia
  { id: 'it_cartaverde', name: 'Carta Verde', country: 'IT', flag: '🇮🇹', issuer: 'Trenitalia', priceLabel: '± € 40 / jaar', blurb: '10–15% korting op nationale treinen voor jongeren.', eligibility: '12 t/m 26 jaar', discountPct: 0.12, operatorIds: ['trenitalia', 'trenitalia_ic'], infoUrl: 'https://www.trenitalia.com/en/offers/carta-verde.html', orderUrl: 'https://www.trenitalia.com/en/offers/carta-verde.html' },
  { id: 'it_cartaargento', name: 'Carta Argento', country: 'IT', flag: '🇮🇹', issuer: 'Trenitalia', priceLabel: '± € 30 / jaar (gratis 75+)', blurb: 'Korting voor senioren op nationale treinen.', eligibility: '60-plus', discountPct: 0.12, operatorIds: ['trenitalia', 'trenitalia_ic'], infoUrl: 'https://www.trenitalia.com/en/offers/carta-argento.html', orderUrl: 'https://www.trenitalia.com/en/offers/carta-argento.html' },
  { id: 'it_cartafreccia', name: 'CartaFRECCIA', country: 'IT', flag: '🇮🇹', issuer: 'Trenitalia', priceLabel: 'gratis', blurb: 'Gratis loyaliteitsprogramma: punten sparen en exclusieve aanbiedingen.', eligibility: 'Iedereen', discountPct: 0, operatorIds: ['trenitalia', 'trenitalia_ic'], infoUrl: 'https://www.trenitalia.com/en/cartafreccia.html', orderUrl: 'https://www.trenitalia.com/en/cartafreccia.html' },

  // Germany — DB (neighbour, widely used)
  { id: 'db_bahncard25', name: 'BahnCard 25', country: 'DE', flag: '🇩🇪', issuer: 'Deutsche Bahn', priceLabel: '± € 60 / jaar', blurb: '25% korting op vrijwel alle DB-treinen, ook internationaal vanuit Duitsland.', eligibility: 'Iedereen', discountPct: 0.25, operatorIds: ['db'], infoUrl: 'https://www.bahn.com/en/offers/bahncard', orderUrl: 'https://www.bahn.com/en/offers/bahncard' },
  { id: 'db_bahncard50', name: 'BahnCard 50', country: 'DE', flag: '🇩🇪', issuer: 'Deutsche Bahn', priceLabel: '± € 244 / jaar', blurb: '50% korting op de reguliere (Flexpreis) tarieven van DB.', eligibility: 'Iedereen', discountPct: 0.5, operatorIds: ['db'], infoUrl: 'https://www.bahn.com/en/offers/bahncard', orderUrl: 'https://www.bahn.com/en/offers/bahncard' },

  // International passes
  { id: 'interrail', name: 'Interrail Pas', country: 'EU', flag: '🇪🇺', issuer: 'Eurail B.V.', priceLabel: 'vanaf ± € 200', blurb: 'Reis met één pas door 33 landen. Je betaalt alleen nog de verplichte zitplaatsreserveringen.', eligibility: 'Inwoners van Europa', discountPct: 0, operatorIds: [], reservationsOnly: true, infoUrl: 'https://www.interrail.eu', orderUrl: 'https://www.interrail.eu' },
  { id: 'eurail', name: 'Eurail Pas', country: 'EU', flag: '🌍', issuer: 'Eurail B.V.', priceLabel: 'vanaf ± € 200', blurb: 'Zelfde vrijheid als Interrail, voor reizigers van buiten Europa.', eligibility: 'Niet-inwoners van Europa', discountPct: 0, operatorIds: [], reservationsOnly: true, infoUrl: 'https://www.eurail.com', orderUrl: 'https://www.eurail.com' },
]

export const CARD_MAP: Record<string, DiscountCard> = Object.fromEntries(DISCOUNT_CARDS.map((c) => [c.id, c]))

export function cardById(id: string | undefined): DiscountCard {
  return (id && CARD_MAP[id]) || CARD_MAP['none']
}

/** Apply a card's discount to one leg's base fare. */
export function discountedLegFare(base: number, operatorId: string, card: DiscountCard): number {
  if (card.reservationsOnly || card.discountPct <= 0) return base
  return card.operatorIds.includes(operatorId) ? base * (1 - card.discountPct) : base
}

// How the card can be sold to the traveller.
export type Resale = 'spoorwijs' | 'partner' | 'operator'
const RESALE: Record<string, Resale> = {
  interrail: 'spoorwijs', eurail: 'spoorwijs',
  sncf_avantage: 'partner', sncf_liberte: 'partner',
}
const DEMO_PRICE: Record<string, number> = { interrail: 283, eurail: 283 }

export function resaleOf(id: string): Resale { return RESALE[id] ?? 'operator' }
export function demoPriceOf(id: string): number { return DEMO_PRICE[id] ?? 0 }

export const CARD_COUNTRIES: { code: DiscountCard['country']; label: string }[] = [
  { code: 'NL', label: 'Nederland' },
  { code: 'BE', label: 'België' },
  { code: 'FR', label: 'Frankrijk' },
  { code: 'IT', label: 'Italië' },
  { code: 'DE', label: 'Duitsland' },
  { code: 'EU', label: 'Internationaal' },
]
