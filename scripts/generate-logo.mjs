import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { Resvg } from '@resvg/resvg-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function buildLogoSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="24" y="24" width="976" height="976" rx="220" />
    </clipPath>

    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5ff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>

    <linearGradient id="violet-glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>

    <linearGradient id="amber-accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>

    <filter id="subtle-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Luxury White Squircle Container -->
  <rect x="24" y="24" width="976" height="976" rx="220" fill="#ffffff" stroke="#e2e8f0" stroke-width="6" />

  <g clip-path="url(#squircle-clip)">
    <g transform="translate(512, 512)" filter="url(#subtle-shadow)">

      <!-- Hexagonal Architectural Gateway Frame -->
      <polygon points="
        0,-390
        338,-195
        338,195
        0,390
        -338,195
        -338,-195
      " fill="none" stroke="#0f172a" stroke-width="36" stroke-linejoin="round" />

      <!-- Inner Dashed Telemetry Ring -->
      <polygon points="
        0,-355
        307,-177
        307,177
        0,355
        -307,177
        -307,-177
      " fill="none" stroke="#00f5ff" stroke-width="4" opacity="0.45" stroke-dasharray="16, 12" />

      <!-- Outer Radar Compass Ticks -->
      <line x1="0" y1="-390" x2="0" y2="-365" stroke="#a855f7" stroke-width="6" stroke-linecap="round" />
      <line x1="0" y1="390" x2="0" y2="365" stroke="#a855f7" stroke-width="6" stroke-linecap="round" />
      <line x1="-338" y1="-195" x2="-315" y2="-182" stroke="#00f5ff" stroke-width="6" stroke-linecap="round" />
      <line x1="338" y1="-195" x2="315" y2="-182" stroke="#00f5ff" stroke-width="6" stroke-linecap="round" />
      <line x1="-338" y1="195" x2="-315" y2="182" stroke="#00f5ff" stroke-width="6" stroke-linecap="round" />
      <line x1="338" y1="195" x2="315" y2="182" stroke="#00f5ff" stroke-width="6" stroke-linecap="round" />

      <!-- ============================================== -->
      <!-- 100% Watertight Solid Base Silhouette (Zero Leak) -->
      <!-- ============================================== -->
      <path d="
        M 0,-240
        L 70,-260 L 135,-335 L 160,-240 L 225,-120 L 250,-20 L 260,110 L 240,220 L 165,320 L 70,365 L 0,375
        L -70,365 L -165,320 L -240,220 L -260,110 L -250,-20 L -225,-120 L -160,-240 L -135,-335 L -70,-260
        Z
      " fill="#0b0f19" />

      <!-- ============================================== -->
      <!-- Low-Poly Facets: Head & Horned Ear Tufts       -->
      <!-- ============================================== -->
      <!-- Left Ear Tuft -->
      <polygon points="-70,-260 -135,-335 -160,-240" fill="#1e293b" />
      <polygon points="-70,-260 -160,-240 -80,-210" fill="#334155" />
      <polygon points="0,-240 -70,-260 -80,-210 0,-185" fill="#475569" />

      <!-- Right Ear Tuft (Symmetrical) -->
      <polygon points="70,-260 135,-335 160,-240" fill="#0f172a" />
      <polygon points="70,-260 160,-240 80,-210" fill="#1e293b" />
      <polygon points="0,-240 70,-260 80,-210 0,-185" fill="#334155" />

      <!-- Strong V-Shaped Forehead & Brow (The Fierce Owl Ridge) -->
      <polygon points="0,-185 -80,-210 -150,-150 -70,-110" fill="#475569" />
      <polygon points="0,-185 80,-210 150,-150 70,-110" fill="#334155" />

      <polygon points="0,-185 -70,-110 0,-75" fill="#334155" />
      <polygon points="0,-185 70,-110 0,-75" fill="#1e293b" />

      <!-- Temple Outer Flaps Left -->
      <polygon points="-160,-240 -225,-120 -150,-150" fill="#1e293b" />
      <polygon points="-225,-120 -250,-20 -165,-40 -150,-150" fill="#0f172a" />

      <!-- Temple Outer Flaps Right -->
      <polygon points="160,-240 225,-120 150,-150" fill="#0b0f19" />
      <polygon points="225,-120 250,-20 165,-40 150,-150" fill="#0f172a" />

      <!-- Facial Disk Outer Rings -->
      <polygon points="-70,-110 -150,-150 -165,-40 -90,-45" fill="#1e293b" />
      <polygon points="70,-110 150,-150 165,-40 90,-45" fill="#0f172a" />

      <!-- ============================================== -->
      <!-- Piercing Predator Optics (Hexagonal Telemetry Eyes) -->
      <!-- ============================================== -->
      <!-- Left Eye Optical Socket (Hexagon) -->
      <polygon points="-90,-130 -130,-105 -130,-75 -90,-50 -50,-75 -50,-105" fill="#070d18" stroke="#00f5ff" stroke-width="2.5" />
      <polygon points="-90,-124 -124,-103 -124,-77 -90,-56 -56,-77 -56,-103" fill="url(#cyan-glow)" />
      <!-- Left Pupil / Aperture Core -->
      <polygon points="-90,-115 -108,-100 -108,-80 -90,-65 -72,-80 -72,-100" fill="#040711" />
      <!-- Left Specular Reflections -->
      <circle cx="-100" cy="-102" r="4.5" fill="#ffffff" />
      <circle cx="-80" cy="-78" r="2.5" fill="#00f5ff" />

      <!-- Right Eye Optical Socket (Hexagon) -->
      <polygon points="90,-130 130,-105 130,-75 90,-50 50,-75 50,-105" fill="#070d18" stroke="#00f5ff" stroke-width="2.5" />
      <polygon points="90,-124 124,-103 124,-77 90,-56 56,-77 56,-103" fill="url(#cyan-glow)" />
      <!-- Right Pupil / Aperture Core -->
      <polygon points="90,-115 108,-100 108,-80 90,-65 72,-80 72,-100" fill="#040711" />
      <!-- Right Specular Reflections -->
      <circle cx="80" cy="-102" r="4.5" fill="#ffffff" />
      <circle cx="100" cy="-78" r="2.5" fill="#00f5ff" />

      <!-- ============================================== -->
      <!-- Geometric Beak / Rostrum                       -->
      <!-- ============================================== -->
      <polygon points="0,-75 -26,-20 0,40" fill="#475569" />
      <polygon points="0,-75 26,-20 0,40" fill="#1e293b" />
      <polygon points="0,40 -12,12 0,0 12,12" fill="url(#amber-accent)" />

      <!-- Muzzle Cheeks Lateral -->
      <polygon points="-26,-20 -90,-45 -165,-40 -125,50 -45,35 0,40" fill="#334155" />
      <polygon points="26,-20 90,-45 165,-40 125,50 45,35 0,40" fill="#1e293b" />

      <!-- ============================================== -->
      <!-- Body & Folded Wings (Timeline Facet Architecture)-->
      <!-- ============================================== -->
      <!-- Center Gorget / Chest Shield -->
      <polygon points="0,35 -40,30 -75,110 0,140" fill="#475569" />
      <polygon points="0,35 40,30 75,110 0,140" fill="#334155" />

      <!-- Core Trace Chevron Emblem (Violet to Cyan) -->
      <polygon points="0,75 -35,115 -18,135 0,118 18,135 35,115" fill="url(#violet-glow)" stroke="#00f5ff" stroke-width="1.5" />

      <!-- Lower Breastplate Facets -->
      <polygon points="0,140 -75,110 -110,210 0,250" fill="#334155" />
      <polygon points="0,140 75,110 110,210 0,250" fill="#1e293b" />

      <polygon points="0,250 -110,210 -80,310 0,350" fill="#1e293b" />
      <polygon points="0,250 110,210 80,310 0,350" fill="#0f172a" />

      <polygon points="0,350 -80,310 -40,360 0,365" fill="#0f172a" />
      <polygon points="0,350 80,310 40,360 0,365" fill="#0b0f19" />

      <!-- Left Wing Timeline Facets -->
      <polygon points="-160,-50 -245,-20 -255,100 -185,80 -120,40" fill="#1e293b" />
      <polygon points="-120,40 -185,80 -210,180 -75,110" fill="#334155" />
      <polygon points="-255,100 -235,210 -210,180" fill="#0f172a" />
      <polygon points="-210,180 -235,210 -160,310 -110,210" fill="#1e293b" />
      <polygon points="-110,210 -160,310 -80,310" fill="#0f172a" />
      <polygon points="-160,310 -70,355 -40,360 -80,310" fill="#0b0f19" />

      <!-- Right Wing Timeline Facets (Symmetrical volumetric shading) -->
      <polygon points="160,-50 245,-20 255,100 185,80 120,40" fill="#0f172a" />
      <polygon points="120,40 185,80 210,180 75,110" fill="#1e293b" />
      <polygon points="255,100 235,210 210,180" fill="#0b0f19" />
      <polygon points="210,180 235,210 160,310 110,210" fill="#0f172a" />
      <polygon points="110,210 160,310 80,310" fill="#0b0f19" />
      <polygon points="160,310 70,355 40,360 80,310" fill="#040812" />

      <!-- Lateral Vector Trim Lines (Tracing Paths) -->
      <line x1="-185" y1="80" x2="-210" y2="180" stroke="#00f5ff" stroke-width="2" opacity="0.6" />
      <line x1="185" y1="80" x2="210" y2="180" stroke="#00f5ff" stroke-width="2" opacity="0.6" />
      <circle cx="-185" cy="80" r="3.5" fill="#00f5ff" />
      <circle cx="185" cy="80" r="3.5" fill="#00f5ff" />
      <circle cx="-210" cy="180" r="3.5" fill="#a855f7" />
      <circle cx="210" cy="180" r="3.5" fill="#a855f7" />

    </g>
  </g>
</svg>`
}

async function run() {
  const outputDir = path.join(rootDir, 'docs', 'images')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const svg = buildLogoSvg()
  const svgPath = path.join(outputDir, 'logo.svg')
  const pngPath = path.join(outputDir, 'logo.png')

  fs.writeFileSync(svgPath, svg, 'utf8')
  console.log('✓ Wrote logo.svg')

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 } })
  const pngData = resvg.render().asPng()
  fs.writeFileSync(pngPath, pngData)
  console.log('✓ Rendered logo.png (1024x1024) via Resvg')
}

run().catch(console.error)
