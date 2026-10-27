import type { AppItem, EssayItem, SceneItem } from "./types.ts"

// Scene order and tint values come from prototype index.html and scenes.js, r14.
export const SCENES: SceneItem[] = [
  { id: "hero", label: "Intro", tint: [[0.39, 0.24, 0.78], [0.31, 0.71, 0.86]] },
  { id: "about", label: "About", tint: [[0.86, 0.65, 0.31], [0.70, 0.50, 0.30]] },
  { id: "projects", label: "Projects", tint: [[0.55, 0.31, 0.82], [0.31, 0.20, 0.63]] },
  { id: "tools", label: "Tools and games", tint: [[0.30, 0.50, 0.80], [0.24, 0.31, 0.63]] },
  { id: "essays", label: "Essays", tint: [[0.62, 0.36, 0.52], [0.47, 0.30, 0.50]] },
  { id: "creative", label: "Creative", tint: [[0.24, 0.31, 0.47], [0.31, 0.35, 0.47]] },
  { id: "newsletter", label: "Newsletter", tint: [[0.62, 0.46, 0.30], [0.42, 0.34, 0.42]] },
  { id: "changelog", label: "Changelog", tint: [[0.30, 0.44, 0.62], [0.27, 0.36, 0.56]] },
  { id: "work", label: "Work with me", tint: [[0.24, 0.55, 0.47], [0.27, 0.55, 0.78]] },
  { id: "contact", label: "Contact", tint: [[0.30, 0.28, 0.62], [0.36, 0.34, 0.66]] },
  { id: "atlas", label: "Atlas", tint: [[0.35, 0.30, 0.50], [0.40, 0.35, 0.55]] },
]

export const SCENE_COPY = {
  hero: { headline: "Nichalas Barnes", tag: "Software engineer and composer.", lead: "I build product features, API integrations, and workflow automation." },
  about: { headline: "Composer first, then engineer." },
  projects: { headline: "Software you can explore." },
  tools: { headline: "Tools, games and experiments." },
  essays: { headline: "Ideas worth sitting with." },
  creative: { headline: "Stories and songs." },
  newsletter: { headline: "A weekly builder's notebook." },
  changelog: { headline: "A running ship log." },
  work: { headline: "Thoughtful software. From idea to working product.", lead: "I help product teams and agencies build features, connect systems, and turn manual workflows into useful software.", cta: "Start the conversation", link: "#contact" },
  contact: { headline: "Tell me about your project.", lead: "Share what you want to build or improve, your existing stack, and your target timeline." },
  atlas: { headline: "A living map of every medium.", lead: "A 3D galaxy map of the work. Drag to rotate, dive into a cluster, and explore projects, essays, and fiction.", cta: "Explore the Atlas", note: "The last station opens into it", link: "/atlas/" },
}

// The About facts under the bio (prototype index.html, r14).
export const ABOUT_FACTS: { label: string; text: string }[] = [
  { label: "Lived in", text: "Seattle, Berlin, Madrid" },
  { label: "Builds", text: "Obsidian plugins, web applications, browser games, developer tools, AI agent systems" },
  { label: "Also", text: "Composer and bandleader, Alex's Hand" },
]

// The one line each Tools card carries; Projects uses the full description in its panel.
export const CARD_LINE: Record<string, string> = {
  "Sector Zero": "Procedural space survival with drop-in co-op.",
  "Claude Skills": "A personal marketplace of skills for the PR workflow.",
  "Bot Battle": "LLM API testing metrics.",
  Regexplain: "Explain your regex in a way that is easy to understand.",
  "Knicks Knacks": "A browser arcade with profiles and stat tracking.",
}

export const PRODUCTS = ["Chimera", "Cerebro", "Brain Atlas", "GalAtlas", "Polis Atlas", "Job Toast", "El Form"]
export const TOOLS = ["Sector Zero", "Claude Skills", "Bot Battle", "Regexplain", "Knicks Knacks"]
export const MEDIUM_OVERRIDE: Record<string, string> = {
  "El Form": "Form library", "Sector Zero": "Web game", "Claude Skills": "Claude Code",
  "Bot Battle": "Web app", Regexplain: "Web app", "Knicks Knacks": "Web games",
}
export const BLURB_OVERRIDE: Record<string, string> = {
  "Job Toast": "A shared home for the moving parts of a job search: saved roles, application stages, notes and contacts in one workspace, with a browser extension for saving jobs and AI-assisted cover letter drafts.",
}

// Chimera is the one product absent from the Gatsby Project nodes in r14.
export const CHIMERA: AppItem = {
  name: "Chimera", medium: "Game", status: "in progress", image: "chimera.jpg", video: "chimera-walk.mp4",
  link: "https://projectchimera.dev/",
  github: "https://github.com/colorpulse6/project-chimera",
  tech: ["Unreal Engine 5", "Astro"], open: "Where the game stands",
  blurb: "A JRPG in a painted hill town, with a hero who is drawn rather than modelled. Designed, art-directed and built in Unreal Engine 5; the site is the live status record of the build.",
}

