import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type BottomSheetProps = {
  children: ReactNode
  closeLabel: string
  onClose: () => void
  open: boolean
  title: string
  titleId?: string
}

type DragState = {
  active: boolean
  offsetY: number
  pointerId: number | null
  lastT: number
  lastY: number
  startY: number
  velocityY: number
}

const CLOSE_DISTANCE_PX = 96
/** px/ms downward (positive) */
const CLOSE_VELOCITY = 0.38
const SLIDE_OUT_MS = 220

export function BottomSheet({ children, closeLabel, onClose, open, title, titleId = 'bottom-sheet-title' }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closingSwipeRef = useRef(false)

  const dragRef = useRef<DragState>({
    active: false,
    offsetY: 0,
    pointerId: null,
    lastT: 0,
    lastY: 0,
    startY: 0,
    velocityY: 0,
  })

  const resetDragOnly = () => {
    dragRef.current = {
      active: false,
      offsetY: 0,
      pointerId: null,
      lastT: 0,
      lastY: 0,
      startY: 0,
      velocityY: 0,
    }
  }

  const snapPanelBack = useCallback(() => {
    const el = panelRef.current
    if (!el) return

    el.style.transition = 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)'
    el.style.transform = 'translateY(0)'
    window.setTimeout(() => {
      if (!panelRef.current) return
      panelRef.current.style.transition = ''
      panelRef.current.style.transform = ''
    }, 230)
  }, [])

  const swipeDismiss = useCallback(() => {
    if (closingSwipeRef.current) return
    closingSwipeRef.current = true

    const el = panelRef.current
    if (!el) {
      closingSwipeRef.current = false
      onClose()
      return
    }

    el.style.transition = `transform ${SLIDE_OUT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
    el.style.transform = 'translateY(110%)'

    window.setTimeout(() => {
      closingSwipeRef.current = false
      onClose()
    }, SLIDE_OUT_MS)
  }, [onClose])

  const onChromePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (closingSwipeRef.current) return
    if ((event.pointerType === 'mouse' || event.pointerType === 'pen') && event.button !== 0) return

    const target = event.target as HTMLElement
    if (target.closest('button, a[href], [role="button"]')) return

    const panel = panelRef.current
    if (!panel) return

    const now = performance.now()
    dragRef.current = {
      active: true,
      offsetY: 0,
      pointerId: event.pointerId,
      lastT: now,
      lastY: event.clientY,
      startY: event.clientY,
      velocityY: 0,
    }
    panel.style.transition = 'none'
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onChromePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d.active || event.pointerId !== d.pointerId) return

    const panel = panelRef.current
    if (!panel) return

    const now = performance.now()
    const dt = now - d.lastT
    if (dt > 0) {
      const vy = (event.clientY - d.lastY) / dt
      d.velocityY = d.velocityY * 0.45 + vy * 0.55
    }
    d.lastY = event.clientY
    d.lastT = now

    const offsetY = Math.max(0, event.clientY - d.startY)
    d.offsetY = offsetY
    panel.style.transform = `translateY(${offsetY}px)`

    if (offsetY > 0) {
      event.preventDefault()
    }
  }, [])

  const onChromePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const d = dragRef.current
      if (!d.active || event.pointerId !== d.pointerId) return

      d.active = false

      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        // Ignore duplicate releases
      }

      const { offsetY, velocityY } = d
      resetDragOnly()

      if (closingSwipeRef.current) return

      const dismiss = offsetY >= CLOSE_DISTANCE_PX || velocityY >= CLOSE_VELOCITY

      if (dismiss) {
        swipeDismiss()
      } else {
        snapPanelBack()
      }
    },
    [snapPanelBack, swipeDismiss],
  )

  const onChromeLostCapture = useCallback(() => {
    if (!dragRef.current.active) return
    resetDragOnly()
    if (!closingSwipeRef.current) {
      snapPanelBack()
    }
  }, [snapPanelBack])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onKey = (eve: KeyboardEvent) => {
      if (eve.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      closingSwipeRef.current = false
    }
  }, [open])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal={true}
      className="fixed inset-0 z-100 flex flex-col justify-end"
      role="dialog"
    >
      <button
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={onClose}
        type="button"
      />

      <div className="pointer-events-none relative z-1 w-full">
        <div className="mx-auto w-full max-w-lg px-4 pb-0">
          {/* Ref + transform applied here — drag only starts from chrome (handle + header), not scroll body */}
          <div
            ref={panelRef}
            className="pointer-events-auto flex max-h-[76vh] min-h-0 animate-[bottom-sheet-rise_0.32s_cubic-bezier(0.22,1,0.36,1)] flex-col overflow-hidden rounded-t-[1.35rem] bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-16px_48px_rgba(12,28,74,0.22)] will-change-transform"
          >
            {/* Swipe chrome: excludes scrollable `{children}` (no pointer handlers on body) */}
            <div
              className="shrink-0 touch-none select-none cursor-grab pb-px active:cursor-grabbing"
              onLostPointerCapture={onChromeLostCapture}
              onPointerCancel={onChromePointerEnd}
              onPointerDown={onChromePointerDown}
              onPointerMove={onChromePointerMove}
              onPointerUp={onChromePointerEnd}
            >
              <div aria-hidden className="flex justify-center pb-2 pt-3">
                <span className="h-1.5 w-11 rounded-full bg-[#d3d8e6]" />
              </div>

              <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2 pt-0.5">
                <h2 className="min-w-0 flex-1 pr-2 text-[1.06rem] font-semibold leading-snug text-[#111a35]" id={titleId}>
                  {title}
                </h2>
                <button
                  aria-label={closeLabel}
                  className="inline-flex h-10 w-10 shrink-0 cursor-pointer touch-manipulation items-start justify-center rounded-full text-[#5f6c8b] transition hover:text-[#111a35]"
                  onClick={onClose}
                  type="button"
                >
                  <X aria-hidden size={21} strokeWidth={2} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pt-2">{children}</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bottom-sheet-rise {
          from {
            transform: translateY(104%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}
