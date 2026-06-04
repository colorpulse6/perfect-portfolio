import React from "react"
import { NB, NB_MONO } from "../atlasShared"
import { Spectral } from "../AtlasFog"
import { useNetlifyForm } from "../../../helpers/useNetlifyForm"
import { Wraith } from "../shells/Wraith"
import { WSPEC, lead, linkS } from "./styles"

export function WContact({ onClose }: { onClose: () => void }) {
  const field: React.CSSProperties = {
    background: "rgba(180,210,230,0.05)",
    border: "1px solid rgba(111,216,224,0.18)",
    borderRadius: 8,
    padding: "11px 13px",
    fontFamily: NB_MONO,
    fontSize: 12,
    color: WSPEC.pale,
    outline: "none",
    width: "100%",
    pointerEvents: "auto",
  }
  const { form, setForm, status: state, setStatus, submit } = useNetlifyForm()
  const [err, setErr] = React.useState("")

  const transmit = async () => {
    if (state === "sending" || state === "sent") return
    if (!form.email.trim() && !form.message.trim()) {
      setErr("add an email or a message first.")
      setStatus("error")
      return
    }
    const ok = await submit()
    if (!ok) setErr("transmission failed. try again in a moment.")
  }

  return (
    <Wraith crumb={["ATLAS", "CONTACT"]} accent={WSPEC.glow} onClose={onClose}>
      <Spectral text="OPEN A CHANNEL" size={30} mono />
      <p style={{ ...lead, maxWidth: 420, margin: "16px auto 22px" }}>
        For teams that value craft, taste, and the perspective that comes from a life spent
        building things from scratch.
      </p>
      {state === "sent" ? (
        <div
          style={{
            fontFamily: NB_MONO,
            fontSize: 13,
            letterSpacing: 1.5,
            color: WSPEC.glow,
            textShadow: `0 0 18px ${WSPEC.glow}66`,
          }}
        >
          TRANSMISSION RECEIVED ✓
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 360, maxWidth: "80%" }}>
          <input
            placeholder="your name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            style={field}
          />
          <input
            placeholder="email / signal"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            style={field}
          />
          <textarea
            placeholder="transmission…"
            rows={3}
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            style={{ ...field, resize: "none" }}
          />
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <span
              onClick={transmit}
              style={{ ...linkS(WSPEC.glow), cursor: state === "sending" ? "default" : "pointer" }}
            >
              {state === "sending" ? "TRANSMITTING…" : "TRANSMIT →"}
            </span>
            <a
              href="https://github.com/colorpulse6"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...linkS("rgba(150,180,200,0.6)"), fontWeight: 400 }}
            >
              GITHUB
            </a>
            <a
              href="https://alexshand.bandcamp.com/"
              target="_blank"
              rel="noopener noreferrer"
              title="Bandcamp"
              style={{ ...linkS("rgba(150,180,200,0.6)"), fontWeight: 400 }}
            >
              BANDCAMP
            </a>
            <a
              href="https://buymeacoffee.com/nicbarnes"
              target="_blank"
              rel="noopener noreferrer"
              title="Buy me a coffee"
              style={{ ...linkS("#ffdd00"), fontWeight: 400 }}
            >
              COFFEE
            </a>
          </div>
          {state === "error" && (
            <div
              style={{
                fontFamily: NB_MONO,
                fontSize: 10,
                letterSpacing: 1,
                color: NB.pink,
                textAlign: "center",
              }}
            >
              {err}
            </div>
          )}
        </div>
      )}
    </Wraith>
  )
}
