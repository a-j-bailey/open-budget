const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const src = path.join(root, 'resources')
const dest = path.join(root, 'out', 'main', 'resources')

if (!fs.existsSync(src)) process.exit(0)
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.cpSync(src, dest, { recursive: true })
