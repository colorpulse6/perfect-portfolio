import React, { useMemo } from "react"
import { graphql } from "gatsby"
import SEO from "../components/seo"
import AtlasCanvas from "../components/atlas/AtlasCanvas"
import { NB } from "../components/atlas/atlasShared"
import type {
  AtlasDomain,
  AtlasWork,
  FictionStory,
  EssayItem,
  ChangelogItem,
} from "../components/atlas/atlasShared"
import { resolveProjectMedia } from "../helpers/projectImages"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import "./atlas.css"

interface ProjectNode {
  name: string
  description: string
  link: string
  github: string | null
  imgSrc: string
  techArray: number[]
  ref: string
  cluster: string
  status: string
  medium: string
  tech: string[]
}
interface WritingNode {
  title: string
  content: string
}
interface MarkdownNode {
  frontmatter: {
    title: string
    date: string
    type: string
    status: string | null
    project: string | null
    link: string | null
    media: string | null
  }
  excerpt: string
}

interface AtlasPageProps {
  transitionStatus?: string
  location: GatsbyLocation
  data: {
    allProject: { nodes: ProjectNode[] }
    allWriting: { nodes: WritingNode[] }
    allMarkdownRemark: { nodes: MarkdownNode[] }
  }
}

// CTA label by cluster, with a few per-project overrides where it reads better.
const CTA_CLUSTER: Record<string, string> = {
  obsidian: "Install",
  web: "Visit",
  games: "Play",
  tools: "Visit",
  ai: "Open",
  music: "Listen",
  sites: "Visit",
}
const CTA_NAME: Record<string, string> = {
  "El Form": "Docs",
  Throttle: "Download",
  "Knicks Knacks": "Open",
}

// Curated bodies that aren't in allProject (kept atlas-only; /projects unchanged).
const CURATED: Record<string, AtlasWork[]> = {
  obsidian: [
    {
      t: "Cerebro Mycelium",
      meta: "vault as a living fungal network",
      body: "Renders a vault as a living fungal network. Notes become soft kind-clusters, wikilinks become curved hyphae, and recent notes glow as fruiting bodies.",
      media: resolveProjectMedia("Cerebro Mycelium", ""),
      medium: "OBSIDIAN PLUGIN",
      tech: ["TypeScript", "Canvas 2D", "Recency model"],
      status: "released",
      cta: "Install",
      link: "https://community.obsidian.md/plugins/cerebro-mycelium",
    },
  ],
  games: [
    {
      t: "Sector Zero",
      meta: "procedural space survival + co-op",
      body: "Procedural space survival with drop-in co-op. New modes in active development.",
      media: null,
      medium: "BROWSER GAME",
      tech: ["TypeScript", "Canvas"],
      status: "in-progress",
      cta: "Play",
      link: "https://colorpulse6.github.io/knicks-knacks/sector-zero/",
    },
  ],
  music: [
    {
      t: "Alex's Hand",
      meta: "10 years · 10 albums · 12 countries",
      body: "A decade as a composer and bandleader. Ten albums across twelve countries, leading a ten-piece ensemble through the US and Europe.",
      media: null,
      medium: "MUSIC",
      tech: [],
      status: "archive",
      cta: "Listen",
      link: "https://alexshand.bandcamp.com/",
    },
  ],
}

