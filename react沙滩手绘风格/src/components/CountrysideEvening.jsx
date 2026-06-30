import React, { useEffect, useRef } from 'react'
import rough from 'roughjs'

const FRAME_COUNT = 12
const FRAME_INTERVAL = 250
const W = 400
const H = 300

const CountrysideEvening = () => {
  const canvasRef = useRef(null)
  const framesRef = useRef([])
  const frameIndexRef = useRef(0)
  const lastDrawTimeRef = useRef(0)
  const rafRef = useRef(null)

  const draw = (ctx, rc) => {
    const horizonY = 145

    // sky — layered sunset
    rc.rectangle(0, 0, W, 55, { fill: '#2d1b5e', stroke: 'transparent', roughness: 0.3 })
    rc.rectangle(0, 55, W, 40, { fill: '#5c2d7a', stroke: 'transparent', roughness: 0.3 })
    rc.rectangle(0, 95, W, 30, { fill: '#b8455e', stroke: 'transparent', roughness: 0.3 })
    rc.rectangle(0, 125, W, 20, { fill: '#e87840', stroke: 'transparent', roughness: 0.3 })

    // sun
    const sunCX = 270, sunR = 50
    rc.path(
      `M${sunCX - sunR} ${horizonY} A ${sunR} ${sunR} 0 0 1 ${sunCX + sunR} ${horizonY} L${sunCX - sunR} ${horizonY} Z`,
      { fill: '#ff6611', stroke: '#ff7722', fillWeight: 2, hachureAngle: 90 },
    )
    const innerR = sunR * 0.72
    rc.path(
      `M${sunCX - innerR + 6} ${horizonY} A ${innerR} ${innerR} 0 0 1 ${sunCX + innerR - 6} ${horizonY} L${sunCX - innerR + 6} ${horizonY} Z`,
      { fill: '#ff9933', stroke: 'transparent', fillWeight: 2, hachureGap: 6, hachureAngle: 90, roughness: 1.5 },
    )

    // fields
    rc.rectangle(0, horizonY, W, 50, { fill: '#c4a44a', stroke: 'transparent', roughness: 0.4 })
    rc.rectangle(0, horizonY + 50, W, 45, { fill: '#5c8040', stroke: 'transparent', roughness: 0.4 })
    rc.rectangle(0, horizonY + 95, W, H - horizonY - 95, { fill: '#8b6d50', stroke: 'transparent', roughness: 0.5 })

    // dirt path
    rc.linearPath([[85, 200], [130, 235], [200, 258], [290, 272], [390, 295]], {
      stroke: '#a08060', strokeWidth: 16, roughness: 1.5,
    })

    // farmhouse body
    const hx = 58, hy = 170, hw = 56, hh = 38
    rc.rectangle(hx, hy, hw, hh, { fill: '#dcb080', stroke: '#6b4f3c', fillWeight: 2, roughness: 0.6 })
    // roof
    const roofPeak = hy - 30
    rc.path(`M${hx - 10} ${hy} L${hx + hw / 2} ${roofPeak} L${hx + hw + 10} ${hy} Z`, {
      fill: '#7a3510', stroke: '#5c2408', fillWeight: 2, roughness: 0.6,
    })
    // door
    rc.rectangle(hx + 19, hy + 8, 18, 30, { fill: '#4a2810', stroke: '#301808', roughness: 0.4 })
    // window
    rc.rectangle(hx + 5, hy + 6, 12, 12, { fill: '#ffdd88', stroke: '#6b4f3c', strokeWidth: 1, roughness: 0.3 })
    // chimney
    const chimneyX = hx + 38
    rc.rectangle(chimneyX, roofPeak, 10, 20, { fill: '#8b6b4a', stroke: '#5c3a1e', strokeWidth: 1.2, roughness: 0.5 })
    // chimney smoke
    for (let s = 0; s < 3; s++) {
      rc.circle(chimneyX + 5, roofPeak - 8 - s * 10, 3 + s * 1.5, {
        fill: '#d0d0d0', stroke: 'transparent', fillWeight: 1, roughness: 0.7,
      })
    }

    // trees (trunk + canopy)
    for (const [tx, ty, th, cr] of [[210, 170, 38, 26], [350, 182, 28, 18], [18, 188, 22, 13]]) {
      rc.linearPath([[tx, ty], [tx, ty + th]], { stroke: '#4a2a14', strokeWidth: 5, roughness: 0.6 })
      rc.circle(tx, ty - cr * 0.2, cr, { fill: '#2d4a14', stroke: '#1f3508', fillWeight: 2.5, roughness: 1.4 })
    }

    // fence
    const fenceY = horizonY + 90
    rc.linearPath([[0, fenceY], [W, fenceY]], { stroke: '#6b4f3c', strokeWidth: 2, roughness: 0.9 })
    rc.linearPath([[0, fenceY + 8], [W, fenceY + 8]], { stroke: '#6b4f3c', strokeWidth: 2, roughness: 0.9 })
    for (let px = 6; px < W; px += 44) {
      rc.linearPath([[px, fenceY - 3], [px, fenceY + 11]], { stroke: '#4a2a14', strokeWidth: 2.8, roughness: 0.6 })
    }
  }

  const preRenderFrames = (dpr) => {
    const cw = W * dpr
    const ch = H * dpr
    framesRef.current = Array.from({ length: FRAME_COUNT }, () => {
      const offscreen = new OffscreenCanvas(cw, ch)
      const offCtx = offscreen.getContext('2d')
      offCtx.scale(dpr, dpr)
      const rc = rough.canvas(offscreen)
      draw(offCtx, rc)
      return offscreen
    })
  }

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const cw = W * dpr
    const ch = H * dpr
    canvas.width = cw
    canvas.height = ch
    ctx.scale(dpr, dpr)

    preRenderFrames(dpr)

    const loop = (t) => {
      rafRef.current = requestAnimationFrame(loop)
      if (framesRef.current.length < FRAME_COUNT) return
      if (t - lastDrawTimeRef.current < FRAME_INTERVAL) return
      lastDrawTimeRef.current = t
      ctx.clearRect(0, 0, cw, ch)
      ctx.drawImage(framesRef.current[frameIndexRef.current], 0, 0, cw, ch)
      frameIndexRef.current = (frameIndexRef.current + 1) % FRAME_COUNT
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return <canvas ref={canvasRef} style={{ width: `${W}px`, height: `${H}px` }} />
}

export default CountrysideEvening
