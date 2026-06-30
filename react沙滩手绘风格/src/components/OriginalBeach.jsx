import React, { useEffect, useRef, useMemo } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import rough from 'roughjs'
import { TreePalm, Umbrella, Sailboat } from 'lucide-react'

const FRAME_COUNT = 12
const FRAME_INTERVAL = 250
const W = 400
const H = 300

const OriginalBeach = () => {
  const canvasRef = useRef(null)
  const framesRef = useRef([])
  const frameIndexRef = useRef(0)
  const lastDrawTimeRef = useRef(0)
  const rafRef = useRef(null)

  const icons = useMemo(() => {
    return [
      { icon: TreePalm, color: 'seagreen', position: [10, 120], scale: 6 },
      { icon: Umbrella, color: 'hotpink', position: [290, 170], scale: 4 },
      { icon: Sailboat, color: 'darkorange', position: [260, 90], scale: 3 },
    ].map(({ icon, color, ...rest }) => {
      const svg = renderToStaticMarkup(React.createElement(icon))
      const parser = new DOMParser()
      const doc = parser.parseFromString(svg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')
      const pathEls = svgEl?.querySelectorAll('path') ?? []
      const paths = [...pathEls].map(p => p.getAttribute('d'))
      return { paths, color, ...rest }
    })
  }, [])

  const draw = (ctx, rc) => {
    // sky
    rc.rectangle(0, 0, W, 100, { fill: 'coral', stroke: 'transparent', roughness: 0.2 })

    // sun top half
    rc.path('M130 100 A 70 70 0 0 1 270 100 L130 100 Z', {
      fill: '#ffcc33', stroke: '#ffcc33', fillWeight: 2, hachureAngle: 90,
    })
    // sun bottom half
    rc.path('M140 100 A 60 60 0 0 0 260 100 L140 100 Z', {
      fill: 'gold', stroke: 'transparent', fillWeight: 2, hachureGap: 8, hachureAngle: 90, roughness: 2,
    })

    // sea
    rc.rectangle(0, 100, W, 100, { fill: 'royalblue', stroke: 'transparent', hachureGap: 5, roughness: 0.5 })
    // beach
    rc.rectangle(0, 200, W, 100, { fill: 'burlywood', stroke: 'transparent', roughness: 0.2 })

    // icons
    for (const { paths, color, position, scale } of icons) {
      ctx.save()
      ctx.translate(...position)
      ctx.scale(scale, scale)
      for (const d of paths) {
        rc.path(d, {
          stroke: color, fill: color,
          fillWeight: 1.5 / scale, roughness: 0.5, strokeWidth: 1.5 / scale,
        })
      }
      ctx.restore()
    }
  }

  const preRenderFrames = (cw, ch, dpr) => {
    framesRef.current = Array.from({ length: FRAME_COUNT }, () => {
      const offscreen = new OffscreenCanvas(cw * dpr, ch * dpr)
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
    const [cw, ch] = [W * dpr, H * dpr]
    canvas.width = cw
    canvas.height = ch
    ctx.scale(dpr, dpr)

    preRenderFrames(W, H, dpr)

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

export default OriginalBeach
