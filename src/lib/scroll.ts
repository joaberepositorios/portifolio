import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let lenis: Lenis | null = null
let locks = 0

/**
 * Inertial wheel scrolling on desktop pointers only. Touch devices keep their
 * native momentum, and reduced-motion users keep plain scrolling.
 */
export function initSmoothScroll(): () => void {
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!finePointer || reducedMotion) return () => {}

  // Anchor jumps respect the CSS `scroll-padding-top`, so the fixed header never covers a heading.
  const instance = new Lenis({ lerp: 0.14, autoRaf: true, anchors: true })
  lenis = instance
  if (locks > 0) instance.stop()

  return () => {
    instance.destroy()
    if (lenis === instance) lenis = null
  }
}

/** Freezes page scrolling while an overlay (menu, article reader) is open. Calls nest. */
export function lockScroll(): () => void {
  locks++
  document.body.classList.add('is-locked')
  lenis?.stop()

  let released = false
  return () => {
    if (released) return
    released = true
    locks--
    if (locks === 0) {
      document.body.classList.remove('is-locked')
      lenis?.start()
    }
  }
}

/** Runs `callback` at most once per frame while the page scrolls or resizes. */
export function onScrollFrame(callback: () => void): () => void {
  let raf = 0
  const request = () => {
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0
        callback()
      })
    }
  }
  window.addEventListener('scroll', request, { passive: true })
  window.addEventListener('resize', request)
  request()
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', request)
    window.removeEventListener('resize', request)
  }
}
