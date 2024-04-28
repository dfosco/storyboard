import type { Node, NodeTypes } from "reactflow";
import { PositionLoggerNode } from "./PositionLoggerNode";
import { RenderBox } from "./RenderBox";
import { RenderBoxB } from "./RenderBoxB";
import { RenderBoxC } from "./RenderBoxC";
import { TextUpdaterNode } from "./TextUpdaterNode";

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
    data: { markup: "<em style={{'background': 'blue'}}> aaa hello</em>" },
  },
  {
    id: "f",
    type: "render-box-b",
    position: { x: 0, y: 400 },
    data: { markup: "<em style={{'background': 'blue'}}> aaa hello</em>" },
  },
  {
    id: "g",
    type: "render-box-c",
    position: { x: 0, y: 200 },
    data: { label: "Text Updater" },
  },

] satisfies Node[];

// const nodeTypes = useMemo(() => ({ textUpdater: TextUpdaterNode }), []);

export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  "render-box": RenderBox,
  "render-box-b": RenderBoxB,
  "render-box-c": RenderBoxC,
  "text-updater": TextUpdaterNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
