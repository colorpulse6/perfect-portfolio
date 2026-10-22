export interface SceneItem {
  id: string
  label: string
  tint: readonly [readonly [number, number, number], readonly [number, number, number]]
}

export interface AppItem {
  name: string
  medium: string
  status: string
  image: string
  link: string
  github: string
  tech: string[]
  blurb: string
  open?: string
  mark?: string
}

export interface StoryItem {
  title: string
  num: string
  link: string
}

export interface EssayItem {
  title: string
  num: string
  meta: string
  link: string
  image: string
  excerpt: string
}

export interface LogItem {
  title: string
  num: string
  kindLabel: string
  meta: string
  link: string
  excerpt: string
}

export type InlinePart = { kind: "text" | "code" | "link"; text: string; href?: string }
export type LetterBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; parts: InlinePart[] }
  | { kind: "image"; alt: string; src: string; file?: string }

export interface Letter {
  num: string
  title: string
  date: string
  meta: string
  link: string
  excerpt: string
  blocks: LetterBlock[]
}

export interface ScrollData {
  scenes: SceneItem[]
  bio: [string, string]
  projects: AppItem[]
  tools: AppItem[]
  stories: StoryItem[]
  essays: EssayItem[]
  changelog: LogItem[]
  letters: Letter[]
}
