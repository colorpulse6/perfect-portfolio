# Responsive Refactor Plan

Reference roadmap for making the “Perfect Portfolio” Gatsby site responsive while staying with the existing CSS approach. Each stage builds on the previous, so please land them sequentially. Check off subtasks as they are completed and leave short notes or links to PRs/issues so the next agent has context.

---

## Objectives
- Deliver a consistent experience from large desktops down to ~360 px phones.
- Remove brittle fixed positioning/margins and rely on flexible layout primitives (flexbox/grid).
- Standardise typography, spacing, and component behaviour across pages.
- Preserve current animations/branding where possible; add fallbacks for users who opt out of motion.

---

## Global Prep (run once)
1. **Design tokens**  
   - Define breakpoint constants in `src/components/layout.css` (e.g. `--bp-xl: 1200px`, `--bp-lg: 1024px`, `--bp-md: 768px`, `--bp-sm: 600px`, `--bp-xs: 420px`).  
   - Introduce base spacing/typography custom properties (`--space-xxl`, `--font-heading`, `--font-body`, etc.) to replace repeated literal values.
2. **Utilities**  
   - Create shared utility classes if needed (e.g. `.container` narrow width, `.stack` vertical spacing). Keep them minimal to avoid conflicts.
3. **Testing checklist**  
   - Document target viewport widths (1440, 1280, 1024, 768, 640, 480, 360).  
   - Note browsers/devices available for manual QA.

---

## Step 1 — Layout Foundation
**Files:** `src/components/layout.tsx`, `src/components/layout.css`

1. Replace the inline wrapper styles with CSS classes and use responsive padding (`padding-inline: clamp(1rem, 2vw, 2rem)`).
2. Ensure the footer sits below content without large fixed margins; use logical spacing (`margin-block` vs absolute `bottom`).
3. Update `<main>` to expose layout utility classes if pages need consistent vertical rhythm.
4. Confirm the custom cursor code remains disabled or provide a `prefers-reduced-motion` check if re-enabled later.

---

## Step 2 — Header & Navigation
**Files:** `src/components/header.tsx`, `src/components/header.css`, `src/components/Hamburger.tsx`, `src/components/SideBar.js`, `src/components/SideBarCollapsed.js`, `src/components/sidebar.css`

1. **Header bar**
   - Move inline styles into CSS.  
   - Use `display: grid` or `flex` with wrapping so icons drop under the title on narrow screens.  
   - Scale icon size and spacing with clamp values; increase hit areas.
2. **Mobile menu / Sidebar**
   - Merge duplicated logic by exposing a single navigation component that renders as:
     - Fixed drawer (overlay) below `--bp-lg`.
     - Static left column or floating card above `--bp-lg`.
   - Replace the hardcoded 450 px width and negative offsets with `width: min(90vw, 340px)` for the drawer and `%`/`rem` for desktop.
   - Ensure menu links stack vertically with ample spacing on small devices and maintain focus outlines.
3. **State management**
   - Confirm the hamburger toggles `navOpen`; close the drawer on route change or link click.
4. **Accessibility**
   - Add `aria-expanded`/`aria-controls` on the hamburger.  
   - Trap focus inside the drawer when open (optional but preferred).

---

## Step 3 — Home Page (Hero)
**Files:** `src/pages/index.tsx`, `src/pages/index.css`

1. Replace negative margins with flexbox centring (`min-height: calc(100vh - header)` if required).  
2. Use `font-size: clamp(2.5rem, 8vw, 7.5rem)` for the hero text.  
3. Wrap the animated text background with `@media (prefers-reduced-motion: reduce)` to provide a solid color fallback.  
4. Verify the hero doesn’t overflow vertically on <600 px screens.

---

## Step 4 — About Page
**Files:** `src/pages/about.tsx`, `src/pages/about.css`

1. Convert the fixed margin layout to a centered container (`max-width: 960px`) with responsive padding.  
2. Above `--bp-lg`, use a two-column layout (text column + external links) via CSS grid; collapse to a single stack below.  
3. Adjust paragraph typography using the global tokens so line length stays readable.  
4. Ensure the “Music/Writing” links remain touch-friendly and visually balanced on small screens.

---

## Step 5 — Projects Page
**Files:** `src/pages/projects.tsx`, `src/pages/projects.css`, `src/components/Project.tsx`

1. Replace the `.flex` / `.flex-reverse` pattern with layout driven by CSS (e.g. `.project` wrapper using `grid` and `:nth-child(even)` to flip content order).  
2. Update card spacing to rely on `gap` instead of large `margin` values; remove negative offsets that collapse tech icons.  
3. Use responsive image sizing (`width: 100%`, `max-width`, `aspect-ratio: 16 / 9`; fallback for browsers without `aspect-ratio`).  
4. Ensure the tech icon strip wraps gracefully and scales icons down on narrow screens.  
5. Check animation libraries still behave when layout direction changes.

---

## Step 6 — Contact Page
**Files:** `src/pages/contact.tsx`, `src/pages/contact.css`

1. Convert the form layout to a responsive grid: `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`.  
2. Inputs should be full width on small screens; remove the fixed 50% width.  
3. Increase label/input spacing for touch; add visible focus styles.  
4. Align the submit button beneath the inputs and ensure it scales for narrow viewports.

---

## Step 7 — Writing Page
**Files:** `src/pages/writing.tsx`, `src/pages/writing.css`

1. Rework the story list into a responsive grid (`grid-template-columns` toggling between 1–3 columns based on width).  
2. Enhance card padding and hover/focus states for accessibility.  
3. Add horizontal padding within `.story-content` so text doesn’t butt against the viewport.  
4. Adjust typography with `clamp()` to keep paragraphs legible on very large or small screens.  
5. Consider lazy-loading or collapsing long stories if scrolling becomes awkward on mobile.

---

## Step 8 — QA & Post-Work
1. Run Lighthouse (or Chrome DevTools) for mobile/desktop; note any layout shifts or contrast issues.  
2. Verify GSAP/react-awesome-reveal animations respect `prefers-reduced-motion`. Provide fallbacks if necessary.  
3. Cross-test navigation: open drawer, interact with links, ensure scroll locking works.  
4. Document remaining edge cases (e.g. extremely long headings, missing project images).  
5. Update `README.md` with a short note about the responsive improvements and testing approach.

---

## Collaboration Notes
- Stick with plain CSS files/modules; avoid introducing Tailwind or other frameworks unless the owner requests it.  
- When editing shared files, annotate major refactors with succinct comments so the next contributor understands the intent.  
- After each stage, commit with a clear message (e.g. `feat(responsive): modernize layout spacing`) to keep work reviewable.  
- If unexpected styling conflicts appear (global selectors overriding modules), flag them in the PR and coordinate before proceeding.

