import { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import { saveDrag } from './utils';

const TRANSLATION_MS = 250;
const PERSIST_DEADZONE_PX = 4;
const ROTATION_DEADZONE_PX = 10;
const ROTATION_DEG = 1.5;

function Draggable({ children, dragId, initialPosition, onDragEnd }) {
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
  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    threshold: { delay: 50, distance: 30 },
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
      setPosition({ x: offsetX, y: offsetY });
    },
    onDragEnd: (data) => {
      setPosition({ x: data.offsetX, y: data.offsetY });
      setRotationVariation(Math.random() < 0.5 ? -ROTATION_DEG : ROTATION_DEG);
      setIsRotating(false);
      const dx = data.offsetX - dragStartRef.current.x;
      const dy = data.offsetY - dragStartRef.current.y;
      const movedEnough = hasMovedRef.current || Math.hypot(dx, dy) >= PERSIST_DEADZONE_PX;
      if (!movedEnough) return

      if (dragId) {
        saveDrag(dragId, data.offsetX, data.offsetY);
      }
      onDragEnd?.(dragId, { x: data.offsetX, y: data.offsetY });
    },
  });

  const rotation = isDragging && isRotating ? `${rotationVariation}deg` : '0deg';

  return (
    <article
      ref={draggableRef}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
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
