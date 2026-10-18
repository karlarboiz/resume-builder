import dotenv from "dotenv"
import fs from "node:fs"
import net from "node:net"
import path from "node:path"
import { spawn } from "node:child_process"
import EmbeddedPostgres from "embedded-postgres"

dotenv.config()

const port = Number(process.env.EMBEDDED_PG_PORT || 5433)
const user = "resume"
const password = "resume"
const database = "resume"
const databaseDir = path.join(process.cwd(), "data", "pg")
const localUrl = `postgresql://${user}:${password}@127.0.0.1:${port}/${database}`

function portOpen(targetPort) {
  return new Promise((resolve) => {
    const socket = net.connect({ port: targetPort, host: "127.0.0.1" }, () => {
      socket.end()
      resolve(true)
    })
    socket.on("error", () => resolve(false))
  })
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: process.env })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`))
    })
  })
}

const databaseUrl = process.env.DATABASE_URL || ""
const useEmbedded = !databaseUrl || databaseUrl.includes(`127.0.0.1:${port}`) || databaseUrl.includes(`localhost:${port}`)

if (useEmbedded) {
  process.env.DATABASE_URL = localUrl
  if (!(await portOpen(port))) {
    const pg = new EmbeddedPostgres({
      databaseDir,
      port,
      user,
      password,
      persistent: true,
    })
    if (!fs.existsSync(path.join(databaseDir, "PG_VERSION"))) {
      await pg.initialise()
    }
    await pg.start()
    const client = pg.getPgClient()
    await client.connect()
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database])
    await client.end()
    if (existing.rowCount === 0) {
      await pg.createDatabase(database)
    }
    console.log(`Postgres ready at ${localUrl}`)
  } else {
    console.log(`Postgres already listening on ${port}`)
  }
}

process.env.APP_URL ||= "http://localhost:3000"
process.env.AUTH_URL ||= process.env.APP_URL
process.env.AUTH_TRUST_HOST ||= "true"

await run("npx", ["prisma", "db", "push"])

const next = spawn("npx", ["next", "dev", "--port", "3000"], {
  stdio: "inherit",
  env: process.env,
})

function stop(signal) {
  next.kill(signal)
}

process.on("SIGINT", () => stop("SIGINT"))
process.on("SIGTERM", () => stop("SIGTERM"))

next.on("exit", (code) => {
  process.exit(code ?? 0)
})
