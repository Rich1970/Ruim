// Ruim — spraaklaag.
// speak(): leest zinnen één voor één voor, met instelbare stiltes ertussen,
// en stopt onmiddellijk bij een tik. listen(): spraakherkenning nl-NL.
// Optioneel: mooiere stem via ElevenLabs als er een key is ingevuld.

export interface SpeakOptions {
  rate?: number // snelheid, standaard 0.85
  pitch?: number
  volume?: number // 0..1
  gapMs?: number // stilte tussen zinnen
  startDelayMs?: number // stilte vóór de eerste zin
  elevenLabsKey?: string
  voiceName?: string // gekozen browserstem
  onLine?: (index: number, total: number) => void
  onDone?: () => void
}

let sessionId = 0
let currentAudio: HTMLAudioElement | null = null
let speaking = false

const synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null

// ElevenLabs multilingual stem (spreekt Nederlands). Alleen gebruikt als er een key is.
const ELEVEN_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX' // "Matilda" — zachte vrouwenstem
const ELEVEN_MODEL = 'eleven_multilingual_v2'

export function speechSupported(): boolean {
  return !!synth && typeof SpeechSynthesisUtterance !== 'undefined'
}

let voicesCache: SpeechSynthesisVoice[] = []

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!synth) return resolve([])
    const existing = synth.getVoices()
    if (existing && existing.length) {
      voicesCache = existing
      return resolve(existing)
    }
    let done = false
    const handler = () => {
      if (done) return
      done = true
      voicesCache = synth.getVoices()
      resolve(voicesCache)
    }
    synth.addEventListener('voiceschanged', handler, { once: true })
    // Terugval als het event nooit komt.
    setTimeout(() => {
      if (done) return
      done = true
      voicesCache = synth!.getVoices()
      resolve(voicesCache)
    }, 800)
  })
}

export async function dutchVoices(): Promise<SpeechSynthesisVoice[]> {
  const all = await loadVoices()
  return all.filter((v) => v.lang && v.lang.toLowerCase().startsWith('nl'))
}

function pickVoice(voices: SpeechSynthesisVoice[], preferredName: string): SpeechSynthesisVoice | null {
  if (preferredName) {
    const byName = voices.find((v) => v.name === preferredName)
    if (byName) return byName
  }
  const nl = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('nl'))
  if (nl.length) {
    const score = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase()
      let s = 0
      // Gedownloade/verbeterde iOS-stemmen klinken veel warmer.
      if (/(enhanced|premium|verbeterd|siri|natural|neural)/.test(n)) s += 6
      // Bekende, prettigere Nederlandse stemmen.
      if (/(claire|ellen|femke|lotte|laura|xander)/.test(n)) s += 3
      if (!v.localService) s += 2 // cloud-stemmen zijn vaak voller
      return s
    }
    return [...nl].sort((a, b) => score(b) - score(a))[0]
  }
  return null
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Spreek één zin uit met de browserstem. Resolvet als de zin klaar is of afgebroken.
function speakLineBrowser(
  text: string,
  opts: SpeakOptions,
  mySession: number,
  voice: SpeechSynthesisVoice | null,
): Promise<void> {
  return new Promise((resolve) => {
    if (!synth || mySession !== sessionId) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    if (voice) u.voice = voice
    u.lang = voice?.lang || 'nl-NL'
    u.rate = opts.rate ?? 0.85
    u.pitch = opts.pitch ?? 1
    u.volume = opts.volume ?? 1
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    u.onend = finish
    u.onerror = finish
    try {
      synth.speak(u)
    } catch {
      finish()
    }
  })
}

// Probeer ElevenLabs; bij enige fout terug naar de browserstem.
async function speakLineEleven(
  text: string,
  opts: SpeakOptions,
  mySession: number,
): Promise<boolean> {
  const key = opts.elevenLabsKey
  if (!key) return false
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
        voice_settings: { stability: 0.55, similarity_boost: 0.7, style: 0.15 },
      }),
    })
    if (!res.ok || mySession !== sessionId) return false
    const buf = await res.arrayBuffer()
    if (mySession !== sessionId) return false
    const url = URL.createObjectURL(new Blob([buf], { type: 'audio/mpeg' }))
    await new Promise<void>((resolve) => {
      const audio = new Audio(url)
      currentAudio = audio
      audio.playbackRate = 1
      audio.volume = opts.volume ?? 1
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
    URL.revokeObjectURL(url)
    currentAudio = null
    return true
  } catch {
    return false
  }
}

/**
 * Lees regels voor, zin voor zin, met stiltes ertussen.
 * Resolvet wanneer alles gesproken is óf wanneer er gestopt wordt.
 */
export async function speak(lines: string[], opts: SpeakOptions = {}): Promise<void> {
  stopSpeaking()
  const mySession = ++sessionId
  speaking = true

  const voices = await loadVoices()
  if (mySession !== sessionId) return
  const voice = pickVoice(voices, opts.voiceName || '')

  if (opts.startDelayMs) {
    await sleep(opts.startDelayMs)
    if (mySession !== sessionId) return
  }

  for (let i = 0; i < lines.length; i++) {
    if (mySession !== sessionId) break
    const line = lines[i].trim()
    if (!line) continue
    opts.onLine?.(i, lines.length)

    const usedEleven = await speakLineEleven(line, opts, mySession)
    if (mySession !== sessionId) break
    if (!usedEleven) {
      await speakLineBrowser(line, opts, mySession, voice)
    }
    if (mySession !== sessionId) break

    if (i < lines.length - 1 && opts.gapMs) {
      await sleep(opts.gapMs)
    }
  }

  if (mySession === sessionId) {
    speaking = false
    opts.onDone?.()
  }
}

export function stopSpeaking(): void {
  sessionId++ // ongeldig maken van alle lopende sessies
  speaking = false
  try {
    synth?.cancel()
  } catch {
    /* ignore */
  }
  if (currentAudio) {
    try {
      currentAudio.pause()
      currentAudio.src = ''
    } catch {
      /* ignore */
    }
    currentAudio = null
  }
}

export function isSpeaking(): boolean {
  return speaking
}

// ---- Spraakherkenning (nl-NL) ----

type SR = typeof window & {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

export function recognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as SR
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
}

export interface ListenHandle {
  stop: () => void
}

export function listen(callbacks: {
  onResult?: (text: string, isFinal: boolean) => void
  onEnd?: (finalText: string) => void
  onError?: (err: string) => void
}): ListenHandle | null {
  if (!recognitionSupported()) return null
  const w = window as SR
  const Rec = w.SpeechRecognition || w.webkitSpeechRecognition
  const rec = new Rec()
  rec.lang = 'nl-NL'
  rec.interimResults = true
  rec.continuous = true
  rec.maxAlternatives = 1
  let finalText = ''
  let stopped = false

  rec.onresult = (e: any) => {
    let interim = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) finalText += r[0].transcript + ' '
      else interim += r[0].transcript
    }
    callbacks.onResult?.((finalText + interim).trim(), false)
  }
  rec.onerror = (e: any) => {
    callbacks.onError?.(e.error || 'error')
  }
  rec.onend = () => {
    if (!stopped) {
      // Sommige browsers stoppen vanzelf; laat de gebruiker het beheren.
      callbacks.onEnd?.(finalText.trim())
    }
  }
  try {
    rec.start()
  } catch {
    return null
  }
  return {
    stop: () => {
      stopped = true
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
      callbacks.onEnd?.(finalText.trim())
    },
  }
}
