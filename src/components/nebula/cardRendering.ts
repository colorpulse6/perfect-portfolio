import React from "react"
import BrainAtlasVid from "../../images/brain-atlas-spin.mp4"
import CerebroMyceliumVid from "../../images/cerebro-mycelium.mp4"
import ThrottleDashboard from "../../images/throttle-dashboard.png"
import CerebroDashboard from "../../images/cerebro-dashboard.png"
import { isVideo } from "../../helpers/projectImages"
import { FloatingItem } from "./floatingPhysics"

export { isVideo }

export const TYPE_COLORS: Record<string, string> = {
  project: "#5b8def",
  writing: "#d4a053",
  update: "#4aba7a",
}

export const STATUS_LABELS: Record<string, string> = {
  "in-progress": "In Progress",
  released: "Released",
  published: "Published",
}

export const MEDIA_ASSETS: Record<string, string> = {
  "brain-atlas-spin.mp4": BrainAtlasVid,
  "cerebro-mycelium.mp4": CerebroMyceliumVid,
  "throttle-dashboard.png": ThrottleDashboard,
  "cerebro-dashboard.png": CerebroDashboard,
}

export const CONTAIN_MEDIA = new Set(["throttle-dashboard.png", "cerebro-dashboard.png"])
export const MEDIA_HEIGHTS: Record<string, number> = {
  "throttle-dashboard.png": 220,
  "cerebro-dashboard.png": 150,
}

export function isContainMedia(media: string | null): boolean {
  return media !== null && CONTAIN_MEDIA.has(media)
}

export function getCardMediaHeight(media: string | null): number {
  return media !== null && MEDIA_HEIGHTS[media] ? MEDIA_HEIGHTS[media] : 88
}

export function getCardMediaStyle(media: string | null): React.CSSProperties {
  const contained = isContainMedia(media)
  return {
    display: "block",
    width: "100%",
    height: getCardMediaHeight(media),
    objectFit: contained ? "contain" : "cover",
    objectPosition: "center",
    background: contained ? "rgba(10,8,20,0.8)" : "transparent",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.1)",
    marginBottom: 12,
    opacity: 0.9,
  }
}

export const glassStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s, transform 0.3s",
  pointerEvents: "auto" as const,
}

export const cardStyle: React.CSSProperties = {
  width: 280,
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  padding: "18px 20px 14px",
  cursor: "pointer",
  transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
  pointerEvents: "auto" as const,
  fontFamily: "-apple-system, 'Segoe UI', sans-serif",
}

export function getItemId(item: FloatingItem): string {
  return item.kind === "icon" ? `icon-${item.artifact.id}` : `card-${item.id}`
}
