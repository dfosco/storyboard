import { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import { saveDrag } from './utils';

const TRANSLATION_MS = 250;
const PERSIST_DEADZONE_PX = 4;
const ROTATION_DEADZONE_PX = 20;
const ROTATION_DEG = 1.5;

/** Minimum hold time (ms) before drag can start.
 *  Quick clicks (release before this) never trigger drag. */
const DRAG_DELAY_MS = 150;

/** Minimum pointer travel (px) from the initial pointerdown position
 *  before drag can start. Computed from the raw clientX/Y delta —
 *  not from neodrag's translate-offset-based calculation (which is
 *  broken for positioned elements). */
const DRAG_DISTANCE_PX = 8;

function Draggable({ children, dragId, initialPosition, onDragEnd, handle }) {
  const draggableRef = useRef(null);
  const initialSavedPosition = initialPosition || { x: 0, y: 0 };
  const dragStartRef = useRef(initialSavedPosition);
  const hasMovedRef = useRef(false);
  const [isRotating, setIsRotating] = useState(false);

  // Gate ref for our drag threshold
  const gateRef = useRef({
    timer: null,
    startX: 0,
    startY: 0,
    delayMet: false,
    distanceMet: false,
    active: false,
    lastEvent: null,
  });

  const [position, setPosition] = useState(initialSavedPosition);
  const [rotationVariation, setRotationVariation] = useState(
    () => Math.random() < 0.5 ? -ROTATION_DEG : ROTATION_DEG
  );

  // Animate elements with saved positions on mount
  useEffect(() => {
    const el = draggableRef.current;
    if (
      el &&
      dragId &&
      (initialSavedPosition.x !== 0 || initialSavedPosition.y !== 0)
    ) {
      el.classList.add('tc-on-translation');

      const timer = setTimeout(() => {
        el.classList.remove('tc-on-translation');
      }, TRANSLATION_MS * 4);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [dragId, initialSavedPosition.x, initialSavedPosition.y]);

  // Gate neodrag: intercept pointerdown on the handle via delegation.
  // We listen on the article element and check if the event target is
  // inside the handle. stopPropagation in bubble phase prevents neodrag
  // (which also listens on the article in bubble phase) from seeing it.
  //
  // After both delay and distance thresholds are met, we re-dispatch a
  // synthetic pointerdown from the original target — it bubbles up to
  // the article and neodrag picks it up.
  //
  // React 18 captures events at the root container during capture phase,
  // so React handlers (onPointerDown/onPointerUp) still fire normally.
  useEffect(() => {
    const el = draggableRef.current;
    if (!el || !handle) return;

    const g = gateRef.current;
    let synthEvent = null;

    function isHandleEvent(e) {
      const handleEl = el.querySelector(handle);
      return handleEl && handleEl.contains(e.target);
    }

    function onArticlePointerDownCapture(e) {
      // Let synthetic re-dispatched events pass through to neodrag
      if (e === synthEvent) {
        synthEvent = null;
        return;
      }
      if (!isHandleEvent(e)) return;
      // stopImmediatePropagation prevents neodrag's bubble listener
      // on this same article from seeing the event
      e.stopImmediatePropagation();
      g.active = true;
      g.delayMet = false;
      g.distanceMet = false;
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.target = e.target;
      g.pointerId = e.pointerId;
      g.button = e.button;
      g.pointerType = e.pointerType;
      clearTimeout(g.timer);
      g.timer = setTimeout(() => {
        g.delayMet = true;
        tryEnable();
      }, DRAG_DELAY_MS);
    }

    function tryEnable() {
      if (g.delayMet && g.distanceMet && g.active && g.target) {
        const synth = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: g.pointerId,
          clientX: g.startX,
          clientY: g.startY,
          button: g.button,
          pointerType: g.pointerType,
        });
        synthEvent = synth;
        g.target.dispatchEvent(synth);
        g.target = null;
      }
    }

    function onDocPointerMove(e) {
      if (!g.active || g.distanceMet) return;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (Math.hypot(dx, dy) >= DRAG_DISTANCE_PX) {
        g.distanceMet = true;
        tryEnable();
      }
    }

    function onDocPointerUp() {
      clearTimeout(g.timer);
      g.active = false;
      g.target = null;
    }

    el.addEventListener('pointerdown', onArticlePointerDownCapture, true);
    document.addEventListener('pointermove', onDocPointerMove);
    document.addEventListener('pointerup', onDocPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onArticlePointerDownCapture, true);
      document.removeEventListener('pointermove', onDocPointerMove);
      document.removeEventListener('pointerup', onDocPointerUp);
      clearTimeout(g.timer);
    };
  }, [handle]);

  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    bounds: 'parent',
    defaultClass: 'tc-drag',
    defaultClassDragging: 'tc-on',
    defaultClassDragged: 'tc-off',
    applyUserSelectHack: true,
    ...(handle ? { handle } : {}),
    position: { x: position.x, y: position.y },
    onDragStart: () => {
      dragStartRef.current = position;
      hasMovedRef.current = false;
      setIsRotating(false);
    },
    onDrag: ({ offsetX, offsetY }) => {
      const dx = offsetX - dragStartRef.current.x;
      const dy = offsetY - dragStartRef.current.y;
      const distance = Math.hypot(dx, dy);
      if (!hasMovedRef.current && distance >= PERSIST_DEADZONE_PX) {
        hasMovedRef.current = true;
      }
      if (!isRotating && distance >= ROTATION_DEADZONE_PX) {
        setIsRotating(true);
      }
      setPosition({ x: Math.max(0, offsetX), y: Math.max(0, offsetY) });
    },
    onDragEnd: (data) => {
      const clampedX = Math.max(0, data.offsetX);
      const clampedY = Math.max(0, data.offsetY);
      setPosition({ x: clampedX, y: clampedY });
      setRotationVariation(Math.random() < 0.5 ? -ROTATION_DEG : ROTATION_DEG);
      setIsRotating(false);
      const dx = clampedX - dragStartRef.current.x;
      const dy = clampedY - dragStartRef.current.y;
      const movedEnough = hasMovedRef.current || Math.hypot(dx, dy) >= PERSIST_DEADZONE_PX;
      if (!movedEnough) return;

      if (dragId) {
        saveDrag(dragId, clampedX, clampedY);
      }
      onDragEnd?.(dragId, { x: clampedX, y: clampedY });
    },
  });

  const rotation = isDragging && isRotating ? `${rotationVariation}deg` : '0deg';

  // When a handle is set, only the handle shows grab cursor (via its own CSS).
  // Otherwise the whole article is the drag surface.
  const articleCursor = handle
    ? (isDragging ? 'grabbing' : undefined)
    : (isDragging ? 'grabbing' : 'grab');

  return (
    <article
      ref={draggableRef}
      style={{ cursor: articleCursor }}
    >
      <div
        className="tc-draggable-inner"
        style={{
          transform: isDragging ? `rotate(${rotation})` : undefined,
          transition: 'transform ease-in-out 150ms',
        }}
      >
        {children}
      </div>
    </article>
  );
}

export default Draggable;
