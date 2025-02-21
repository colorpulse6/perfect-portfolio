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

export const techImages = [
  bootstrap,
  css,
  express,
  firebase,
  gatsby,
  handlebars,
  heroku,
  html,
  javascript,
  mongodb,
  nodejs,
  npm,
  postgres,
  react,
  typescript,
  vscode,
  graphql,
  gpt,
  python,
  tailwind,
  railway,
  vite,
  turborepo,
  prisma,
  tanstack,
  vercel,
]

export const getImages = array => {
  return array.map(i => techImages[i])
}
