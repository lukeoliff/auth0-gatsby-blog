const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const { createFilePath } = require('gatsby-source-filesystem')

exports.createPages = ({ graphql, boundActionCreators }) => {
  const { createPage } = boundActionCreators

  const pageLength = 2;

  const pageToPath = (index, pathPrefix, maxPages) => {
    if (pathPrefix !== null) {
      pathPrefix = `/${pathPrefix}`;
    } else {
      pathPrefix = '';
    }

    if (index === 1) {
      return `${pathPrefix}/`;
    }

    if (index > 1 && index <= maxPages) {
      return `${pathPrefix}/${index}`;
    }

    return '';
  };

  const createPaginatedPages = ({
    edges,
    pathPrefix = null,
    component,
    context = {}
  }) => {
    const groupedPages = edges
      .map((edge, index) => {
        return index % pageLength === 0
          ? edges.slice(index, index + pageLength)
          : null;
      })
      .filter(edge => edge);

    groupedPages.forEach((group, index, groups) => {
      const pageNumber = index + 1;

      return createPage({
        path: pageToPath(pageNumber, pathPrefix, groups.length),
        component: component,
        context: {
          group: group,
          nextPath: pageToPath(pageNumber - 1, pathPrefix, groups.length),
          prevPath: pageToPath(pageNumber + 1, pathPrefix, groups.length),
          extraContext: context
        }
      });
    });
  };

  return new Promise((resolve, reject) => {
    const blogPost = path.resolve('./src/templates/blog-post.js')
    resolve(
      graphql(
        `
          {
            allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }, limit: 1000) {
              edges {
                node {
                  fields {
                    slug
                  }
                  frontmatter {
                    title
                  }
                }
              }
            }
          }
        `
      ).then(result => {
        if (result.errors) {
          console.log(result.errors)
          reject(result.errors)
        }

        // Create blog posts pages.
        const posts = result.data.allMarkdownRemark.edges;

        _.each(posts, (post, index) => {
          const previous = index === posts.length - 1 ? false : posts[index + 1].node;
          const next = index === 0 ? false : posts[index - 1].node;

          createPage({
            path: post.node.fields.slug,
            component: blogPost,
            context: {
              slug: post.node.fields.slug,
              previous,
              next,
            },
          })
        })
      })
    )
  })
}

exports.onCreateNode = ({ node, boundActionCreators, getNode }) => {
  const { createNodeField } = boundActionCreators

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
