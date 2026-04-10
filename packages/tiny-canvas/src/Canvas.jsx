import { Children } from 'react';
import Draggable from './Draggable';
import { findDragId, generateDragId } from './utils';

function readInitialPosition(child) {
  const x = Number(child?.props?.['data-tc-x']);
  const y = Number(child?.props?.['data-tc-y']);
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return { x: Math.max(0, x), y: Math.max(0, y) };
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
  onDragEnd,
}) {
  const showDots = dotted || grid;
  const visualGridSize = gridSize;
  const dotRadius = visualGridSize && visualGridSize < 16 ? 1 : 2;
  const canvasStyle = visualGridSize
    ? {
        '--tc-grid-size': `${visualGridSize}px`,
        '--tc-grid-offset': `${visualGridSize / -2}px`,
        '--tc-dot-radius': `${dotRadius}px`,
      }
    : undefined;

  return (
    <main
      className="tc-canvas"
      data-dotted={showDots || undefined}
      data-color-mode={colorMode !== 'auto' ? colorMode : undefined}
      style={canvasStyle}
    >
      {Children.map(children, (child, index) => {
        const dragId = findDragId(child) ?? generateDragId(child, index);
        const initialPosition = readInitialPosition(child);
        const handle = readHandle(child);
        return (
          <Draggable
            key={index}
            gridSize={gridSize}
            snapGrid={snapGrid}
            dragId={dragId}
            initialPosition={initialPosition}
            onDragEnd={onDragEnd}
            handle={handle}
          >
            {child}
          </Draggable>
        );
      })}
    </main>
  );
}

export default Canvas;
