import { Children, useEffect } from 'react';
import Draggable from './Draggable';
import { findDragId, generateDragId } from './utils';

function readInitialPosition(child, pad = 0) {
  const x = Number(child?.props?.['data-tc-x']);
  const y = Number(child?.props?.['data-tc-y']);
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return { x: Math.max(pad, x), y: Math.max(pad, y) };
  }
  return null;
}

/** Read an optional CSS selector that restricts drag to a handle element. */
function readHandle(child) {
  return child?.props?.['data-tc-handle'] || null;
}

function Canvas({
  children,
  dotted = false,
  grid = false,
  gridSize,
  snapGrid,
  colorMode = 'auto',
  locked = false,
  boundaryPad,
  onDragStart,
  onDrag,
  onDragEnd,
}) {
  const showDots = dotted || grid;
  const visualGridSize = gridSize;
  const pad = boundaryPad ?? gridSize ?? 0;
  const dotRadius = visualGridSize && visualGridSize < 16 ? 1 : 2;
  const canvasStyle = visualGridSize
    ? {
        '--tc-grid-size': `${visualGridSize}px`,
        '--tc-grid-offset': `${visualGridSize / -2}px`,
        '--tc-dot-radius': `${dotRadius}px`,
      }
    : undefined;

  // Mirror dot-grid vars and attribute to <html> so the background
  // extends beyond the 10000×10000 <main> boundary.
  useEffect(() => {
    const el = document.documentElement
    if (showDots && canvasStyle) {
      for (const [k, v] of Object.entries(canvasStyle)) el.style.setProperty(k, v)
      el.setAttribute('data-tc-dotted', '')
    }
    return () => {
      if (canvasStyle) {
        for (const k of Object.keys(canvasStyle)) el.style.removeProperty(k)
      }
      el.removeAttribute('data-tc-dotted')
    }
  }, [showDots, visualGridSize, dotRadius])

  return (
    <main
      className="tc-canvas"
      data-dotted={showDots || undefined}
      data-locked={locked || undefined}
      data-color-mode={colorMode !== 'auto' ? colorMode : undefined}
      style={canvasStyle}
    >
      {Children.map(children, (child, index) => {
        const dragId = findDragId(child) ?? generateDragId(child, index);
        const initialPosition = readInitialPosition(child, pad);
        const handle = readHandle(child);
        return (
          <Draggable
            key={dragId}
            gridSize={gridSize}
            snapGrid={snapGrid}
            dragId={dragId}
            initialPosition={initialPosition}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            handle={handle}
            locked={locked}
            boundaryPad={pad}
          >
            {child}
          </Draggable>
        );
      })}
    </main>
  );
}

export default Canvas;
