import { useMemo } from "react"
import { graphql, useStaticQuery } from "gatsby"
import { buildScrollData, type ScrollQueryData } from "./buildScrollData.ts"
import type { ScrollData } from "./types.ts"

import image0 from "../images/bot-battle.jpg"
import image1 from "../images/brain-atlas.jpg"
import image2 from "../images/cerebro.jpg"
import image3 from "../images/chimera.jpg"
import image4 from "../images/claude-skills.jpg"
import image5 from "../images/codex-eye.jpg"
import image6 from "../images/el-form.jpg"
import image7 from "../images/essay-agile-anarchy.jpg"
import image8 from "../images/galatlas.jpg"
import image9 from "../images/job-toast.jpg"
import image10 from "../images/knicks-knacks.jpg"
import image11 from "../images/polis-atlas.jpg"
import image12 from "../images/regexplain.jpg"
import image13 from "../images/sector-zero.jpg"

const IMAGE_URLS: Record<string, string> = {
  "bot-battle.jpg": image0,
  "brain-atlas.jpg": image1,
  "cerebro.jpg": image2,
  "chimera.jpg": image3,
  "claude-skills.jpg": image4,
  "codex-eye.jpg": image5,
  "el-form.jpg": image6,
  "essay-agile-anarchy.jpg": image7,
  "galatlas.jpg": image8,
  "job-toast.jpg": image9,
  "knicks-knacks.jpg": image10,
  "polis-atlas.jpg": image11,
  "regexplain.jpg": image12,
  "sector-zero.jpg": image13,
}

export function useScrollData(): ScrollData {
  const query = useStaticQuery<ScrollQueryData>(graphql`
    query ScrollScenesData {
      allProject { nodes { name slug medium status link github tech description } }
      allWriting { nodes { title } }
      changelog: allMarkdownRemark(
        filter: { fields: { sourceInstanceName: { eq: "changelog" } } }
        sort: { frontmatter: { date: DESC } }
      ) {
        nodes {
          frontmatter { title date type project }
          rawMarkdownBody
          parent { ... on File { name } }
        }
      }
      newsletter: allMarkdownRemark(
        filter: { fields: { sourceInstanceName: { eq: "newsletter" } } }
        sort: { frontmatter: { date: DESC } }
      ) {
        nodes { fields { slug } frontmatter { title date issue deck } rawMarkdownBody }
      }
      allFile(filter: { sourceInstanceName: { eq: "newsletter" }, extension: { in: ["jpg", "png"] } }) {
        nodes { relativePath childImageSharp { resize(width: 720, quality: 72, toFormat: JPG) { src width height } } }
      }
    }
  `)
  // one object per query result, so ScrollScenes (memo) never re-renders over the engine or reboots it
  return useMemo(() => buildScrollData(query, IMAGE_URLS), [query])
}
