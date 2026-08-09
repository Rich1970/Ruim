// Ruim — alle gesproken en geschreven inhoud, in het Nederlands.
// Warm, kalm, kort. Geen uitroeptekens, geen emoji in gesproken teksten.

// ---------- Nachtprotocol ----------

// Fase 1 — Toestemming
export const NIGHT_PERMISSION: string[] = [
  'Je hoeft nu niets op te lossen.',
  'Het is nacht. Er is niets dat vannacht besloten hoeft te worden.',
  'Wat je voelt mag er zijn. Het hoeft niet weg.',
  'We gaan het alleen een beetje zachter maken.',
]

// Fase 4 — De ladder. Drie varianten, rouleert per nacht.
export const NIGHT_LADDERS: string[][] = [
  [
    'Het is oké dat ik dit voel. Het is nacht, en ’s nachts voelt alles groter.',
    'Ik hoef dit nu niet op te lossen.',
    'Dit is niet mijn eerste moeilijke nacht, en de vorige zijn allemaal overgegaan.',
    'Ik heb eerder dingen opgelost die veel groter leken dan dit.',
    'Er is meer tijd dan ik denk. Er is altijd meer tijd geweest dan ik dacht.',
    'Ik lig warm. Ik ben veilig. Op dit exacte moment is er niets mis.',
    'Ik ben niet alleen. Er zijn mensen die vandaag aan mij gedacht hebben.',
    'Morgen kijk ik hiernaar met een heldere kop, en dan blijkt het kleiner.',
    'Ik hoef nu alleen maar te slapen. Dat is het enige nuttige dat ik nu kan doen.',
    'En slapen mag.',
  ],
  [
    'Wat ik voel is echt, en het mag er zijn. Ik hoef het niet weg te duwen.',
    'Het is nacht. Niets van dit hoeft nu een antwoord te krijgen.',
    'Ik heb al zoveel nachten als deze gehad, en ze zijn allemaal weer licht geworden.',
    'De dingen die ik ’s nachts groot maak, worden overdag meestal weer gewoon.',
    'Er is genoeg tijd. Ik hoef niets in te halen dat vannacht niet kan wachten.',
    'Mijn lichaam is veilig. Ik lig warm en er gebeurt nu niets ergs.',
    'Er zijn mensen die om me geven, ook als ik ze nu niet hoor.',
    'Straks wordt het licht, en dan zie ik dit met andere ogen.',
    'Het enige wat nu zin heeft, is rusten. Al het andere kan wachten.',
    'Ik mag mezelf nu laten zakken in de slaap.',
  ],
  [
    'Dit gevoel hoort bij vannacht. Ik hoef het niet te bevechten.',
    'Er hoeft nu niets besloten, niets opgelost, niets goedgemaakt te worden.',
    'Ik ben hier al vaker geweest, en telkens is het weer overgegaan.',
    'Wat nu onmogelijk lijkt, heeft morgen vaak een simpele volgende stap.',
    'Ik heb meer ruimte dan het ’s nachts voelt. Die ruimte is er nog steeds.',
    'Op dit moment, in dit bed, is alles in orde. Er is nu niets mis.',
    'Ik word gedragen door meer mensen dan ik in de nacht kan voelen.',
    'Als het licht wordt, wordt dit vanzelf kleiner. Dat is altijd zo geweest.',
    'Slapen is nu het meest verstandige dat ik kan doen.',
    'En dat mag ik nu gewoon doen.',
  ],
]

// Fase 5 — de zachte lus na de scène.
export const SATS_LOOP_LINE = 'Dank je wel. Het is al zo.'

// ---------- Ochtendritueel ----------

export const MORNING_INTRO: string[] = [
  'Goedemorgen. We beginnen rustig, waar je nu bent.',
]

export const SEGMENT_INTRO =
  'Uit welke stukken bestaat je dag? Noem het eerste deel, hardop of getikt.'

export const ENTHUSIASM_Q1 =
  'Wat is op dit moment het meest opwindende dat je vandaag zou kunnen doen? Hoe klein ook.'
export const ENTHUSIASM_Q2 = 'Wat is de kleinst mogelijke stap die je er nu voor kunt zetten?'
export const ENTHUSIASM_Q3 = 'En wat verwacht je ervan?'
export const ENTHUSIASM_RELEASE =
  'Zet die verwachting even opzij. Doe het omdat het leuk is, niet om wat het oplevert.'

// ---------- Avondritueel ----------

export const REVISION_Q = 'Wat ging er vandaag anders dan je wilde?'
export const REVISION_REPLAY =
  'Speel het opnieuw af. Precies zoals je het gewild had. ' +
  'Zie het gebeuren zoals het had moeten gaan, en voel hoe dat is.'
