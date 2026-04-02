import { Children } from 'react';
import Draggable from './Draggable';
import { findDragId, generateDragId } from './utils';

function readInitialPosition(child) {
  const x = Number(child?.props?.['data-tc-x']);
  const y = Number(child?.props?.['data-tc-y']);
  if (Number.isFinite(x) && Number.isFinite(y)) {
    return { x, y };
  }
  return null;
}

function Canvas({
  children,
  dotted = false,
  grid = false,
  gridSize,
  colorMode = 'auto',
  onDragEnd,
}) {
  const showDots = dotted || grid;

  return (
    <main
      className="tc-canvas"
      data-dotted={showDots || undefined}
      data-color-mode={colorMode !== 'auto' ? colorMode : undefined}
    >
      {Children.map(children, (child, index) => {
        const dragId = findDragId(child) ?? generateDragId(child, index);
        const initialPosition = readInitialPosition(child);
        return (
          <Draggable
            key={index}
            gridSize={gridSize}
            dragId={dragId}
            initialPosition={initialPosition}
            onDragEnd={onDragEnd}
          >
            {child}
          </Draggable>
        );
      })}
    </main>
  );
}

export default Canvas;
