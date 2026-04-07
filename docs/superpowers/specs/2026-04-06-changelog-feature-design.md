# Changelog Feature Design

## Overview

A "changelog for my life" feature: a living feed of coding projects, writing, and updates to existing work. Featured entries float on the home page as frosted-glass cards alongside the existing icon artifacts. A dedicated `/changelog` page shows the full history with type filtering.

## Data Model

Changelog entries are markdown files in `content/changelog/`. Gatsby processes them via `gatsby-source-filesystem` and `gatsby-transformer-remark`.

### Frontmatter Schema

```markdown
---
title: "Sector Zero: New Playable Modes"
date: "2026-04-01"
type: "project"
link: "https://colorpulse6.github.io/knicks-knacks/sector-zero/"
image: "./sector-zero.png"
status: "in-progress"
featured: true
project: "Knicks Knacks"
---

Body text here. Supports full markdown.
```

### Fields

| Field | Required | Values | Purpose |
|-------|----------|--------|---------|
| title | yes | string | Entry title |
| date | yes | YYYY-MM-DD | Sort order and display |
| type | yes | `project` / `writing` / `update` | Categorization and badge color |
| link | no | URL | External link to the thing itself |
| image | no | relative path | Thumbnail image (sits next to .md file) |
| status | no | `in-progress` / `released` / `published` | Status badge |
| featured | no | boolean | If true, floats on home page |
| project | no | string | Parent project name (for `update` type) |

## Home Page: Featured Floating Cards

### Integration with DomArtifacts

The existing `DomArtifacts` component is extended to support two artifact types:

1. **Icon artifacts** (existing): 52px glass square, SVG icon, quote in terminal on click, navigates to section.
2. **Featured cards** (new): ~280px frosted-glass card with content from changelog entries where `featured: true`.

Both types share the same physics system: shoot in from screen edges at high speed, decelerate, drift slowly, dissolve after a duration.

### Featured Card Visual

- Type badge at top: "PROJECT" (blue), "WRITING" (amber), "UPDATE" (green) in small caps
- Status badge if present ("In Progress", "Released")
- Parent project name for `update` type entries
- Thumbnail image if provided
- Title (bold, white, 15px)
- Description (first ~100 chars of markdown body, muted, 12px)
- Two links at bottom: "View" (goes to entry's `link` URL) and "Changelog" (navigates to `/changelog`)

### Coexistence Rules

- Max 1 featured card visible at a time
- Max 2-3 icon artifacts visible simultaneously (unchanged)
- Featured cards have 20s cooldown (vs 10s for icons)
- Featured cards drift slower than icons (heavier feel)
- Featured cards decelerate sooner after shooting in
- Clicking the card: dissolves it, types the entry description in the terminal
- "View" link: opens the external URL
- "Changelog" link: navigates to `/changelog`

### Data Flow

Featured entries are queried via GraphQL at build time in the home page component and passed to `DomArtifacts` as a prop. The `DomArtifacts` component manages them in its artifact pool alongside the existing icon artifacts.

## /changelog Page

### Route and Navigation

- New Gatsby page at `src/pages/changelog.tsx`
- Added to sidebar navigation (SideBarCollapsed and SideBar)
- Added to terminal `help` command output
- Added `changelog` terminal command: types "Loading the timeline..." then navigates to `/changelog`

### Layout

- Matches existing site aesthetic (dark background, centered content)
- Max-width 720px content column (same as about page)
- Page title "CHANGELOG" in Montserrat uppercase (same as other page titles)

### Filter Bar

- Horizontal row of pill buttons: "All", "Projects", "Writing", "Updates"
- Client-side filtering (no page reload)
- "All" is active by default
- Subtle border/background change on active state

### Entry Rendering

Each entry displays (top to bottom):
- Date in small muted text (e.g., "April 1, 2026")
- Type badge (colored pill matching home page card colors)
- Status badge if present
- Parent project name for updates
- Title as a link (if `link` field exists, opens external URL)
- Body text from markdown (full content, rendered HTML)
- Thumbnail image if provided
- Subtle divider between entries

Entries sorted in reverse chronological order (newest first).

### Responsive

- Filter pills wrap on mobile
- Images scale to container width
- Same tablet (768px) and mobile (550px) breakpoints as rest of site

## Gatsby Configuration

### gatsby-config.js

Add a new `gatsby-source-filesystem` entry pointing to `content/changelog/`.

Install `gatsby-transformer-remark` and `gatsby-remark-images` if not already present.

### gatsby-node.js

No custom page creation needed. The `/changelog` page is a standard Gatsby page file. The markdown data is queried via `useStaticQuery` or page query with GraphQL.

## Constraints

- No em-dashes in any text content
- Follows existing site patterns (GSAP page transitions, collapsible sidebar, dark theme)
- Markdown files are the single source of truth. No CMS, no external API.
- Featured cards must not interfere with existing icon artifact click behavior
- The changelog page must work even with zero entries (empty state)
