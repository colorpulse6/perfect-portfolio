import { useState, useCallback } from "react"

export type NetlifyFormStatus = "idle" | "sending" | "sent" | "error"

export interface NetlifyFormFields {
  name: string
  email: string
  message: string
}

const encode = (data: Record<string, string>): string =>
  Object.keys(data)
    .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
    .join("&")

/**
 * Shared Netlify form state + AJAX submit. Posts the fields to "/" as the named
 * Netlify form (so the page is not navigated away) and tracks a small status
 * machine. Validation and error copy stay at the call site, since they differ
 * between the contact page and the atlas contact panel. `submit` resolves to
 * whether the POST succeeded.
 */
export function useNetlifyForm(formName = "contact") {
  const [form, setForm] = useState<NetlifyFormFields>({
    name: "",
    email: "",
    message: "",
  })
  const [status, setStatus] = useState<NetlifyFormStatus>("idle")

  const submit = useCallback(async (): Promise<boolean> => {
    if (status === "sending" || status === "sent") return false
    setStatus("sending")
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": formName, "bot-field": "", ...form }),
      })
      setStatus(res.ok ? "sent" : "error")
      return res.ok
    } catch {
      setStatus("error")
      return false
    }
  }, [form, status, formName])

  return { form, setForm, status, setStatus, submit }
}
