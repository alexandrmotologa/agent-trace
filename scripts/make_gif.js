import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const docsImg = path.resolve('docs/images')
const listPath = path.join(docsImg, 'slides.txt')

const lines = [
  `file '${path.join(docsImg, 'agent-trace-1.png').replace(/\\/g, '/')}'`,
  `duration 2.5`,
  `file '${path.join(docsImg, 'agent-trace-2.png').replace(/\\/g, '/')}'`,
  `duration 2.5`,
  `file '${path.join(docsImg, 'agent-trace-3.png').replace(/\\/g, '/')}'`,
  `duration 2.5`,
  `file '${path.join(docsImg, 'agent-trace-4.png').replace(/\\/g, '/')}'`,
  `duration 2.5`,
  `file '${path.join(docsImg, 'agent-trace-5.png').replace(/\\/g, '/')}'`,
  `duration 2.5`,
  `file '${path.join(docsImg, 'agent-trace-5.png').replace(/\\/g, '/')}'`,
]

fs.writeFileSync(listPath, lines.join('\n'), 'utf8')
console.log('Generated slides.txt')

const outGif = path.join(docsImg, 'agent-trace_demo.gif')
const cmd = `ffmpeg -y -f concat -safe 0 -i "${listPath}" -vf "fps=10,scale=1280:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer" "${outGif}"`
console.log('Running ffmpeg...')
execSync(cmd, { stdio: 'inherit' })
console.log('Generated', outGif)
