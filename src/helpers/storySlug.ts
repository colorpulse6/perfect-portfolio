// Matches the slugify rule used for Writing nodes in gatsby-node.js.
export function storySlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export function storyFromHash(hash: string, titles: readonly string[]): string | null {
  const slug = hash.replace(/^#/, "")
  return titles.find(title => slug && storySlug(title) === slug) ?? null
}
