import { ABOUT_FAQ } from "../../../helpers/aboutFaq.ts"
import { storySlug } from "../../../helpers/storySlug.ts"
import { changelogItems, type ChangelogNode } from "./changelogItems.ts"
import { CHIMERA, ESSAYS, MEDIUM_OVERRIDE, BLURB_OVERRIDE, PRODUCTS, SCENES, TOOLS } from "./content.ts"
import { formatDate } from "./formatDate.ts"
import { letterBlocks } from "./letterBlocks.ts"
import type { AppItem, LetterBlock, ScrollData } from "./types.ts"

interface ProjectNode {
  name: string
  slug: string | null
  medium: string
  status: string
  link: string
  github: string | null
  tech: string[] | null
  description: string
}

interface NewsletterNode {
  fields: { slug: string }
  frontmatter: { title: string; date: string; issue: number; deck: string }
  rawMarkdownBody: string
}

interface ImageNode {
  relativePath: string
  childImageSharp: { resize: { src: string; width: number; height: number } } | null
}

export interface ScrollQueryData {
  allProject: { nodes: ProjectNode[] }
  allWriting: { nodes: { title: string }[] }
  changelog: { nodes: (Omit<ChangelogNode, "name"> & { name?: string; parent?: { name: string } })[] }
  newsletter: { nodes: NewsletterNode[] }
  allFile: { nodes: ImageNode[] }
}

const APP_IMAGES: Record<string, string> = {
  Cerebro: "cerebro.jpg", "Brain Atlas": "brain-atlas.jpg", GalAtlas: "galatlas.jpg",
  "Polis Atlas": "polis-atlas.jpg", "Job Toast": "job-toast.jpg", "El Form": "el-form.jpg",
  "Sector Zero": "sector-zero.jpg", "Claude Skills": "claude-skills.jpg",
  "Bot Battle": "bot-battle.jpg", Regexplain: "regexplain.jpg", "Knicks Knacks": "knicks-knacks.jpg",
}
const APP_VIDEOS: Record<string, string> = {
  Cerebro: "cerebro-mycelium.mp4", "Brain Atlas": "brain-atlas-spin.mp4",
  GalAtlas: "galatlas.mp4", "Polis Atlas": "polis-atlas.mp4", "El Form": "elform-docs-dark.mp4",
}

const BIO_REPLACE = "Brain Atlas and Cerebro Mycelium (Obsidian plugins), El Form (a typed React form library), and Throttle (a macOS usage tracker)"
const BIO_WITH = "Brain Atlas (an Obsidian plugin), and El Form (a typed form library)"

function mediumLabel(value: string): string {
  if (value.toUpperCase() === "WEB APP") return "Web app"
  if (value.toUpperCase() === "OBSIDIAN PLUGIN") return "Obsidian plugin"
  if (value.toUpperCase() === "MACOS APP") return "macOS app"
  return value
}

function bio(): [string, string] {
  const who = ABOUT_FAQ[0].a
  const builds = ABOUT_FAQ[1].a
  if (!builds.includes(BIO_REPLACE)) throw new Error("About FAQ bio trim target changed")
  return [who, builds.replace(BIO_REPLACE, BIO_WITH)]
}

export function buildScrollData(query: ScrollQueryData, imageUrls: Record<string, string> = {}): ScrollData {
  const nodes = new Map(query.allProject.nodes.map(node => [node.name, node]))
  const app = (name: string): AppItem | null => {
    if (name === "Chimera") return { ...CHIMERA, image: imageUrls[CHIMERA.image] ?? CHIMERA.image }
    const node = nodes.get(name)
    if (!node || node.status === "disabled") throw new Error(`Missing active project: ${name}`)
    return {
      name, medium: MEDIUM_OVERRIDE[name] ?? mediumLabel(node.medium), status: node.status,
      image: imageUrls[APP_IMAGES[name]] ?? APP_IMAGES[name], video: APP_VIDEOS[name] ? (imageUrls[APP_VIDEOS[name]] ?? APP_VIDEOS[name]) : undefined, link: node.link,
      github: node.github ?? "", tech: node.tech ?? [],
      blurb: BLURB_OVERRIDE[name] ?? node.description,
    }
  }
  const files = new Map(query.allFile.nodes.map(node => [node.relativePath, node.childImageSharp?.resize.src]))
  const letters = [...query.newsletter.nodes]
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date))
    .map(node => {
      const { title, date, issue, deck } = node.frontmatter
      const week = node.fields.slug
      const blocks: LetterBlock[] = letterBlocks(node.rawMarkdownBody).map(block => {
        if (block.kind !== "image") return block
        const path = `${week}/${block.src.replace(/^\.\//, "")}`
        const src = files.get(path)
        if (!src) throw new Error(`Missing newsletter image: ${path}`)
        return { ...block, src, file: path }
      })
      const formatted = formatDate(date)
      return { num: String(issue), title, date: formatted,
        meta: `The weekly letter · No. ${issue} · ${formatted}`,
        link: `/newsletter/${week}/`, excerpt: deck, blocks }
    })
  return {
    scenes: SCENES,
    bio: bio(),
    projects: PRODUCTS.map(app).filter((item): item is AppItem => item !== null),
    tools: TOOLS.map(app).filter((item): item is AppItem => item !== null),
    stories: query.allWriting.nodes.map((node, index) => ({
      title: node.title, num: String(index + 1).padStart(2, "0"),
      link: `/writing/#${storySlug(node.title)}`,
    })),
    essays: ESSAYS.map(essay => ({ ...essay, image: imageUrls[essay.image] ?? essay.image })),
    changelog: changelogItems(query.changelog.nodes.map(node => ({ ...node, name: node.parent?.name ?? node.name ?? "" }))),
    letters,
  }
}
