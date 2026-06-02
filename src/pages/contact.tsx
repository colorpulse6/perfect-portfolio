import React from "react"
import SEO from "../components/seo"
import { Slide, Flip } from "react-awesome-reveal"
import "./contact.css"
import SideBarCollapsed from "../components/SideBarCollapsed"
import { GatsbyLocation } from "../types/gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import { useNetlifyForm } from "../helpers/useNetlifyForm"

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
  const { form, setForm, status, submit } = useNetlifyForm()

  // Submit via AJAX to the Netlify "contact" form (no redirect to a success
  // page); show an inline confirmation instead.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submit()
  }

  usePageTransition(transitionStatus, ".contact", { enter: 1, exit: 0.3, mount: 1 })

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
