import { formatDate } from "./formatDate.ts"
import type { LogItem } from "./types.ts"

export interface ChangelogNode {
  name: string
  frontmatter: { title: string; date: string; type: string; project: string | null }
  rawMarkdownBody: string
}

export function changelogItems(nodes: readonly ChangelogNode[]): LogItem[] {
  return [...nodes]
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date) || a.name.localeCompare(b.name))
    .slice(0, 6)
    .map(node => {
      const { title, date, type, project } = node.frontmatter
      const formatted = formatDate(date)
      const month = formatted.split(" ")[1].slice(0, 3)
      const first = node.rawMarkdownBody.trim().split(/\n\s*\n/, 1)[0].replace(/\s*\n\s*/g, " ")
      return {
        title,
        num: String(Number(date.slice(8, 10))),
        kindLabel: `${month} ${date.slice(0, 4)}`,
        meta: `${type[0].toUpperCase()}${type.slice(1)} · ${project ?? ""} · ${formatted}`,
        link: "/changelog/",
        excerpt: first,
      }
    })
}