export const REVISION_CLOSE =
  'Zo is het gegaan. Dat is de versie die je meeneemt de nacht in.'

export const POSITIVE_ASPECTS_Q = (subject: string) =>
  `Denk aan ${subject}. Noem zestig seconden lang alles wat er goed aan is.`
export const RAMPAGE_INTRO =
  'Laat het maar komen. Alles waar je dankbaar voor bent, in willekeurige volgorde. Ik onderbreek je niet.'

// ---------- Nu even niet oké ----------

export const URGENT_OPENING = 'Niets beantwoorden. Nog niet.'
export const URGENT_RULE = 'Reageren mag pas over 24 uur. Dit staat morgen om negen uur op je lijst.'

// ---------- Bashar-definitie van overvloed ----------

export const ABUNDANCE_DEFINITION =
  'Overvloed is kunnen doen wat je moet doen, wanneer je het moet doen. ' +
  'Kijk eens hoe vaak dat vandaag lukte.'

// ---------- Prosperity Game — vrolijke reacties ----------

export const PROSPERITY_RESPONSES: string[] = [
  'Mooi. Dat mag. Uitgegeven, en het voelde goed.',
  'Prima keuze. Weg ermee, met plezier.',
  'Ja. Precies waar geld voor is.',
  'Heerlijk. Dat is geld dat zijn werk heeft gedaan.',
  'Goed zo. Ruim en zonder aarzelen.',
  'Dat is er eentje om te vieren. Volgende.',
]

export const PROSPERITY_EMPTY =
  'Alles op. Vandaag met plezier tot de laatste euro uitgegeven. Zo hoort het.'

// ---------- Virtual Reality-proces ----------

export const VR_QUESTIONS: string[] = [
  'Waar ben je?',
  'Wie is erbij?',
  'Wat ruik je?',
  'Wat hoor je?',
  'Wat doe je met je handen?',
  'En hoe voelt het in je borst?',
]
export const VR_CLOSE =
  'Dit is niet iets wat je wilt. Dit is iets wat je nu bezoekt.'

// ---------- Overtuigingen opgraven (Bashar) ----------

export const BELIEF_QUESTIONS: string[] = [
  'Wat voel je precies?',
  'Wat zou er waar moeten zijn over de wereld om je zó te laten voelen?',
  'Wat zou er waar moeten zijn over jou?',
  'Wanneer heb je die overtuiging voor het eerst nodig gehad? En wat beschermde die toen?',
  'Als het niet waar hoefde te zijn, wie zou je dan zijn?',
]
export const BELIEF_REWRITE = 'Schrijf de definitie opnieuw. Zeg hardop hoe het voortaan is.'

// ---------- Terugkomst na afwezigheid ----------

export const WELCOME_BACK = 'Fijn dat je er weer bent. We beginnen gewoon waar je nu staat.'

// ---------- Emotionele schaal (22 treden) ----------
// index 0 = bovenaan (best). affirmations = gedachten die op die trede thuishoren;
// ze worden aangeboden aan wie één of twee treden lager staat.

export interface ScaleRung {
  label: string
  affirmations: string[]
}

