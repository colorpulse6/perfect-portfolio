import React from "react"
import { Link } from "gatsby"
import { usePageTransition } from "../helpers/usePageTransition"
import SEO from "../components/seo"
import "./work-with-me.css"

const WorkWithMe = ({ transitionStatus }: { transitionStatus?: string }) => {
  usePageTransition(transitionStatus, ".work-page")
  return (
    <div className="work-page">
      <SEO
        title="Work with me | Freelance React & TypeScript development"
        description="Product features, API integrations, and workflow automation with Nic Barnes. Explore selected work and discuss your project."
        pathname="/work-with-me/"
      />
      <section className="work-hero" aria-labelledby="work-heading">
        <p className="work-eyebrow">
          NIC BARNES / FREELANCE SOFTWARE DEVELOPMENT
        </p>
        <h1 id="work-heading">
          Thoughtful software.
          <br />
          <span>From idea to working product.</span>
        </h1>
        <p className="work-intro">
          I help product teams and agencies build features, connect systems, and
          turn manual workflows into useful software.
        </p>
        <p className="work-stack">React · TypeScript · Node.js · PostgreSQL</p>
        <div className="work-actions">
          <Link className="work-button" to="/contact/">
            Tell me about your project <span aria-hidden="true">↗</span>
          </Link>
          <a className="work-text-link" href="#selected-work">
            See selected work ↓
          </a>
        </div>
        <p className="work-creative">
          Software engineer. Composer. A practical approach with a creative
          perspective.
        </p>
      </section>

      <section className="work-section" aria-labelledby="services-heading">
        <p className="work-eyebrow">01 / HOW I CAN HELP</p>
        <h2 id="services-heading">A clear problem. A useful next step.</h2>
        <div className="work-services">
          <article>
            <span className="work-number">01</span>
            <h3>Product features</h3>
            <p>
              A customer-facing feature or internal tool for your React and
              TypeScript application.
            </p>
            <p className="work-detail">
              Interface, backend changes, verification, and handover scoped
              together.
            </p>
          </article>
          <article>
            <span className="work-number">02</span>
            <h3>Integrations & automation</h3>
            <p>
              Connect APIs and move information between the tools your team
              already uses.
            </p>
            <p className="work-detail">
              Authentication, background processing, and failure handling
              considered from the start.
            </p>
          </article>
          <article>
            <span className="work-number">03</span>
            <h3>Application improvements</h3>
            <p>
              Work through a focused set of usability, performance, or
              reliability problems.
            </p>
            <p className="work-detail">
              Start with a bounded investigation when the cause is unclear.
            </p>
          </article>
        </div>
      </section>

      <section
        className="work-section"
        id="selected-work"
        aria-labelledby="proof-heading"
      >
        <p className="work-eyebrow">02 / SELECTED PERSONAL WORK</p>
        <h2 id="proof-heading">Software you can explore.</h2>
        <article className="work-project">
          <div>
            <p className="work-project-kind">
              PRODUCT DEVELOPMENT / REACT + TYPESCRIPT
            </p>
            <h3>Job Toast</h3>
            <p>A shared home for the moving parts of a job search.</p>
          </div>
          <div>
            <p>
              Job searches spread across tabs, spreadsheets, and scattered notes.
              I founded and built Job Toast to bring saved roles, application
              stages, notes, and contacts into one workspace, with a browser
              extension for saving jobs and AI-assisted cover letter drafts.
            </p>
            <p className="work-detail">
              An example of taking a product from concept through interface
              design and implementation. Explore the public product overview
              and workflow examples.
            </p>
            <a
              className="work-text-link"
              href="https://jobtoast.io/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Job Toast <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
        <article className="work-project">
          <div>
            <p className="work-project-kind">
              DEVELOPER TOOLS / REACT + TYPESCRIPT
            </p>
            <h3>El Form</h3>
            <p>Making complex forms easier to build.</p>
          </div>
          <div>
            <p>
              Forms need more than inputs: validation, nested data, error
              states, and a usable developer API. My El Form project brings
              schema-driven forms, reusable components, and form-state hooks
              into a React library.
            </p>
            <p className="work-detail">
              Explore the API, examples, and implementation in the public
              repository.
            </p>
            <a
              className="work-text-link"
              href="https://github.com/colorpulse6/el-form"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore El Form on GitHub ↗
            </a>
          </div>
        </article>
        <article className="work-project">
          <div>
            <p className="work-project-kind">
              INTERACTIVE WEB / REACT + THREE.JS
            </p>
            <h3>The Atlas</h3>
            <p>A creative portfolio with room to explore.</p>
          </div>
          <div>
            <p>
              This site brings software, music, and writing into an interactive
              map. I built its React interface, 3D scenes, and content-driven
              project views to give different kinds of work a shared home.
            </p>
            <p className="work-detail">
              An example of combining custom interaction design with an existing
              web publishing stack.
            </p>
            <Link className="work-text-link" to="/atlas/">
              Explore the Atlas ↗
            </Link>
          </div>
        </article>
      </section>

      <section
        className="work-section work-process"
        aria-labelledby="process-heading"
      >
        <p className="work-eyebrow">03 / WORKING TOGETHER</p>
        <h2 id="process-heading">Start with the problem.</h2>
        <ol>
          <li>
            <h3>Share the context</h3>
            <p>
              What needs to change, what already exists, and what constraints
              matter?
            </p>
          </li>
          <li>
            <h3>Agree on the scope</h3>
            <p>
              Define the deliverable, dependencies, and how we will know it
              works.
            </p>
          </li>
          <li>
            <h3>Build and hand over</h3>
            <p>
              Review working software and leave a clear path for maintenance.
            </p>
          </li>
        </ol>
      </section>

      <section className="work-contact" aria-labelledby="work-contact-heading">
        <p className="work-eyebrow">LET'S TALK ABOUT YOUR PROJECT</p>
        <h2 id="work-contact-heading">What would you like to build?</h2>
        <p>
          Send a short outline, your existing stack, and your target timeline. A
          rough brief is enough to start a conversation.
        </p>
        <div className="work-actions">
          <Link className="work-button" to="/contact/">
            Start a conversation ↗
          </Link>
          <a className="work-text-link" href="mailto:colorpulse@gmail.com">
            colorpulse@gmail.com
          </a>
        </div>
      </section>
    </div>
  )
}

export default WorkWithMe
