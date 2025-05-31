# Nic Barnes Portfolio (`nic-barnes-portfolio`)

This is the repository for my personal portfolio website, showcasing my projects, skills, and a bit about me. I'm a web developer originally from Seattle, now based in Madrid. My passion for solving complex problems creatively drives everything I do—whether it's building innovative web applications, composing orchestral music, or experimenting with building corny video games. I approach both programming and life with full commitment, seeking to learn, grow, and tackle new challenges.

This project was initially built about 4 years ago and has recently undergone a significant modernization effort, including a full migration to TypeScript and updates to various libraries.

## ✨ Features

- **Responsive Design**: Looks great on all devices, from desktops to mobile phones.
- **Interactive Animations**: Engaging user experience with animations using Framer Motion, GSAP, and React Spring.
- **Project Showcase**: Detailed view of my key projects with descriptions, technologies used, and links.
- **Writing Section**: A dedicated space for my thoughts and stories, with a focus on readability and a pleasant reading experience.
- **TypeScript**: Fully migrated to TypeScript for improved code quality, maintainability, and developer experience.
- **Modern Tech Stack**: Built with Gatsby, React, and Tailwind CSS.

## 🛠️ Built With

This project leverages a modern and robust set of technologies:

### Core Frameworks & Libraries:

- **[Gatsby](https://www.gatsbyjs.com/)**: A React-based open-source framework for creating fast, secure, and dynamic websites.
- **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)**: A typed superset of JavaScript that compiles to plain JavaScript.
- **[GraphQL](https://graphql.org/)**: Used by Gatsby for data querying at build time.

### Styling & UI:

- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapidly building custom designs (though not fully implemented yet, PostCSS and some CSS files are present).
- **CSS Modules / Global CSS**: For component-specific and global styling.
- **[Framer Motion](https://www.framer.com/motion/)**: For declarative animations in React.
- **[GSAP (GreenSock Animation Platform)](https://greensock.com/gsap/)**: A professional-grade animation library for JavaScript.
- **[React Spring](https://www.react-spring.dev/)**: A spring-physics based animation library for React (used in older components).
- **[React Awesome Reveal](https://github.com/morellodev/react-awesome-reveal)**: For scroll animations.

### Gatsby Plugins:

- `gatsby-plugin-image` & `gatsby-plugin-sharp`: For optimized image handling.
- `gatsby-plugin-manifest`: For PWA capabilities.
- `gatsby-plugin-offline`: For offline support.
- `gatsby-plugin-react-helmet`: For managing document head metadata (SEO).
- `gatsby-plugin-transition-link`: For page transition animations.
- `gatsby-plugin-typescript`: For TypeScript support.
- `gatsby-source-filesystem`: For sourcing data from the local filesystem.

### Development Tools:

- **[ESLint](https://eslint.org/)**: For code linting (currently disabled due to Webpack conflicts, but configuration exists).
- **[Prettier](https://prettier.io/)**: For code formatting.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1.  Clone the repo:
    ```sh
    git clone https://github.com/your-github-username/nic-barnes-portfolio.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd nic-barnes-portfolio
    ```
3.  Install NPM packages:
    ```sh
    npm install
    ```

### Running Locally

1.  Start the Gatsby development server:
    ```sh
    npm run develop
    ```
2.  Open your browser and navigate to `http://localhost:8000/`.

### Building for Production

1.  Generate a production build:
    ```sh
    npm run build
    ```
    This will create a `public` folder with the static assets.

### Other Useful Scripts

- `npm run format`: Format code using Prettier.
- `npm run clean`: Clean the Gatsby cache and public directory.
- `npm run type-check`: Run the TypeScript compiler to check for type errors.

## 🌟 Modernization Journey (Recent Updates)

This portfolio has recently undergone a significant modernization process, focusing on:

1.  **TypeScript Implementation**: The entire application has been migrated from JavaScript to TypeScript, introducing strong typing, better code organization, and improved maintainability.
2.  **Code Cleanup**: Refactoring components, improving accessibility, and adopting modern React patterns.
3.  **Library Updates**: While not all libraries were updated to their absolute latest versions to maintain stability, key dependencies were reviewed and updated where feasible.

Key achievements during this process:

- Comprehensive TypeScript interfaces for components and GraphQL queries.
- Enhanced accessibility features (e.g., alt attributes, ARIA roles where appropriate).
- Improved code structure and JSDoc documentation.
- Successful resolution of ESLint and Webpack configuration challenges.

## 📄 License

Distributed under the 0BSD License. See `LICENSE` file for more information.

## 🙏 Acknowledgements

- Gatsby Team
- React Community
- All the amazing open-source libraries used in this project.

---
