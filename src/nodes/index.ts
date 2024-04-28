import type { Node, NodeTypes } from "reactflow";
import { PositionLoggerNode } from "./PositionLoggerNode";
import { RenderBox } from "./RenderBox";

export const initialNodes = [
  { id: "a", 
    type: "input", 
    position: { x: 200, y: 0 }, 
    data: { label: "wire" } 
  },
  {
    id: "b",
    type: "position-logger",
    position: { x: -100, y: 100 },
    data: { label: "drag me!" },
  },
  { id: "c", position: { x: 100, y: 100 }, data: { label: "your ideas" } },
  {
    id: "d",
    type: "output",
    position: { x: 0, y: 200 },
    data: { label: "with React Flow" },
  },  
  {
    id: "e",
    type: "render-box",
    position: { x: 0, y: 400 },
    focusable: true,
    selectable: true,
    deletable: true,
    data: { markup: "<em style={{'background': 'blue'}}> aaa hello</em>" },
  },

] satisfies Node[];


// const nodeTypes = useMemo(() => ({ textUpdater: TextUpdaterNode }), []);


export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  "render-box": RenderBox,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
