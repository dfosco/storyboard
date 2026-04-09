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

  // Drag gate: neodrag is disabled until our own threshold is met.
  const [dragEnabled, setDragEnabled] = useState(false);
  const gateRef = useRef({
    timer: null,
    startX: 0,
    startY: 0,
    delayMet: false,
    distanceMet: false,
    active: false,
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

  // Our own threshold gate. neodrag's built-in distance threshold uses
  // the element's translate offset, not the pointer start position, so
  // it fires immediately on positioned widgets. We keep neodrag disabled
  // until BOTH our delay and distance thresholds (based on raw clientX/Y)
  // are met, then enable it so neodrag picks up the ongoing interaction.
  useEffect(() => {
    const el = draggableRef.current;
    if (!el) return;

    const g = gateRef.current;

    function tryEnable() {
      if (g.delayMet && g.distanceMet && g.active) {
        setDragEnabled(true);
      }
    }

    function onPointerDown(e) {
      if (handle) {
        const handleEl = el.querySelector(handle);
        if (!handleEl || !handleEl.contains(e.target)) return;
      }
      g.active = true;
      g.delayMet = false;
      g.distanceMet = false;
      g.startX = e.clientX;
      g.startY = e.clientY;
      clearTimeout(g.timer);
      g.timer = setTimeout(() => {
        g.delayMet = true;
        tryEnable();
      }, DRAG_DELAY_MS);
    }

    function onPointerMove(e) {
      if (!g.active || g.distanceMet) return;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (Math.hypot(dx, dy) >= DRAG_DISTANCE_PX) {
        g.distanceMet = true;
        tryEnable();
      }
    }

    function onPointerUp() {
      clearTimeout(g.timer);
      g.active = false;
      setDragEnabled(false);
    }

    el.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      clearTimeout(g.timer);
    };
  }, [handle]);

  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    bounds: 'parent',
    disabled: !dragEnabled,
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
