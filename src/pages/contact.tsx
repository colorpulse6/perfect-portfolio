import React, { useEffect, useState } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import { Slide, Flip } from "react-awesome-reveal"
import "./contact.css"
import SideBarCollapsed from "../components/SideBarCollapsed"

// Type for location object from Gatsby
interface GatsbyLocation {
  pathname: string
  search?: string
  hash?: string
  href?: string
  origin?: string
  protocol?: string
  host?: string
  hostname?: string
  port?: string
  state?: any
  key?: string
}

// Define the props interface for the Contact page
interface ContactProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location: GatsbyLocation
}

/**
 * Contact page component with a contact form and animations
 * @param props - The component props
 * @returns JSX element for the contact page
 */
const Contact: React.FC<ContactProps> = ({ transitionStatus, location }) => {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  )

  const encode = (data: Record<string, string>) =>
    Object.keys(data)
      .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(data[k]))
      .join("&")

  // Submit via AJAX to the Netlify "contact" form (no redirect to a success
  // page); show an inline confirmation instead.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "sending" || status === "sent") return
    setStatus("sending")
    try {
      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: encode({ "form-name": "contact", "bot-field": "", ...form }),
      })
      setStatus(res.ok ? "sent" : "error")
    } catch {
      setStatus("error")
    }
  }

  // Handle page transition animations
  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".contact", {
        autoAlpha: 1,
        duration: 1, // if we are entering the page, make the div visible
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".contact", {
        autoAlpha: 0,
        duration: 0.3,
      }) // if we are exiting the page, make the div transparent
    }
  }, [transitionStatus])

  // Initial page load animation
  useEffect(() => {
    gsap.to(".contact", {
      autoAlpha: 1,
      duration: 1,
    })
  }, [])

  return (
    <>
      <SideBarCollapsed
        currentWindow={location.pathname}
        transitionStatus={transitionStatus}
        menuLinks={[]}
      />
      <SEO title="Contact" description="Get in touch with Nichalas Barnes." pathname={location?.pathname} />
      <div className="container contact">
        <h1 className="contact-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </h1>
        <h4 className="lead">
          <Slide direction="right">
            Have a question or want to work together?
          </Slide>
        </h4>
        {status === "sent" ? (
          <p style={{ color: "#4aba7a", fontSize: 18, marginTop: 20 }}>
            Message sent. I will get back to you soon.
          </p>
        ) : (
          <form
            name="contact"
            method="POST"
            data-netlify="true"
            netlify-honeypot="bot-field"
            onSubmit={handleSubmit}
          >
            <input type="hidden" name="bot-field" />
            <input type="hidden" name="form-name" value="contact" />
            <div className="main">
              <div>
                <label>
                  <Flip direction="horizontal" duration={300}>
                    Your Name:
                  </Flip>
                  <span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={e =>
                        setForm(f => ({ ...f, name: e.target.value }))
                      }
                    />
                  </span>
                </label>
              </div>
              <div>
                <label>
                  <Flip direction="horizontal" duration={300}>
                    Your Email:
                  </Flip>
                  <span>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={e =>
                        setForm(f => ({ ...f, email: e.target.value }))
                      }
                    />
                  </span>
                </label>
              </div>

              <div>
                <label>
                  <Flip direction="horizontal" duration={300}>
                    Message:
                  </Flip>
                  <span>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={e =>
                        setForm(f => ({ ...f, message: e.target.value }))
                      }
                    />
                  </span>
                </label>
              </div>
            </div>

            {status === "error" && (
              <p style={{ color: "#ff6b6b", fontSize: 13, marginTop: 8 }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              style={{ marginTop: "-20px" }}
              className="btn effect01"
            >
              <span>{status === "sending" ? "Sending..." : "Send"}</span>
            </button>
          </form>
        )}
      </div>
    </>
  )
}

export default Contact
