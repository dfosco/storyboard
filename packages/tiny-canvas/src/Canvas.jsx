import { Children } from 'react';
import Draggable from './Draggable';
import { findDragId, generateDragId } from './utils';

function Canvas({
  children,
  dotted = false,
  grid = false,
  gridSize,
  colorMode = 'auto',
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
        return (
          <Draggable key={index} gridSize={gridSize} dragId={dragId}>
            {child}
          </Draggable>
        );
      })}
    </main>
  );
}

export default Canvas;
