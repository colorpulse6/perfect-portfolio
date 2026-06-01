// Ambient declaration for gatsby-plugin-transition-link (ships no types).
// Covers the default TransitionLink component used for page transitions.
declare module "gatsby-plugin-transition-link" {
  import * as React from "react"

  interface TransitionPhase {
    length?: number
    delay?: number
    zIndex?: number
    [key: string]: unknown
  }

  interface TransitionLinkProps
    extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string
    exit?: TransitionPhase
    entry?: TransitionPhase
    activeClassName?: string
    partiallyActive?: boolean
  }

  const TransitionLink: React.FC<TransitionLinkProps>
  export default TransitionLink
}
