// Structured data (JSON-LD) for SEO + LLM / AI-search visibility (GEO).
//
// A stable Person + WebSite identity graph is emitted on every page (via the SEO
// component). Pages add their own nodes (ProfilePage, SoftwareApplication,
// Article, etc.). Everything is connected by @id so engines resolve one entity.

const SITE_URL = "https://nichalasbarnes.com"
export const PERSON_ID = `${SITE_URL}/#person`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const MUSIC_GROUP_ID = `${SITE_URL}/#alexshand`

export type JsonLd = Record<string, unknown>

/** The canonical identity. `sameAs` is the strongest entity-resolution signal. */
export const PERSON: JsonLd = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Nichalas Barnes",
  alternateName: "Nic Barnes",
  jobTitle: "Software Engineer & Composer",
  description:
    "Software engineer and composer. Builds Obsidian plugins, web apps, developer tools, and AI agent systems, after a decade leading a ten-piece ensemble across the US and Europe.",
  url: `${SITE_URL}/`,
  image: `${SITE_URL}/og-image.png`,
  sameAs: [
    "https://github.com/colorpulse6",
    "https://www.linkedin.com/in/nic-barnes-a3297217/",
    "https://medium.com/@colorpulse_6839",
    "https://www.npmjs.com/~colorpulse",
  ],
  memberOf: { "@id": MUSIC_GROUP_ID },
  knowsAbout: [
    "Software engineering",
    "TypeScript",
    "React",
    "Gatsby",
    "Obsidian plugin development",
    "AI agent orchestration",
    "Web application development",
    "Music composition",
    "Bandleading",
    "Audio engineering",
  ],
  knowsLanguage: ["English"],
}

export const WEBSITE: JsonLd = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: "Nichalas Barnes",
  description:
    "The portfolio of Nichalas Barnes: developer tools, web apps, games, Obsidian plugins, music, and writing.",
  publisher: { "@id": PERSON_ID },
  inLanguage: "en",
}

// The music half of the entity. MusicBrainz + Bandcamp are its sameAs anchors;
// member links it back to the Person so engines connect the two identities.
export const ALEX_HAND: JsonLd = {
  "@type": "MusicGroup",
  "@id": MUSIC_GROUP_ID,
  name: "Alex's Hand",
  description:
    "A ten-piece ensemble led by Nichalas Barnes, touring the US and Europe over a decade.",
  member: { "@id": PERSON_ID },
  sameAs: [
    "https://musicbrainz.org/artist/6e17224e-9498-417c-a593-9cf941ccf743",
    "https://alexshand.bandcamp.com/",
  ],
}

/** ProfilePage node for the About page; its mainEntity is the Person. */
export function profilePage(): JsonLd {
  const pageUrl = `${SITE_URL}/about/`
  return {
    "@type": "ProfilePage",
    "@id": `${pageUrl}#profilepage`,
    url: pageUrl,
    name: "About Nichalas Barnes",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": PERSON_ID },
  }
}

export interface ProjectSchemaInput {
  name: string
  description: string
  link: string
  github?: string | null
  cluster?: string
}

// Map an internal cluster to a schema.org applicationCategory.
const CLUSTER_CATEGORY: Record<string, string> = {
  obsidian: "DeveloperApplication",
  web: "WebApplication",
  games: "GameApplication",
  tools: "DeveloperApplication",
  ai: "DeveloperApplication",
}

/** A project rendered as a SoftwareApplication authored by the Person. */
export function softwareApplication(p: ProjectSchemaInput): JsonLd {
  const node: JsonLd = {
    "@type": "SoftwareApplication",
    name: p.name,
    description: p.description,
    url: p.link,
    applicationCategory:
      (p.cluster && CLUSTER_CATEGORY[p.cluster]) || "WebApplication",
    author: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
  }
  if (p.github) node.codeRepository = p.github
  return node
}

export interface ChangelogSchemaInput {
  title: string
  date: string
  type: string
  link?: string | null
}

/** A changelog entry rendered as an Article (writing) or CreativeWork. */
export function changelogEntry(e: ChangelogSchemaInput): JsonLd {
  const node: JsonLd = {
    "@type": e.type === "writing" ? "Article" : "CreativeWork",
    name: e.title,
    headline: e.title,
    datePublished: e.date,
    author: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
  }
  if (e.link) node.url = e.link
  return node
}

export interface FaqItem {
  q: string
  a: string
}

/** An FAQ rendered as FAQPage Question/Answer pairs (liftable by LLMs). */
export function faqPage(items: FaqItem[]): JsonLd {
  return {
    "@type": "FAQPage",
    "@id": `${SITE_URL}/about/#faq`,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    mainEntity: items.map(item => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }
}

/** A fiction / writing piece as a CreativeWork authored by the Person. */
export function creativeWork(item: { title: string; excerpt?: string }): JsonLd {
  const node: JsonLd = {
    "@type": "CreativeWork",
    name: item.title,
    genre: "Fiction",
    author: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
  }
  if (item.excerpt) node.abstract = item.excerpt
  return node
}

export interface BreadcrumbItem {
  name: string
  url: string
}

/** A BreadcrumbList for a page's position in the site hierarchy. */
export function breadcrumb(items: BreadcrumbItem[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/** Wrap the always-present identity nodes plus any page-specific nodes. */
export function buildGraph(extra: JsonLd[] = []): JsonLd {
  return {
    "@context": "https://schema.org",
    "@graph": [PERSON, WEBSITE, ALEX_HAND, ...extra],
  }
}