export const EMOTIONAL_SCALE: ScaleRung[] = [
  {
    label: 'Vreugde · waardering · vrijheid · liefde',
    affirmations: [
      'Ik voel me licht en vrij, en ik geniet gewoon van dit moment.',
      'Er stroomt iets warms door me heen. Dit is genoeg.',
    ],
  },
  {
    label: 'Passie',
    affirmations: [
      'Er is iets waar ik echt zin in heb, en dat voelt levend.',
      'Ik merk vuur in me. Ik wil dit, en dat mag.',
    ],
  },
  {
    label: 'Enthousiasme · gretigheid · geluk',
    affirmations: [
      'Ik heb er zin in. Er komt vanzelf iets omhoog dat op plezier lijkt.',
      'Vandaag mag leuk worden, en ik voel dat het kan.',
    ],
  },
  {
    label: 'Positieve verwachting · geloof',
    affirmations: [
      'Ik verwacht dat dit goed gaat komen.',
      'Er is een goede kans dat vandaag me meevalt.',
    ],
  },
  {
    label: 'Optimisme',
    affirmations: [
      'Het kan best wel eens de goede kant op gaan.',
      'Ik zie een paar dingen die vandaag licht kunnen worden.',
    ],
  },
  {
    label: 'Hoop',
    affirmations: [
      'Misschien komt het wel goed. Dat idee mag er zijn.',
      'Er is een kant hieraan die hoopvol voelt.',
    ],
  },
  {
    label: 'Tevredenheid',
    affirmations: [
      'Op dit moment is het eigenlijk wel oké zo.',
      'Ik hoef nu even nergens heen. Dit is prima.',
    ],
  },
  {
    label: 'Verveling',
    affirmations: [
      'Er is rust genoeg om iets kleins te kiezen dat me trekt.',
      'Niets hoeft. Ik mag gewoon zien wat er langskomt.',
    ],
  },
  {
    label: 'Pessimisme',
    affirmations: [
      'Ik weet niet of het goed komt, maar ik hoef het nu niet zeker te weten.',
      'Misschien valt het uiteindelijk mee. Dat is ook mogelijk.',
    ],
  },
  {
    label: 'Frustratie · irritatie · ongeduld',
    affirmations: [
      'Ik ben geïrriteerd, en dat betekent dat ik iets wíl. Dat is niet niks.',
      'Er zit energie in deze irritatie. Ik hoef er nu niets mee.',
    ],
  },
  {
    label: 'Overweldiging',
    affirmations: [
      'Het is veel, maar ik hoef het niet allemaal tegelijk te doen.',
      'Eén ding tegelijk. De rest mag even wachten.',
    ],
  },
  {
    label: 'Teleurstelling',
    affirmations: [
      'Ik ben teleurgesteld, en dat komt doordat het me kon schelen.',
      'Dit liep anders, en toch is niet alles verloren.',
    ],
  },
  {
    label: 'Twijfel',
    affirmations: [
      'Ik weet het even niet, en dat mag. Ik hoef nu niet te kiezen.',
      'Twijfel betekent dat er meerdere wegen zijn. Dat is ook ruimte.',
    ],
  },
  {
    label: 'Zorgen',
    affirmations: [
      'Ik maak me zorgen, en dat is iets wat mensen doen als ze om iets geven.',
      'De meeste dingen waar ik me zorgen om maak, gebeuren nooit.',
    ],
  },
  {
    label: 'Verwijten',
    affirmations: [
      'Ik ben boos op iets of iemand, en daaronder zit dat ik iets belangrijk vind.',
      'Ik hoef nu niets recht te zetten. Ik mag het even laten.',
    ],
  },
  {
    label: 'Ontmoediging',
    affirmations: [
      'Het voelt zwaar, en toch heb ik eerder zware dingen doorstaan.',
      'Ik hoef nu geen berg te beklimmen. Alleen dit ene moment.',
    ],
  },
  {
    label: 'Boosheid',
    affirmations: [
      'Er zit kracht in deze boosheid. Ik ben in elk geval niet machteloos.',
      'Deze boosheid mag er zijn. Ze wijst me op iets dat er toe doet.',
    ],
  },
  {
    label: 'Wraakzucht',
    affirmations: [
      'Ik voel dat ik terug wil slaan, en dat is meer vuur dan verlamming.',
      'Onder deze felheid zit iets dat beschermd wil worden. Dat snap ik.',
    ],
  },
  {
    label: 'Haat · woede',
    affirmations: [
      'Er komt veel omhoog, en dat is beweging. Beweging is beter dan bevriezen.',
      'Ik hoef hier nu niets mee te doen. Het mag door me heen trekken.',
    ],
  },
  {
    label: 'Jaloezie',
    affirmations: [
      'Ik zie iets bij een ander dat ik ook wil. Nu weet ik tenminste wat ik wil.',
      'Deze jaloezie laat me een verlangen zien. Dat is bruikbaar.',
    ],
  },
  {
    label: 'Onzekerheid · schuld · onwaardigheid',
    affirmations: [
      'Ik voel me klein, en toch mag ik er zijn, precies zoals ik nu ben.',
      'Ik ben niet perfect, en dat hoeft ook niet. Ik doe wat ik kan.',
    ],
  },
  {
    label: 'Angst · verdriet · machteloosheid',
    affirmations: [
      'Dit is het zwaarste gevoel, en zelfs nu adem ik nog gewoon door.',
      'Ik hoef hier niet uit te komen. Ik hoef er alleen even bij te blijven.',
    ],
  },
]

// Kies gedachten die één of twee treden hoger liggen dan de huidige trede.
// Nooit meer dan twee treden hoger. (index 0 = bovenaan / best)
export function higherThoughts(currentIndex: number): string[] {
  const out: string[] = []
  for (const step of [1, 2]) {
    const target = currentIndex - step
    if (target >= 0 && EMOTIONAL_SCALE[target]) {
      out.push(...EMOTIONAL_SCALE[target].affirmations)
    }
  }
  if (out.length === 0) {
    // Al bovenaan: niets hogers aanbieden, alleen laten zijn.
    return ['Je staat al hoog. Blijf hier even. Je hoeft nergens heen.']
  }
  return out
}
