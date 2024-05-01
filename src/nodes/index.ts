import type { Node, NodeTypes } from "reactflow";
import { PositionLoggerNode } from "./PositionLoggerNode";
import { SandPackSync } from "./SandPackSync";
import { SandPackEditor } from "./SandPackEditor";
import { ReactLiveEditor } from "./ReactLiveEditor";
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
    type: "sandpack-sync",
    position: { x: 0, y: 400 },
    data: { markup: "<em style={{'background': 'blue'}}> aaa hello</em>" },
  },
  {
    id: "f",
    type: "sandpack-editor",
    position: { x: 0, y: 400 },
    data: { markup: "<em style={{'background': 'blue'}}> aaa hello</em>" },
  },
  {
    id: "g",
    type: "react-live-editor",
    position: { x: 0, y: 200 },
    data: { label: "Text Updater" },
  },

] satisfies Node[];

// const nodeTypes = useMemo(() => ({ textUpdater: TextUpdaterNode }), []);

export const nodeTypes = {
  "position-logger": PositionLoggerNode,
  "sandpack-sync": SandPackSync,
  "sandpack-editor": SandPackEditor,
  "react-live-editor": ReactLiveEditor,
  "text-updater": TextUpdaterNode,
  // Add any of your custom nodes here!
} satisfies NodeTypes;
