import React, { useEffect, useState, useRef, useMemo } from "react"
import SEO from "../components/seo"
import gsap from "gsap"
import SideBarCollapsed from "../components/SideBarCollapsed"
import FloatingPageIcons from "../components/nebula/FloatingPageIcons"
import { ARTIFACTS } from "../components/nebula/artifacts"
import "./about.css"

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

// Define the props interface for the About page
interface AboutProps {
  /** Transition status from gatsby-plugin-transition-link */
  transitionStatus?: string
  /** Location object from Gatsby router */
  location: GatsbyLocation
}

const CollapsibleSection: React.FC<{
  label: string
  children: React.ReactNode
}> = ({ label, children }) => {
  const [open, setOpen] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`about-section${open ? " open" : ""}`}>
      <button
        className="about-section-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="about-section-label">{label}</span>
        <span className="about-section-arrow">&#9662;</span>
      </button>
      <div
        className="about-section-body"
        ref={bodyRef}
        style={{
          maxHeight: open ? `${bodyRef.current?.scrollHeight}px` : "0px",
        }}
      >
        <div className="about-section-inner">{children}</div>
      </div>
    </div>
  )
}

const About: React.FC<AboutProps> = ({ transitionStatus, location }) => {
  const aboutArtifacts = useMemo(
    () => ARTIFACTS.filter(a => a.id === "music" || a.id === "writing"),
    []
  )

  useEffect(() => {
    if (transitionStatus === "entering") {
      gsap.to(".about", {
        autoAlpha: 1,
        duration: 1,
      })
    }
    if (transitionStatus === "exiting") {
      gsap.to(".about", { autoAlpha: 0, duration: 0.3 })
    }
  }, [transitionStatus])

  // Initial page load animation
  useEffect(() => {
    gsap.to(".about", {
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

      <div style={{ opacity: 0, position: "relative" }} className="about">
        <SEO title="About" />
        <p className="second-title background-video">
          {location.pathname.substring(1).replace(/\/$/, "")}
        </p>
        <div className="about-content">
          <h2 className="about-headline">
            The Medium Changed. The Discipline Didn't.
          </h2>
          <p>
            I am a software engineer who spent the first decade of my
            professional life as a composer, bandleader, and audio technician.
          </p>
          <p>
            To some, the jump from leading a 10-piece ensemble to architecting
            frontend systems seems like a pivot. To me, it was simply moving
            from one form of system design to another. Whether writing a score
            for a chamber group or building a custom component library in
            TypeScript, the core objective is the same: managing complexity to
            create a seamless experience.
          </p>

          <CollapsibleSection label="The Seattle Foundation: Building Worlds">
            <p>
              My journey started in Seattle. Not just playing in bands, but
              building systems. Long before I touched a terminal, I was obsessed
              with the architecture of creativity. I spent my youth designing
              tabletop RPGs, drawing comics, and making home recordings in
              rain-soaked basements.
            </p>
            <p>
              This wasn't just a hobby; it was an education in grit and
              iteration. Seattle taught me how to handle the "starving artist"
              grind. Not for the sake of the struggle, but to develop the
              discipline required to master a craft.
            </p>
          </CollapsibleSection>

          <CollapsibleSection label="The Berlin Transition: From Stage to Script">
            <p>
              I moved to Berlin to push my musical career to its logical
              conclusion. I reached a level of professional maturity where I was
              leading international tours across Europe and Japan, eventually
              receiving state funding in Germany to compose and record with a
              10-piece ensemble.
            </p>
            <p className="about-accent">Then came March 2020.</p>
            <p>
              When the pandemic halted live performance, I didn't just look for
              a new job. I looked for a new medium. The hours I'd spent in
              audio engineering, managing signal flow, troubleshooting hardware,
              obsessing over precision, turned out to be the perfect precursor to
              software engineering. I completed a full-stack bootcamp, but the
              real growth happened in the thousands of hours of self-teaching
              that followed. I didn't want to build "pages"; I wanted to
              understand the infrastructure.
            </p>
          </CollapsibleSection>

          <CollapsibleSection label="The Madrid Integration: The AI Renaissance">
            <p>
              Today, based in Madrid, my work has entered a new phase. We've
              moved past the era of manual boilerplate and into the era of
              AI-native engineering. For many, the rise of AI assistants and
              autonomous agents is a threat. For me, it is the ultimate creative
              multiplier. It has removed the "manual notation" of coding, the
              syntax struggles, the boilerplate, allowing me to return to my
              roots as an arranger and orchestrator. In 2026, being a great
              engineer is about system taste and architectural rigor. I use AI
              not to replace my thinking, but to execute at a scale that was
              previously impossible for a single developer.
            </p>
            <ul className="about-highlights">
              <li>
                <strong>Orchestrating Agents:</strong> Just as I once
                coordinated a 10-piece band, I now coordinate AI agents to
                handle unit tests, refactoring, and infrastructure scaffolding.
              </li>
              <li>
                <strong>Focus on Composition:</strong> With AI handling the
                "rhythm section" of routine tasks, I focus on the "melody": the
                UX-minded engineering, the product logic, and the high-level
                architecture.
              </li>
              <li>
                <strong>Creative Velocity:</strong> I am building more complex
                systems with more precision and less friction than ever before.
              </li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection label="Technical Toolkit">
            <p>
              I build with an artist's eye for taste and an engineer's
              requirement for rigor.
            </p>
            <ul className="about-highlights">
              <li>
                <strong>Frontend Architecture:</strong> React, TypeScript,
                Remix, Vite, Tailwind, Storybook
              </li>
              <li>
                <strong>Infrastructure &amp; Data:</strong> Terraform, AWS,
                Postgres, GraphQL
              </li>
              <li>
                <strong>AI-Native Workflow:</strong> Agentic workflows and
                LLM-integrated development to maximize build velocity without
                sacrificing code quality
              </li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection label="Why the Artistic Background Matters">
            <p>
              I believe non-traditional backgrounds produce the most resilient
              engineers. My years in music gave me a toolkit that a CS degree
              cannot replicate:
            </p>
            <ul className="about-highlights">
              <li>
                <strong>Arrangement is Architecture:</strong> Arranging music
                for a large ensemble is exactly like designing a distributed
                system, managing many interdependent parts so they function as a
                cohesive whole.
              </li>
              <li>
                <strong>The Discipline of the Rehearsal:</strong> I treat a
                sprint like a rehearsal. Deliberate repetition, patience, and the
                understanding that "done" is better than "perfect," but
                "excellent" is the goal.
              </li>
              <li>
                <strong>Ego Management:</strong> Leading a band through a
                high-pressure tour teaches you how to collaborate, communicate,
                and solve problems when things go wrong.
              </li>
            </ul>
          </CollapsibleSection>

          <div className="about-closing-section">
            <p className="about-closing">
              The artist didn't disappear. He just found a more powerful
              instrument.
            </p>
            <p>
              I am always looking to collaborate with teams that value craft,
              taste, and the kind of perspective that only comes from a life
              spent building things from scratch.
            </p>
          </div>
        </div>
      </div>
      <FloatingPageIcons artifacts={aboutArtifacts} />
    </>
  )
}

export default About
