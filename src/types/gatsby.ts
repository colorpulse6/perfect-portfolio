// Shared shape for the `location` object Gatsby passes to page components.
// Pages generally only read `pathname`; the rest are optional for completeness.
export interface GatsbyLocation {
  pathname: string
  search?: string
  hash?: string
  href?: string
  origin?: string
  protocol?: string
  host?: string
  hostname?: string
  port?: string
  state?: unknown
  key?: string
}
