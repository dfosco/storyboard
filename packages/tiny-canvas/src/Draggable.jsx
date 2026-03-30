import { useRef, useEffect, useState } from 'react';
import { useDraggable } from '@neodrag/react';
import { refreshStorage, getQueue, saveDrag } from './utils';

const TRANSLATION_MS = 250;

function Draggable({ children, dragId }) {
  const draggableRef = useRef(null);
  const queueRef = useRef(getQueue(dragId));

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotationVariation, setRotationVariation] = useState(
    () => Math.random() < 0.5 ? -0.5 : 0.5
  );

  // Animate elements with saved positions on mount
  useEffect(() => {
    const el = draggableRef.current;
    const queue = queueRef.current;
    if (el && dragId && queue && (queue.x !== 0 || queue.y !== 0)) {
      el.classList.add('tc-on-translation');

      const timer = setTimeout(() => {
        el.classList.remove('tc-on-translation');
      }, TRANSLATION_MS * 4);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [dragId]);

  // Restore saved positions from localStorage
  useEffect(() => {
    refreshStorage();
    const queue = queueRef.current;
    if (draggableRef.current && queue) {
      setPosition({ x: queue.x, y: queue.y });
    }
  }, []);

  // Free-drag during drag, snap to grid on drop
  const { isDragging } = useDraggable(draggableRef, {
    axis: 'both',
    threshold: { delay: 50, distance: 30 },
    defaultClass: 'tc-drag',
    defaultClassDragging: 'tc-on',
    defaultClassDragged: 'tc-off',
    applyUserSelectHack: true,
    position: { x: position.x, y: position.y },
    onDrag: ({ offsetX, offsetY }) => setPosition({ x: offsetX, y: offsetY }),
    onDragEnd: (data) => {
      setPosition({ x: data.offsetX, y: data.offsetY });
      setRotationVariation(Math.random() < 0.5 ? -0.5 : 0.5);
      if (dragId !== null) {
        saveDrag(dragId, data.offsetX, data.offsetY);
      }
    },
  });

  const rotation = isDragging ? `${rotationVariation}deg` : '0deg';

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
