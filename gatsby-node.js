/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/node-apis/
 */

// You can delete this file if you're not using it

exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const projects = [
    {
      name: "Job Toast",
      link: "https://job-toast.herokuapp.com/",
      github: "https://github.com/colorpulse6/job-hunter",
      techArray: [13, 10, 12, 2, 8, 1, 7, 11, 6, 15],
      ref: "jobToastRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616361595/Portfolio/project-images/sdaembqjnoljspya3uug.png",
      description:
        "Hoop.It.App is a web and mobile app that allows you to organize basketball games in your city and build teams with your friends. Includes a chat function for easy organization and an interactive map for finding courts and games in your area.",
    },
    {
      name: "Hoop.It.App",
      link: "https://hoopitapp.herokuapp.com/",
      github: "https://github.com/colorpulse6/hoopitapp",
      techArray: [13, 10, 2, 9, 8, 1, 7, 0, 11, 16, 6, 15],
      ref: "hoopItAppRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616360670/Portfolio/project-images/nvulohccpr3eyywygyv5.png",
      description:
        "Hoop.It.App is a web and mobile app that allows you to organize basketball games in your city and build teams with your friends. Includes a chat function for easy organization and an interactive map for finding courts and games in your area.",
    },

    {
      name: "Fire Store",
      link: "https://fire-store.netlify.app/",
      github: "https://github.com/colorpulse6/fire-store",
      techArray: [13, 10, 2, 3, 9, 8, 1, 7, 0, 11, 15],
      ref: "fireStoreRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616361970/Portfolio/project-images/et8hsi32oszqi3e3bdl4.png",
      description:
        "Hoop.It.App is a web and mobile app that allows you to organize basketball games in your city and build teams with your friends. Includes a chat function for easy organization and an interactive map for finding courts and games in your area.",
    },
    {
      name: "Gigzilla",
      link: "https://gig-zilla.herokuapp.com/",
      github: "https://github.com/colorpulse6/gigzilla",
      techArray: [5, 10, 2, 9, 8, 1, 7, 0, 11, 6, 15],
      ref: "gigzillaRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/w_1000,ar_16:9,c_fill,g_auto,e_sharpen/v1616362260/Portfolio/project-images/x1ivnv5gchqi4tiph0q6.png",
      description:
        "Hoop.It.App is a web and mobile app that allows you to organize basketball games in your city and build teams with your friends. Includes a chat function for easy organization and an interactive map for finding courts and games in your area.",
    },
    {
      name: "Mad Science",
      link: "https://colorpulse6.github.io/mad-science/",
      github: "https://github.com/colorpulse6/mad-science",
      techArray: [8, 1, 7, 11, 15],
      ref: "madScienceRef",
      imgSrc:
        "https://res.cloudinary.com/duzle7rzg/image/upload/q_auto,f_auto/v1596015872/Portfolio/project-images/s5xigxb6xn8ruluk6gq4.png",
      description:
        "Hoop.It.App is a web and mobile app that allows you to organize basketball games in your city and build teams with your friends. Includes a chat function for easy organization and an interactive map for finding courts and games in your area.",
    },
  ]
  projects.forEach(project => {
    const node = {
      name: project.name,
      techArray: project.techArray,
      description: project.description,
      link: project.link,
      github: project.github,
      imgSrc: project.imgSrc,
      ref: project.ref,
      id: createNodeId(`Project-${project.name}`),
      internal: {
        type: "Project",
        contentDigest: createContentDigest(project),
      },
    }
    actions.createNode(node)
  })
}
