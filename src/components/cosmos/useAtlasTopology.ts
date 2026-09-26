import { useMemo } from "react"
import { graphql, useStaticQuery } from "gatsby"
import { buildAtlasModel } from "../atlas/buildAtlasModel"
import type { ProjectNode, WritingNode, ChangelogNode } from "../atlas/buildAtlasModel"
import { topologyFromModel } from "./engine/atlasScene"
import type { SceneTopology } from "./engine/atlasScene"

interface TopologyQuery {
  allProject: { nodes: ProjectNode[] }
  allWriting: { nodes: WritingNode[] }
  allMarkdownRemark: { nodes: ChangelogNode[] }
}

/**
 * The small, layout-level slice of Atlas data the WebGL scene needs: names,
 * clusters and statuses, but no prose or fiction text. It uses the same
 * changelog filter and sort as the Atlas page query, and the same builder, so
 * work ids match the page's full model.
 */
export function useAtlasTopology(): SceneTopology {
  const data: TopologyQuery = useStaticQuery(graphql`
    query CosmosAtlasTopology {
      allProject {
        nodes {
          name
          cluster
          status
          medium
          imgSrc
          disabled
        }
      }
      allWriting {
        nodes {
          title
        }
      }
      allMarkdownRemark(
        filter: { fields: { sourceInstanceName: { eq: "changelog" } } }
        sort: { frontmatter: { date: DESC } }
      ) {
        nodes {
          frontmatter {
            title
            date
            type
            status
          }
        }
      }
    }
  `)
  return useMemo(
    () =>
      topologyFromModel(
        buildAtlasModel(
          { projects: data.allProject.nodes, writing: data.allWriting.nodes, changelog: data.allMarkdownRemark.nodes },
          { resolveMedia: () => null }
        )
      ),
    [data]
  )
}
