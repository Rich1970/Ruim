# Spoorwijs 🚆

Met de trein door heel Europa — in één app plannen, vergelijken en vastleggen.
Web-app (desktop + telefoon), Nederlands met Engelse taaltoggle.

## Wat het doet (v1)

- **Reisplanner door de EU + UK** — 50+ steden, alle netwerken automatisch gecombineerd
  tot één doorgaande reis (NS, Eurostar, TGV, DB, SBB, ÖBB/Nightjet, Trenitalia, Renfe,
  Hellenic Train + veerboot naar Griekenland).
- **Prijsvergelijking** — snelste vs. goedkoopste vs. minste overstappen, plus 3 tarieven
  per reis (Voordeel / Standaard / Flexibel).
- **Kortingskaarten** — Interrail Pas (alleen reserveringskosten), BahnCard 25,
  NS Voordeelurenkaart.
- **Boekingsvenster** — tickets nog niet in de verkoop? De reis toont "Boekbaar vanaf …"
  en je kunt 'm nu al vastleggen.
- **Nachttreinen & veerboot** — bv. Amsterdam → Athene via trein + nachtveerboot Bari–Patras.
- **Reserveringsplicht per traject**, CO₂-vergelijking (trein vs. auto vs. vliegtuig).
- **Account** — inloggen/registreren (meerdere gebruikers), opgeslagen reizen & boekingen.
- **Herberekenen & meldingen** — check vlak voor vertrek op perronwijzigingen, vertraging,
  goedkopere alternatieven.
- **Verkoopvenster-alert** — leg een reis vast waarvan de tickets nog niet te koop zijn; zodra
  het boekingsvenster opengaat krijg je automatisch een melding **én een e-mail** ("verkoop geopend").
- **Afrekenen via Stripe (test)** met transparante 1% servicekosten, plus **bevestigingsmail**.
- **Boeken = vastleggen** in je account + afrekenen (Stripe test of deeplink naar de vervoerder).

## Draaien

```bash
cd spoorwijs
npm install
npm run dev      # http://localhost:5178
npm run build    # productie-build in dist/
```

**Live zetten:** de backend-seams draaien in productie als serverless functies
(`api/**`, zelfde logica als lokaal). Stappenplan: **[docs/deploy.md](docs/deploy.md)**.

## Architectuur

- **Vite + React + TypeScript + Tailwind CSS**, volledig client-side, zonder externe requests.
- `src/engine/` — het hart:
  - `data.ts` — stations (met coördinaten), operators, netwerk (verbindingen/graaf).
  - `planner.ts` — routing (Dijkstra op tijd/prijs/overstappen), dienstregeling-synthese met
    **getimede aansluitingen**, fare-tiers, kortingskaarten, boekingsvensters, CO₂.
  - `live.ts` — **live provider**: adapter over de open Transitous/MOTIS-API. Echte
    dienstregeling & routes door heel Europa (open GTFS-data), gemapt op het Journey-model.
    Tijden worden per stop in de juiste tijdzone getoond; prijzen worden geschat met het
    fare-model (open data bevat geen tarieven).
  - `search.ts` — orkestreert een **provider-keten: aggregator → live → lokale planner**, met een
    gedeelde cache. Zo werkt de app altijd (near-term = live, verre datum = schatting).
  - `aggregator.ts` — client-adapter voor de fase-2 boekingspartner (echte prijzen + tickets);
    valt terug zolang er geen partnersleutel + response-mapping is.
  - `email.ts` — transactionele e-mail (bevestiging + "verkoop geopend"), met HTML-renderers.
- `src/hooks/useSaleAlerts.ts` — tijdgestuurde watcher die vastgelegde reizen bewaakt en bij
  verkoopstart automatisch een melding + e-mail afvuurt.
- `server/handlers.mjs` — **één bron van waarheid** voor de drie backend-seams (stripe / email /
  aggregator), env-geïnjecteerd, serversleutels **buiten de browser**. Zonder sleutel draait elk in
  test-/simulatiemodus. Twee dunne adapters gebruiken dezelfde handlers:
  `server/*-dev.mjs` (Vite-middleware, lokaal) en `api/**/*.js` (Vercel serverless, productie).
  De frontend praat in beide gevallen met dezelfde `/api/...`-paden — zie [docs/deploy.md](docs/deploy.md).
- `src/pages/` — Home (zoeken), Results, JourneyDetail (boeken), Trips, Auth, Account.
- `src/state/store.tsx` — taal, auth (localStorage), opgeslagen reizen, meldingen.
- `src/i18n/` — NL + EN.

## Sleutels (allemaal optioneel — zonder draait alles in test-/simulatiemodus)

Kopieer `.env.example` naar `.env` en vul in wat je wilt activeren (nooit committen — staat in
`.gitignore`; herstart de dev-server na wijziging):

- `STRIPE_SECRET_KEY` (`sk_test_…`) — echte Stripe-testbetalingen i.p.v. de ingebouwde sandbox.
- `RESEND_API_KEY` (`re_…`) — verstuurt de bevestigings- en verkoop-mails echt (anders "gesimuleerd").
  Volledig stappenplan (incl. domeinverificatie voor mails naar klanten): **[docs/email-setup.md](docs/email-setup.md)**.
- `DISTRIBUSION_API_KEY` — fase-2 boekingspartner (vereist ook een getekend contract + response-mapping).

## Eerlijke grenzen & roadmap

- **Tijden & routes** komen live uit open data (Transitous/MOTIS) voor de komende maanden;
  daarbuiten een realistische schatting uit de eigen planner. **Prijzen** zijn indicaties
  (open data bevat geen tarieven).
- **Live-API via proxy**: in dev praat de browser same-origin via de Vite-proxy (`/motis`).
  In productie moet dit pad op de host/edge geproxied worden (of via een serverless functie),
  omdat een pure static build geen proxy heeft.
- **Betalen** kan al via **Stripe (test)** met een echte bevestigingsmail; **echte e-ticket-uitgifte**
  en echte prijzen vereisen nog een boekings-aggregator (Trainline/Distribusion) + contract. De seam
  (`aggregator.ts` + `server/aggregator-dev.mjs`) staat klaar en valt tot die tijd netjes terug.
- **E-mail** wordt echt verstuurd zodra een Resend-sleutel is ingesteld; zonder sleutel worden de
  mails "gesimuleerd" (klaargezet, niet bezorgd) zodat de flow zonder account testbaar blijft.
- **Verkoop-alert** is client-side tijdgestuurd (watcher op de opgeslagen reizen); een echte
  server-cron/push vereist de backend hieronder.
- **Persistentie** is nu per apparaat (localStorage); een backend + database geeft
  echte multi-device accounts (en server-side verkoop-alerts).

**Roadmap:** ✅ fase 1 live planning → 🚧 fase 2 boekings-aggregator (seam klaar, wacht op
partnercontract voor echte prijzen + in-app ticketing) → fase 3 directe operator-koppelingen + OSDM →
backend-accounts → app voor Duitse/Engelse gebruikers (i18n + engine zijn hier al op voorbereid).
