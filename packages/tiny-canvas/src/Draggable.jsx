import { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import { saveDrag } from './utils';

const TRANSLATION_MS = 250;
const PERSIST_DEADZONE_PX = 4;
const ROTATION_DEADZONE_PX = 10;
const ROTATION_DEG = 1.5;

/** Minimum hold time (ms) before a pointerdown initiates drag.
 *  Prevents single-click and double-click from triggering drag state. */
const DRAG_DELAY_MS = 100;

/** Minimum distance (px) the pointer must move before drag starts. */
const DRAG_DISTANCE_PX = 30;

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

  // Free-drag during drag, snap to grid on drop
  const dragOptions = {
    axis: 'both',
    bounds: 'parent',
    threshold: { delay: DRAG_DELAY_MS, distance: DRAG_DISTANCE_PX },
    defaultClass: 'tc-drag',
    defaultClassDragging: 'tc-on',
    defaultClassDragged: 'tc-off',
    applyUserSelectHack: true,
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
      if (!hasMovedRef.current && Math.hypot(dx, dy) >= PERSIST_DEADZONE_PX) {
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
      if (!movedEnough) return

      if (dragId) {
        saveDrag(dragId, clampedX, clampedY);
      }
      onDragEnd?.(dragId, { x: clampedX, y: clampedY });
    },
  };

  // When a handle is specified, only that element initiates drag
  if (handle) {
    dragOptions.handle = handle;
  }

  const { isDragging } = useDraggable(draggableRef, dragOptions);

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
