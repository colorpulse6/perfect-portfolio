import bootstrap from "../images/bootstrap-plain-wordmark.svg"
import css from "../images/css3-original-wordmark.svg"
import express from "../images/express-original-wordmark.svg"
import firebase from "../images/firebase.svg"
import gatsby from "../images/gatsby.svg"
import handlebars from "../images/handlebars-original.svg"
import heroku from "../images/heroku-plain-wordmark.svg"
import html from "../images/html5-original-wordmark.svg"
import javascript from "../images/javascript-original.svg"
import mongodb from "../images/mongodb-original-wordmark.svg"
import nodejs from "../images/nodejs-original-wordmark.svg"
import npm from "../images/npm-original-wordmark.svg"
import postgres from "../images/postgresql.svg"
import react from "../images/react-original-wordmark.svg"
import typescript from "../images/typescript.svg"
import vscode from "../images/visualstudio-plain-wordmark.svg"
import graphql from "../images/graph-ql.png"
import gpt from "../images/gpt.jpg"
import python from "../images/python.webp"
import tailwind from "../images/tailwind.png"
import railway from "../images/railway.webp"
import vercel from "../images/vercel.webp"
import vite from "../images/vite.jpeg"
import turborepo from "../images/turborepo.png"
import prisma from "../images/prisma.png"
import tanstack from "../images/tanstack.png"
import regex from "../images/regex.png"
import next from "../images/nextjs.png"
import cursor from "../images/cursor.png"
import AI from "../images/AI.jpg"
import Github from "../images/github.png"

// Type for image file paths (what Gatsby/Webpack returns for static imports)
type ImagePath = string

// Array of all available technology images
export const techImages: readonly ImagePath[] = [
  bootstrap, // 0 - Bootstrap
  css, // 1 - CSS3
  express, // 2 - Express.js
  firebase, // 3 - Firebase
  gatsby, // 4 - Gatsby
  handlebars, // 5 - Handlebars
  heroku, // 6 - Heroku
  html, // 7 - HTML5
  javascript, // 8 - JavaScript
  mongodb, // 9 - MongoDB
  nodejs, // 10 - Node.js
  npm, // 11 - NPM
  postgres, // 12 - PostgreSQL
  react, // 13 - React
  typescript, // 14 - TypeScript
  vscode, // 15 - VS Code
  graphql, // 16 - GraphQL
  gpt, // 17 - GPT/AI
  python, // 18 - Python
  tailwind, // 19 - Tailwind CSS
  railway, // 20 - Railway
  vite, // 21 - Vite
  turborepo, // 22 - Turborepo
  prisma, // 23 - Prisma
  tanstack, // 24 - TanStack
  vercel, // 25 - Vercel
  regex, // 26 - Regular Expressions
  next, // 27 - Next.js
  cursor, // 28 - Cursor
  AI, // 29 - AI/Machine Learning,
  Github, // 30 - Github
] as const

// Type for valid tech image indices
export type TechImageIndex = number

/**
 * Maps an array of indices to their corresponding technology images
 * @param indices - Array of indices corresponding to techImages array
 * @returns Array of image paths
 */
export const getImages = (indices: TechImageIndex[]): ImagePath[] => {
  return indices.map(index => {
    if (index < 0 || index >= techImages.length) {
      console.warn(
        `Invalid tech image index: ${index}. Available indices: 0-${techImages.length - 1}`,
      )
      return ""
    }
    return techImages[index]
  })
}

/**
 * Gets a single tech image by index
 * @param index - Index of the desired tech image
 * @returns Image path or empty string if invalid index
 */
export const getTechImage = (index: TechImageIndex): ImagePath => {
  if (index < 0 || index >= techImages.length) {
    console.warn(
      `Invalid tech image index: ${index}. Available indices: 0-${techImages.length - 1}`,
    )
    return ""
  }
  return techImages[index]
}

/**
 * Gets the total number of available tech images
 * @returns Number of available tech images
 */
export const getTechImageCount = (): number => techImages.length
