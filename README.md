# Ruim

Een persoonlijke, rustige web-app (PWA) in het Nederlands. Telefoon-first.
Eén gebruiker. Geen account, geen cloud, geen server — **alle data blijft op je toestel.**

De app lost je geldzaken niet op. Hij helpt je gemoedstoestand omhoog:
telkens één trede tegelijk. Waar sta je nu, en wat is het eerstvolgende trapje?

## De link

👉 **https://rich1970.github.io/spoorwijs/**

(De app heet *Ruim*; hij staat in de bestaande `spoorwijs`-repository, vandaar die naam in het adres.)

> **Eenmalig aanzetten (±30 seconden, alleen jij kunt dit).**
> De app is gebouwd, getest en klaargezet op de branch `gh-pages`. Om hem live te
> zetten hoef je één schakelaar om te zetten in GitHub:
> 1. Ga naar **github.com/Rich1970/spoorwijs → Settings → Pages**.
> 2. Bij **"Build and deployment" → "Source"** kies **"Deploy from a branch"**.
> 3. Bij **"Branch"** kies **`gh-pages`** en map **`/ (root)`**, klik **Save**.
>
> Na ±1 minuut staat de app live op de link hierboven. Dit hoeft maar één keer.

## Op je iPhone-beginscherm zetten

1. Open de link hierboven in **Safari** (niet in een andere browser).
2. Tik onderin op het **deel-icoon** (het vierkantje met het pijltje omhoog).
3. Kies **"Zet op beginscherm"**.
4. Tik rechtsboven op **"Voeg toe"**.

Er verschijnt nu een rond icoon "Ruim" op je beginscherm. Open hem daar vandaan:
hij opent schermvullend, zonder browserbalk, en werkt ook zonder internet
(vliegtuigmodus). De eerste keer heeft hij even internet nodig om zichzelf te bewaren.

> Zet je geluid aan en haal je telefoon van stil — de app práát je overal doorheen.
> Bij de eerste keer tikt Safari misschien om toestemming voor de microfoon (voor de
> spraakantwoorden). Dat mag je toestaan; het blijft allemaal op je toestel.

## Je cijfers invullen (één keer)

Onderin de app staat **📊 Feiten**. Daar vul je één keer in:

- je **totaal vermogen**,
- je **vaste maandlasten privé**,
- je **maandelijks passief inkomen**,
- je **vrijheidsgetal** (het passieve inkomen per maand waarbij werken optioneel wordt).

De app rekent daaruit in gewone taal hoe lang je gedekt bent, hoe ver je op weg bent,
en wat een maand niksdoen kost. **Deze cijfers verschijnen nergens anders in de app** —
alleen op dit scherm, en alleen als je er zelf om vraagt (en één keer bij *Nu even niet oké*,
als je er expliciet op tikt). In de nachtmodus komen ze nooit voor.

Bij **⚙️ Instellingen** kun je ook het bedrag zetten dat je echt op zak hebt (voor het
Wallet Process), je slaapscène kiezen of herschrijven, en de stem instellen.

## Back-up maken (zodat je nooit iets kwijtraakt)

Omdat alles op je toestel blijft, maak je zelf af en toe een back-up:

1. Ga naar **⚙️ Instellingen**.
2. Tik onderaan op **"Exporteer back-up"** — er wordt een bestandje bewaard
   (bijv. in *Bestanden* of *Downloads*).
3. Terugzetten kan altijd met **"Zet back-up terug"** en dat bestand kiezen.

Bewaar zo'n back-up bijvoorbeeld één keer per maand ergens veilig.

---

## De vier knoppen

- **🌙 Nacht** — wakker, kan niet slapen. Zwart scherm, de stem praat je in vijf fases
  naar de slaap. Wat je 's nachts inspreekt, staat de volgende ochtend op je lijst.
- **☀️ Ochtend** — de dag beginnen. Emotionele schaal, je intentie voor de dag,
  je hoogste enthousiasme.
- **🌆 Avond** — de dag afsluiten. De dag herzien zoals je hem had gewild, waarderen,
  en met dezelfde slaapscène inslapen.
- **⚡ Nu even niet oké** — factuur, bericht of dip. Even niets beantwoorden,
  eerst een trede omhoog. Reageren mag pas over 24 uur.

Onderin: **Spelen** (plezier in uitgeven trainen), **Overvloed** (je mensen & bewijs),
**Feiten** (je cijfers), **Instellingen**.

---

## Voor de techneut

- Vite + React + TypeScript + Tailwind CSS, PWA via `vite-plugin-pwa`.
- Geen backend. Opslag in `localStorage` met export/import.
- Stem uit: Web Speech API (`speechSynthesis`, nl-NL), optioneel ElevenLabs
  (key in Instellingen, standaard leeg).
- Stem in: Web Speech API (`SpeechRecognition`, nl-NL), met tekst als terugval.

```bash
npm install
npm run dev       # lokaal ontwikkelen
npm run build     # productie-build (root); of BASE_PATH=/spoorwijs/ voor GitHub Pages
npm run preview   # de build bekijken
```

Deploy op GitHub Pages: de `gh-pages` branch bevat de gebouwde site (subpad
`/spoorwijs/`). Bijwerken na een wijziging: `bash scripts/publish-ghpages.sh`.

Voor een deploy op de root (bijv. Vercel/Netlify) werkt de build zonder `BASE_PATH`;
`vercel.json` staat klaar. Op Vercel: importeer de repo, het framework (Vite) wordt
automatisch herkend, klaar.
