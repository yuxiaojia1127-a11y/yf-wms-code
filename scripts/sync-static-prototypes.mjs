import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const sourceDir = path.join(
  projectRoot,
  'docs',
  '原型设计',
  'WMS原型设计',
  '00原型方案',
)
const archiveDir = path.join(projectRoot, 'public', 'wms-prototypes')
const prototypeDir = path.join(projectRoot, 'public', 'prototype')

const archiveWebDir = path.join(archiveDir, '02WEB端HTML版')
const archiveAppDir = path.join(archiveDir, '03APP端HTML版')
const webDir = path.join(sourceDir, '02WEB端HTML版')
const appDir = path.join(sourceDir, '03APP端HTML版')
const entrySourceFile = path.join(webDir, '00WMS高保真原型总入口.html')
const webSourceFile = path.join(webDir, '01WMS_WEB端驾驶舱总览原型.html')
const appSourceFile = path.join(appDir, '01WMS_APP端高保真原型_v1.1.html')

if (!existsSync(sourceDir)) {
  throw new Error(`Prototype source directory not found: ${sourceDir}`)
}

rmSync(archiveDir, { recursive: true, force: true })
rmSync(prototypeDir, { recursive: true, force: true })

mkdirSync(path.dirname(archiveDir), { recursive: true })
mkdirSync(archiveWebDir, { recursive: true })
mkdirSync(archiveAppDir, { recursive: true })
mkdirSync(path.join(prototypeDir, 'web'), { recursive: true })
mkdirSync(path.join(prototypeDir, 'app'), { recursive: true })

cpSync(webDir, archiveWebDir, { recursive: true })
cpSync(appDir, archiveAppDir, { recursive: true })

const entryHtml = readFileSync(entrySourceFile, 'utf8')
  .replace('./01WMS_WEB端高保真原型.html', 'http://localhost:5173/public/prototype/web/index.html')
  .replace('./01WMS_WEB端驾驶舱总览原型.html', 'http://localhost:5173/public/prototype/web/index.html')
  .replace('http://localhost:5173/prototype/web', 'http://localhost:5173/public/prototype/web/index.html')
  .replace('http://127.0.0.1:5173/prototype/web/index.html', 'http://localhost:5173/public/prototype/web/index.html')
  .replace('href="./"', 'href="http://localhost:5173/public/prototype/web/index.html"')
  .replace('../03APP端HTML版/01WMS_APP端高保真原型_v1.1.html', '/prototype/app/index.html')
  .replace('http://localhost:5173/prototype/app', '/prototype/app/index.html')
  .replace('http://127.0.0.1:5173/prototype/app/index.html', '/prototype/app/index.html')
  .replace('href="../03APP端HTML版/"', 'href="/prototype/app/index.html"')

const appHtml = readFileSync(appSourceFile, 'utf8')
  .replaceAll('./assets/logo.png', '/prototype/app/assets/logo.png')
  .replaceAll('url("assets/mine-bg.png")', 'url("/prototype/app/assets/mine-bg.png")')

writeFileSync(path.join(prototypeDir, 'index.html'), entryHtml)
cpSync(webSourceFile, path.join(prototypeDir, 'web', 'index.html'))
writeFileSync(path.join(prototypeDir, 'app', 'index.html'), appHtml)
cpSync(path.join(appDir, 'assets'), path.join(prototypeDir, 'app', 'assets'), {
  recursive: true,
})

console.log(`Synced archive prototypes to ${archiveDir}`)
console.log(`Built deployable prototype entrypoints in ${prototypeDir}`)
