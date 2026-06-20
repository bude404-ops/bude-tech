#!/usr/bin/env node

/**
 * BudE Tech CEO Brain v29
 * SINGLE FILE SAAS REPO GENERATOR
 * Creates full working SaaS scaffold locally
 */

const fs = require("fs");
const path = require("path");

const log = (m) => console.log(`[BRAIN v29] ${m}`);

const ROOT = "bude-saas";

function mkdir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function write(file, content) {
  mkdir(path.dirname(file));
  fs.writeFileSync(file, content);
}

/**
 * =========================
 * CORE STRUCTURE
 * =========================
 */

function createStructure() {
  const dirs = [
    `${ROOT}/apps/web/app`,
    `${ROOT}/apps/api/src/routes`,
    `${ROOT}/apps/worker/src`,
    `${ROOT}/packages/db`,
    `${ROOT}/infra`,
    `${ROOT}/prisma`
  ];

  dirs.forEach(mkdir);
}

/**
 * =========================
 * PRISMA DB
 * =========================
 */

function createDB() {
  write(`${ROOT}/prisma/schema.prisma`, `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id    String @id @default(cuid())
  email String @unique
  pass  String
}

model Job {
  id     String @id @default(cuid())
  type   String
  status String
}
  `);
}

/**
 * =========================
 * API SERVER
 * =========================
 */

function createAPI() {
  write(`${ROOT}/apps/api/src/server.js`, `
const http = require("http");

const server = http.createServer((req,res)=>{

  if(req.url === "/api/status"){
    return res.end(JSON.stringify({
      system: "BudE SaaS v29",
      status: "running"
    }));
  }

  if(req.url === "/api/jobs"){
    return res.end("jobs endpoint active");
  }

  if(req.url === "/api/auth"){
    return res.end("auth system scaffold ready");
  }

  res.end("ok");

});

server.listen(4000, ()=> console.log("API running on 4000"));
`);
}

/**
 * =========================
 * WEB APP (NEXT.JS BASIC)
 * =========================
 */

function createWeb() {
  write(`${ROOT}/apps/web/app/page.tsx`, `
export default function Page(){
  return (
    <main style={{padding:20}}>
      <h1>BudE SaaS v29</h1>
      <p>Generated SaaS System Scaffold</p>
    </main>
  )
}
`);
}

/**
 * =========================
 * DOCKER
 * =========================
 */

function createDocker() {
  write(`${ROOT}/infra/docker-compose.yml`, `
version: "3.9"

services:
  api:
    build: ../apps/api
    ports:
      - "4000:4000"

  web:
    build: ../apps/web
    ports:
      - "3000:3000"
`);
}

/**
 * =========================
 * README
 * =========================
 */

function createREADME() {
  write(`${ROOT}/README.md`, `
# BudE SaaS v29

## Run

API:
node apps/api/src/server.js

Web:
Next.js app (install dependencies manually)

## Features
- API scaffold
- Web scaffold
- DB schema
- Docker setup
`);
}

/**
 * =========================
 * BOOTSTRAP RUNNER
 * =========================
 */

function run() {
  log("bootstrapping SaaS generator...");

  mkdir(ROOT);

  createStructure();
  createDB();
  createAPI();
  createWeb();
  createDocker();
  createREADME();

  log("DONE → SaaS repo generated in /bude-saas");
  log("Next step: cd bude-saas && build/install dependencies");
}

run();
