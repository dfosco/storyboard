import { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import { saveDrag } from './utils';

const TRANSLATION_MS = 250;
const PERSIST_DEADZONE_PX = 4;
const ROTATION_DEADZONE_PX = 20;
const ROTATION_DEG = 1.5;

/** Minimum hold time (ms) before a pointerdown initiates drag.
 *  If the user releases before this, neodrag never sees the event (clean click). */
const DRAG_DELAY_MS = 150;

function Draggable({ children, dragId, initialPosition, onDragEnd, handle }) {
  const draggableRef = useRef(null);
  const initialSavedPosition = initialPosition || { x: 0, y: 0 };
  const dragStartRef = useRef(initialSavedPosition);
  const hasMovedRef = useRef(false);
  const [isRotating, setIsRotating] = useState(false);

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

  // Gate neodrag's pointerdown: intercept in capture phase, hold for
  // DRAG_DELAY_MS, then re-dispatch. If pointerup fires first, swallow
  // the event entirely — neodrag never sees it (clean click).
  useEffect(() => {
    const el = draggableRef.current;
    if (!el) return;

    let delayTimer = null;
    let pendingEvent = null;

    function onPointerDownCapture(e) {
      // Only gate events on the handle (or the whole element if no handle)
      if (handle) {
        const handleEl = el.querySelector(handle);
        if (!handleEl || !handleEl.contains(e.target)) return;
      }
      e.stopPropagation();
      pendingEvent = e;
      delayTimer = setTimeout(() => {
        if (!pendingEvent) return;
        // Re-dispatch — neodrag picks it up in bubble phase
        const synth = new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          pointerId: pendingEvent.pointerId,
          clientX: pendingEvent.clientX,
          clientY: pendingEvent.clientY,
          button: pendingEvent.button,
          pointerType: pendingEvent.pointerType,
        });
        pendingEvent = null;
        e.target.dispatchEvent(synth);
      }, DRAG_DELAY_MS);
    }

    function onPointerUpCapture() {
      // Released before delay — cancel, neodrag never sees it
      if (pendingEvent) {
        clearTimeout(delayTimer);
        pendingEvent = null;
      }
    }

    el.addEventListener('pointerdown', onPointerDownCapture, true);
    el.addEventListener('pointerup', onPointerUpCapture, true);
    return () => {
      el.removeEventListener('pointerdown', onPointerDownCapture, true);
      el.removeEventListener('pointerup', onPointerUpCapture, true);
      clearTimeout(delayTimer);
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
