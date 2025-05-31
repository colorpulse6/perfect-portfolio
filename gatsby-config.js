module.exports = {
  siteMetadata: {
    html: { useGatsbyImage: false },
    title: `Nichalas Barnes`,
    description: `Nichalas Barnes Portfolio`,
    author: `Nicholas Barnes`,
    siteURL: "http://localhost:8000/",
    menuLinks: [
      {
        name: "home",
        link: "/",
      },
      {
        name: "projects",
        link: "/projects",
      },
      {
        name: "projects",
        link: "/about",
      },
      {
        name: "projects",
        link: "/contact",
      },
      {
        name: "writing",
        link: "/writing",
      },
    ],
  },
  plugins: [
    "gatsby-plugin-typescript",
    {
      resolve: "gatsby-plugin-transition-link",
      options: {
        layout: require.resolve(`./src/components/layout.tsx`),
      },
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-default`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#663399`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `src/images/nic-barnes-logo.png`, // This path is relative to the root of the site.
      },
    },
    `gatsby-plugin-gatsby-cloud`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
    "gatsby-plugin-postcss",
  ],
}
