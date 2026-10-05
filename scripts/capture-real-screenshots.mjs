import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'
import { spawnSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const outputDir = path.join(rootDir, 'docs', 'images')
const framesDir = path.join(rootDir, 'scratch_frames')

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const APP_URL = 'http://localhost:5174'

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function closeOpenModal(page) {
  await page.evaluate(() => {
    const modal = document.querySelector('div.fixed.inset-0')
    if (modal) {
      // Find the close button (top right X)
      const buttons = Array.from(modal.querySelectorAll('button'))
      const closeBtn = buttons.find((b) => b.querySelector('svg.lucide-x') || b.textContent?.trim() === '')
      if (closeBtn) closeBtn.click()
    }
  })
  await sleep(500)
}

async function run() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true })

  console.log('Launching Chrome via puppeteer-core...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const page = await browser.newPage()
  await page.goto(APP_URL, { waitUntil: 'networkidle0' })
  await sleep(1500)

  // -------------------------------------------------------------
  // Screenshot 1: Multi-Agent Swarm Timeline Canvas
  // -------------------------------------------------------------
  console.log('Capturing Screenshot 1: Multi-Agent Swarm Timeline Canvas...')
  await page.evaluate(() => {
    const select = document.querySelector('select')
    if (select) {
      select.value = 'multi_agent_swarm.json'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(1200)

  // Click on a subagent node to inspect details
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('.react-flow__node')
    if (nodes.length > 2) {
      nodes[2].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
  })
  await sleep(600)
  await page.screenshot({ path: path.join(outputDir, 'agent-trace-1.png') })
  console.log('✓ Saved agent-trace-1.png')

  // -------------------------------------------------------------
  // Screenshot 2: Infinite Loop Detection & Anomaly Banner
  // -------------------------------------------------------------
  console.log('Capturing Screenshot 2: Loop Detection & Anomaly Banner...')
  await page.evaluate(() => {
    const select = document.querySelector('select')
    if (select) {
      select.value = 'coding_agent_loop.json'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(1200)

  // Select one of the repeated nodes to highlight it
  await page.evaluate(() => {
    const nodes = document.querySelectorAll('.react-flow__node')
    if (nodes.length > 1) {
      nodes[1].dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
  })
  await sleep(600)
  await page.screenshot({ path: path.join(outputDir, 'agent-trace-2.png') })
  console.log('✓ Saved agent-trace-2.png')

  // -------------------------------------------------------------
  // Screenshot 3: Token Burn Waterfall & Cost Profiler
  // -------------------------------------------------------------
  console.log('Capturing Screenshot 3: Token Burn Chart & Analytics...')
  await page.evaluate(() => {
    // Switch to multi-agent swarm or research agent for richer token charts
    const select = document.querySelector('select')
    if (select) {
      select.value = 'multi_agent_swarm.json'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(800)

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('header button, nav button, button'))
    const tokensBtn = buttons.find((b) => b.textContent?.includes('Tokens'))
    if (tokensBtn) tokensBtn.click()
  })
  await sleep(1200)
  await page.screenshot({ path: path.join(outputDir, 'agent-trace-3.png') })
  console.log('✓ Saved agent-trace-3.png')

  // -------------------------------------------------------------
  // Screenshot 4: Context Memory Diff & Eviction Simulator
  // -------------------------------------------------------------
  console.log('Capturing Screenshot 4: Context Memory Diff & Eviction Simulator...')
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const diffBtn = buttons.find((b) => b.textContent?.includes('Memory Diff'))
    if (diffBtn) diffBtn.click()
  })
  await sleep(1500)

  // Expand Context Eviction Simulator
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const simToggle = buttons.find((b) => b.textContent?.includes('Context Eviction'))
    if (simToggle) simToggle.click()
  })
  await sleep(600)

  // Adjust eviction slider/select
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('select'))
    const retentionSelect = selects.find((s) => s.textContent?.includes('Non-System'))
    if (retentionSelect) {
      retentionSelect.value = '4'
      retentionSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(600)
  await page.screenshot({ path: path.join(outputDir, 'agent-trace-4.png') })
  console.log('✓ Saved agent-trace-4.png')

  // -------------------------------------------------------------
  // Screenshot 5: Trajectory Autopsy & Root-Cause Explainer Modal
  // -------------------------------------------------------------
  console.log('Capturing Screenshot 5: Trajectory Autopsy Modal...')
  // Switch back to timeline and select coding loop sample
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const timelineBtn = buttons.find((b) => b.textContent?.includes('Timeline'))
    if (timelineBtn) timelineBtn.click()
  })
  await sleep(600)

  await page.evaluate(() => {
    const select = document.querySelector('select')
    if (select) {
      select.value = 'coding_agent_loop.json'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(1000)

  // Open Autopsy
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const autopsyBtn = buttons.find((b) => b.textContent?.includes('Autopsy'))
    if (autopsyBtn) autopsyBtn.click()
  })
  await sleep(1200)
  await page.screenshot({ path: path.join(outputDir, 'agent-trace-5.png') })
  console.log('✓ Saved agent-trace-5.png')

  // Close Autopsy modal
  await closeOpenModal(page)

  // -------------------------------------------------------------
  // Screenshot 6: Persistent Trace Library Modal
  // -------------------------------------------------------------
  console.log('Capturing Screenshot 6: Trace Library Modal...')
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const libBtn = buttons.find((b) => b.textContent?.includes('Library'))
    if (libBtn) libBtn.click()
  })
  await sleep(1000)
  await page.screenshot({ path: path.join(outputDir, 'agent-trace-6.png') })
  console.log('✓ Saved agent-trace-6.png')

  // Close Library modal
  await closeOpenModal(page)

  // -------------------------------------------------------------
  // Capture Animation Frames for GIF
  // -------------------------------------------------------------
  console.log('Capturing frames for animated demo GIF...')
  let frameIdx = 0
  const saveFrame = async () => {
    const framePath = path.join(framesDir, `frame_${String(frameIdx).padStart(4, '0')}.png`)
    await page.screenshot({ path: framePath })
    frameIdx++
  }

  // 1. Swarm timeline view
  await page.evaluate(() => {
    const select = document.querySelector('select')
    if (select) {
      select.value = 'multi_agent_swarm.json'
      select.dispatchEvent(new Event('change', { bubbles: true }))
    }
  })
  await sleep(800)
  for (let i = 0; i < 5; i++) {
    await saveFrame()
    await sleep(120)
  }

  // 2. Play scrubber motion
  await page.keyboard.press('Space')
  for (let i = 0; i < 8; i++) {
    await saveFrame()
    await sleep(180)
  }
  await page.keyboard.press('Space') // Pause

  // 3. Switch to Token Analytics
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const tokensBtn = buttons.find((b) => b.textContent?.includes('Tokens'))
    if (tokensBtn) tokensBtn.click()
  })
  await sleep(800)
  for (let i = 0; i < 6; i++) {
    await saveFrame()
    await sleep(150)
  }

  // 4. Switch to Memory Diff
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const diffBtn = buttons.find((b) => b.textContent?.includes('Memory Diff'))
    if (diffBtn) diffBtn.click()
  })
  await sleep(1000)
  for (let i = 0; i < 6; i++) {
    await saveFrame()
    await sleep(150)
  }

  // 5. Switch back to timeline and open Autopsy
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const timelineBtn = buttons.find((b) => b.textContent?.includes('Timeline'))
    if (timelineBtn) timelineBtn.click()
  })
  await sleep(500)
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const autopsyBtn = buttons.find((b) => b.textContent?.includes('Autopsy'))
    if (autopsyBtn) autopsyBtn.click()
  })
  await sleep(800)
  for (let i = 0; i < 7; i++) {
    await saveFrame()
    await sleep(150)
  }
  await closeOpenModal(page)

  // 6. Open Library
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const libBtn = buttons.find((b) => b.textContent?.includes('Library'))
    if (libBtn) libBtn.click()
  })
  await sleep(800)
  for (let i = 0; i < 7; i++) {
    await saveFrame()
    await sleep(150)
  }
  await closeOpenModal(page)

  await browser.close()
  console.log(`✓ Captured ${frameIdx} animation frames`)

  // Compile GIF using ffmpeg with two-pass palettegen
  console.log('Compiling animated GIF via ffmpeg...')
  const palettePath = path.join(framesDir, 'palette.png')
  const gifPath = path.join(outputDir, 'agent-trace_demo.gif')

  // Step 1: generate palette
  spawnSync('ffmpeg', [
    '-y',
    '-framerate', '4',
    '-i', path.join(framesDir, 'frame_%04d.png'),
    '-vf', 'fps=4,scale=1000:-1:flags=lanczos,palettegen=stats_mode=diff',
    palettePath,
  ])

  // Step 2: create gif using palette
  spawnSync('ffmpeg', [
    '-y',
    '-framerate', '4',
    '-i', path.join(framesDir, 'frame_%04d.png'),
    '-i', palettePath,
    '-lavfi', 'fps=4,scale=1000:-1:flags=lanczos [x]; [x][1:v] paletteuse=dither=bayer:bayer_scale=5',
    gifPath,
  ])

  console.log('✓ Successfully generated docs/images/agent-trace_demo.gif')

  // Clean up scratch frames
  fs.rmSync(framesDir, { recursive: true, force: true })
  console.log('✓ Cleaned up scratch frames')
}

run().catch((err) => {
  console.error('Capture failed:', err)
  process.exit(1)
})
