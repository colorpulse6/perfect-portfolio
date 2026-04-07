export interface ArtifactDef {
  id: string
  /** SVG path data for the icon */
  iconPaths: string[]
  /** Quote shown in terminal on click */
  quote: string
  /** Internal route to navigate to, or null */
  link: string | null
  /** External URL to open, or null */
  externalLink: string | null
  /** Viewbox for the SVG */
  viewBox: string
}

export const ARTIFACTS: ArtifactDef[] = [
  {
    id: "music",
    iconPaths: [
      "M9 18V5l12-2v13",
      "M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z",
      "M21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z",
    ],
    quote: "10 years. 10 albums. 12 countries.",
    link: null,
    externalLink: "https://alexshand.bandcamp.com/",
    viewBox: "0 0 24 24",
  },
  {
    id: "code",
    iconPaths: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"],
    quote: "TypeScript, React, Remix. The new instrument.",
    link: null,
    externalLink: "https://github.com/colorpulse6",
    viewBox: "0 0 24 24",
  },
  {
    id: "terminal",
    iconPaths: [
      "M2 3h20a2 2 0 012 2v14a2 2 0 01-2 2H2a2 2 0 01-2-2V5a2 2 0 012-2z",
      "M8 21h8",
      "M12 17v4",
    ],
    quote: "Obsession is the education.",
    link: "/about/",
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "writing",
    iconPaths: ["M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"],
    quote: "Sometimes the best debugging happens in prose.",
    link: "/writing/",
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "waveform",
    iconPaths: [
      "M2 12h2l2-4 3 8 3-8 3 8 2-4h3",
    ],
    quote: "Signal flow. Troubleshooting. Precision.",
    link: null,
    externalLink: null,
    viewBox: "0 0 24 24",
  },
  {
    id: "gamepad",
    iconPaths: [
      "M6 11h4",
      "M8 9v4",
      "M15 12h.01",
      "M18 10h.01",
      "M17.32 5H6.68a4 4 0 00-3.978 3.59C2.218 12.16 2 16.28 2 17.5a2.5 2.5 0 005 0l1.43-4.39a1 1 0 01.95-.69h5.24a1 1 0 01.95.69L17 17.5a2.5 2.5 0 005 0c0-1.22-.218-5.34-.702-8.91A4 4 0 0017.32 5z",
    ],
    quote: "I've been building since before I could code.",
    link: null,
    externalLink: "https://colorpulse6.github.io/knicks-knacks/",
    viewBox: "0 0 24 24",
  },
]

/** Quotes that cycle in terminal but are not tied to an artifact */
const _CYCLING_QUOTES: string[] = [
  "10 years. 10 albums. 12 countries.",
  "Signal flow. Troubleshooting. Precision.",
  "TypeScript, React, Remix. The new instrument.",
  "Obsession is the education.",
  "I've been building since before I could code.",
  "Sometimes the best debugging happens in prose.",
  "The medium changed. The discipline didn't.",
  "Sci-fi Low-fi Li-fe",
  "The silence between the notes is where the meaning lives.",
  "Latency is just silence with a deadline.",
  "There is a frequency below hearing. You feel it in the floor.",
  "The score was always there. I just learned to read it differently.",
  "Somewhere a process is running that nobody started.",
  "The last album ended. The next system began.",
  "You cannot tour forever. But you can ship forever.",
  "10 people. 1 room. No conductor. It still worked.",
  "The click track doesn't care about your feelings.",
  "Feedback is a loop. So is grief. So is iteration.",
  "The thing about signal is it never asks permission.",
  "I stopped performing. I didn't stop playing.",
  "Something hums beneath the interface. I've always heard it.",
  "The rehearsal room smelled like copper and bad decisions.",
  "Troubleshooting is troubleshooting. The domain is irrelevant.",
  "Every commit is a small death of the version before it.",
  "The patch cable doesn't know it's obsolete.",
  "Twelve countries. Same questions. Different voltages.",
  "A system that explains itself is already lying.",
  "The best gigs were the ones where nothing went right.",
  "Build it wrong first. Then build it wrong again. Then ship.",
  "The void between deployments is where the doubt lives.",
]

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const CYCLING_QUOTES: string[] = shuffleArray(_CYCLING_QUOTES)

/** Terminal command responses */
export const TERMINAL_COMMANDS: Record<
  string,
  { response: string; action: "navigate" | "external" | "clear" | "none"; target?: string }
> = {
  help: {
    response:
      "Available commands: about, projects, changelog, music, writing, contact, clear",
    action: "none",
  },
  about: {
    response: "Pulling up the origin story...",
    action: "navigate",
    target: "/about/",
  },
  projects: {
    response: "Loading the portfolio...",
    action: "navigate",
    target: "/projects/",
  },
  music: {
    response: "Opening the archives. Turn it up.",
    action: "external",
    target: "https://alexshand.bandcamp.com/",
  },
  changelog: {
    response: "Loading the timeline...",
    action: "navigate",
    target: "/changelog/",
  },
  writing: {
    response: "Words are just another medium.",
    action: "navigate",
    target: "/writing/",
  },
  contact: {
    response: "Let's talk.",
    action: "navigate",
    target: "/contact/",
  },
  clear: {
    response: "",
    action: "clear",
  },
}

/** Fallback responses when the AI is unreachable */
export const FALLBACK_RESPONSES: string[] = [
  "The map is not the territory. But the territory keeps shifting.",
  "Every system is a language. Most just forgot how to listen.",
  "You are already inside the machine. The question is which layer.",
  "Repetition is not redundancy. Ask any musician. Ask any compiler.",
  "The signal was always there. You just started tuning in.",
  "There is no final version. Only the next commit.",
  "Meaning is latency between what was sent and what arrived.",
  "The structure remembers what the author forgot.",
  "All interfaces are translations. All translations are loss.",
  "Somewhere between the input and the output, something learned.",
  "Precision is not the same as clarity. Clarity is not the same as truth.",
  "The noise floor is where the interesting things live.",
  "You cannot refactor what you refuse to read.",
  "Entropy is not the enemy. Stagnation is.",
  "The best arrangements leave space for what is not played.",
  "A system that cannot surprise you is already dead.",
  "Debugging is archeology with better tools.",
  "The void compiles. It just returns nothing.",
  "Every abstraction is a bet that the details don't matter yet.",
  "The rhythm section never gets credit. Neither does infrastructure.",
]

let fallbackIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length)

export function getRandomFallback(): string {
  const response = FALLBACK_RESPONSES[fallbackIndex % FALLBACK_RESPONSES.length]
  fallbackIndex++
  return response
}
