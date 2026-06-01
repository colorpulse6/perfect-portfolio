module.exports = {
  siteMetadata: {
    html: { useGatsbyImage: false },
    title: `Nichalas Barnes`,
    description: `Nichalas Barnes Portfolio`,
    author: `Nichalas Barnes`,
    siteURL: "https://nichalasbarnes.com/",
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
        name: "about",
        link: "/about",
      },
      {
        name: "contact",
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
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `changelog`,
        path: `${__dirname}/content/changelog`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 720,
            },
          },
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Nichalas Barnes`,
        short_name: `Nichalas Barnes`,
        start_url: `/`,
        background_color: `#06070e`,
        theme_color: `#06070e`,
        display: `minimal-ui`,
        icon: `src/images/nic-barnes-logo.png`, // This path is relative to the root of the site.
      },
    },
    "gatsby-plugin-postcss",
  ],
}