export const TECH_ICON: Record<string, string> = {
  Swift: "swift", SwiftUI: "swiftui", "Multi-agent": "agents", TypeScript: "typescript",
  Canvas: "canvas", "Canvas 2D": "canvas", "Obsidian API": "obsidian", React: "react",
  "Three.js": "threejs", Vite: "vite", Zustand: "zustand", "Claude Code": "claude",
  Python: "python", Bash: "bash", Turborepo: "turborepo", "Unreal Engine 5": "unrealengine", Astro: "astro",
}

export const ESSAYS: EssayItem[] = [
  { num: "01", title: "Agile Anarchy: What’s Left?", meta: "Essay · Medium · 30 March 2026", link: "https://medium.com/@colorpulse_6839/agile-anarchy-whats-left-7679ffe91fa8", image: "essay-agile-anarchy.jpg", excerpt: "There is a lot of talk about engineers and designers being replaced by AI. Everyone can feel the ground moving, in fact its practically breaking apart under our feet, but very few are willing to follow that logic all the way to its absolute conclusion." },
  { num: "02", title: "Codex & the Human Coder: Why AI Needs Our Wisdom (And Our IDE(A)s)", meta: "Essay · Medium · 9 June 2025", link: "https://medium.com/@colorpulse_6839/codex-the-human-coder-why-ai-needs-our-wisdom-and-our-ide-a-s-140f35f6af16", image: "codex-eye.jpg", excerpt: "This article offers a more optimistic take: Codex and its kin are transformative assistants, not replacements. They are the next logical step in the long history of programming abstraction." },
]

export const RELEASES = [
  { title: "Hungarian Spa", date: "October 2019", tracks: 16, description: "A rock-in-opposition album about a spa as a cleanse for regret; the band's final album", link: "https://alexshand.bandcamp.com/album/hungarian-spa", cover: "alexs-hand-hungarian-spa.jpg" },
  { title: "KaTaTaK", date: "September 2017", tracks: 5, description: "The fourth studio album, with jazz and orchestral elements and story-driven pieces", link: "https://alexshand.bandcamp.com/album/katatak", cover: "alexs-hand-katatak.jpg" },
  { title: "Künstler Scheiße", date: "June 2016", tracks: 8, description: "Avant-rock blending progressive rock, jazz-rock and orchestral textures with a rotating lineup of guests", link: "https://alexshand.bandcamp.com/album/k-nstler-schei-e", cover: "alexs-hand-kunstler-scheisse.jpg" },
  { title: "Goblinsz...?1!", date: "April 2016", tracks: 12, description: "An improvised session by Nic Barnes and Kellen Mills with guest Adam Meszaros", link: "https://alexshand.bandcamp.com/album/goblinsz-1", cover: "alexs-hand-goblinsz.jpg" },
  { title: "Alex's Hand presents: The Roaches", date: "March 2014", tracks: 15, description: "A concept album with shifting styles, spoken-word interludes and a pulpy, cinematic feel", link: "https://alexshand.bandcamp.com/album/alexs-hand-presents-the-roaches", cover: "alexs-hand-the-roaches.jpg" },
  { title: "Cancumbia", date: "September 2013", tracks: 5, description: "Live at Columbia City Theater for Seattle's Seaprog Festival, June 2013", link: "https://alexshand.bandcamp.com/album/cancumbia", cover: "alexs-hand-cancumbia.jpg" },
  { title: "An Albatross Around The Neck", date: "June 2013", tracks: 12, description: "The album that followed the Madame Psychosis EP", link: "https://alexshand.bandcamp.com/album/an-albatross-around-the-neck", cover: "alexs-hand-an-albatross-around-the-neck.jpg" },
  { title: "This cat is a genius.", date: "April 2013", tracks: 7, description: "B-sides and off-cuts previewing the debut album", link: "https://alexshand.bandcamp.com/album/this-cat-is-a-genius", cover: "alexs-hand-this-cat-is-a-genius.jpg" },
  { title: "Madame Psychosis", date: "October 2012", tracks: 4, description: "The debut EP", link: "https://alexshand.bandcamp.com/album/madame-psychosis", cover: "alexs-hand-madame-psychosis.jpg" },
] as const

export const COLORPULSE_ALBUMS = [
  { title: "Plazma", link: "https://soundcloud.com/colorpulse/sets/plazma-1" },
  { title: "Sorry", link: "https://soundcloud.com/colorpulse/sets/sorry-1" },
  { title: "This Now", link: "https://soundcloud.com/colorpulse/sets/this-now-1" },
] as const

export const SOCIAL = [
  { label: "GitHub", href: "https://github.com/colorpulse6", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/nic-barnes-a3297217/", icon: "linkedin" },
  { label: "Medium", href: "https://medium.com/@colorpulse_6839", icon: "medium" },
  { label: "npm", href: "https://www.npmjs.com/~colorpulse", icon: "npm" },
  { label: "Support", href: "https://buymeacoffee.com/nicbarnes", icon: "buymeacoffee" },
]