const AtlasPage: React.FC<AtlasPageProps> = ({ transitionStatus, location, data }) => {
  usePageTransition(transitionStatus, ".atlas-page", { enter: 1, exit: 0.4, mount: 1 })

  const { domains, fiction, essays, changelog } = useMemo(() => {
    const projects = data.allProject.nodes
    const md = data.allMarkdownRemark.nodes

    const toWork = (p: ProjectNode): AtlasWork => ({
      t: p.name,
      meta: p.description,
      body: p.description,
      media: resolveProjectMedia(p.name, p.imgSrc),
      medium: p.medium,
      tech: p.tech || [],
      status: p.status || "released",
      cta: CTA_NAME[p.name] || CTA_CLUSTER[p.cluster] || "Open",
      link: p.link,
      github: p.github || null,
    })
    const byCluster = (c: string) => projects.filter(p => p.cluster === c).map(toWork)

    const essayNodes = md.filter(n => n.frontmatter.type === "writing")
    const essays: EssayItem[] = essayNodes.map(n => ({
      t: n.frontmatter.title,
      date: n.frontmatter.date,
      body: n.excerpt,
      link: n.frontmatter.link,
      media: n.frontmatter.media || null,
      status: n.frontmatter.status || "published",
    }))
    const essayWorks: AtlasWork[] = essayNodes.map(n => ({
      t: n.frontmatter.title,
      meta: n.excerpt,
      body: n.excerpt,
      link: n.frontmatter.link,
      cta: "Read",
      status: n.frontmatter.status || "published",
      date: n.frontmatter.date,
      media: n.frontmatter.media || null,
      shell: 0,
    }))

    const fiction: FictionStory[] = data.allWriting.nodes.map(w => ({
      title: w.title,
      content: w.content,
    }))

    const changelog: ChangelogItem[] = md.map(n => ({
      t: n.frontmatter.title,
      date: n.frontmatter.date,
      type: n.frontmatter.type,
      status: n.frontmatter.status,
      project: n.frontmatter.project,
    }))

    const obsidianWorks = [...byCluster("obsidian"), ...CURATED.obsidian]
    const webWorks = byCluster("web")
    const gamesWorks = [...byCluster("games"), ...CURATED.games]
    const toolsWorks = byCluster("tools")
    const aiWorks = byCluster("ai")
    const sitesWorks = byCluster("sites")
    const musicWorks = CURATED.music

    // Canonical hub order. EDGES in AtlasCanvas reference these indices:
    // [me, obsidian, web, games, tools, music, writing, ai, sites].
    const domains: AtlasDomain[] = [
      {
        id: "me",
        label: "NICHALAS BARNES",
        tag: "software engineer & composer",
        c: NB.indigo,
        p: [0, 0, 0],
        core: true,
        bio: "Seattle → Berlin → Madrid. A decade leading a 10-piece ensemble, now orchestrating systems and agents. The medium changed; the discipline didn't.",
      },
      {
        id: "obsidian",
        label: "OBSIDIAN",
        tag: "plugins",
        unit: "plugins",
        c: NB.cyan,
        p: [0.05, 0.78, 0.22],
        count: obsidianWorks.length,
        works: obsidianWorks,
      },
      {
        id: "web",
        label: "WEB",
        tag: "web apps",
        unit: "apps",
        c: NB.blue,
        p: [0.82, 0.18, -0.25],
        count: webWorks.length,
        works: webWorks,
      },
      {
        id: "games",
        label: "GAMES",
        tag: "builds",
        unit: "builds",
        c: NB.pink,
        p: [-0.84, 0.3, 0.1],
        count: gamesWorks.length,
        works: gamesWorks,
      },
      {
        id: "tools",
        label: "TOOLS",
        tag: "libraries · SDKs",
        unit: "tools",
        c: NB.steel,
        p: [0.4, -0.62, 0.42],
        count: toolsWorks.length,
        works: toolsWorks,
      },
      {
        id: "music",
        label: "MUSIC",
        tag: "Alex's Hand",
        unit: "albums",
        c: "#f2ab47",
        warm: true,
        p: [-0.52, -0.52, -0.34],
        count: 10,
        works: musicWorks,
      },
      {
        id: "writing",
        label: "WRITING",
        tag: "essays + fiction",
        unit: "pieces",
        c: NB.lilac,
        p: [0.3, 0.42, -0.82],
        shells: ["ESSAYS", "FICTION"],
        count: essays.length + fiction.length,
        works: essayWorks,
      },
      {
        id: "ai",
        label: "AI",
        tag: "agent orchestration",
        unit: "systems",
        c: NB.purple,
        p: [-0.3, -0.2, 0.66],
        count: aiWorks.length,
        works: aiWorks,
      },
      {
        id: "sites",
        label: "SITES",
        tag: "live web destinations",
        unit: "sites",
        c: "#46c79c",
        p: [0.6, -0.25, -0.72],
        count: sitesWorks.length,
        works: sitesWorks,
      },
    ]

    return { domains, fiction, essays, changelog }
  }, [data])

  return (
    <div className="atlas-page" style={{ opacity: 0 }}>
      <SEO title="Atlas" description="A 3D galaxy-map of Nichalas Barnes' work. Drag to rotate, dive into a cluster, and explore projects, essays, and fiction." pathname={location?.pathname} />
      <AtlasCanvas domains={domains} fiction={fiction} essays={essays} changelog={changelog} />
    </div>
  )
}

export const query = graphql`
  query AtlasData {
    allProject {
      nodes {
        name
        description
        link
        github
        imgSrc
        techArray
        ref
        cluster
        status
        medium
        tech
      }
    }
    allWriting {
      nodes {
        title
        content
      }
    }
    allMarkdownRemark(sort: { frontmatter: { date: DESC } }) {
      nodes {
        frontmatter {
          title
          date
          type
          status
          project
          link
          media
        }
        excerpt(pruneLength: 200)
      }
    }
  }
`

export default AtlasPage
