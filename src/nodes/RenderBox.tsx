// import { useCallback } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
import { LiveProvider, LiveEditor, LivePreview } from "react-live";
// import { NodeProps } from 'reactflow';
// import { useState } from 'react';

import * as Switch from '@radix-ui/react-switch';
import './switch.css';

const handleStyle = { left: 10 };

export function RenderBox({data}:any) {
    const initialCode = "<em>hello</em>";
    const scope = {Switch}
    return (
        <div className='bg-red-800 focus-visible:ring '>
            <NodeResizer minWidth={100} minHeight={30} />
            <Handle type="target" position={Position.Top} />
            <input className="nodrag" placeholder="Tab to Edit" />
            <LiveProvider code={data.markup ? data.markup : initialCode} scope={scope}>
                <div className="flex flex-col">
                    <LiveEditor className="font-mono" />
                    <LivePreview className="bg-slate-100" />
                </div>
            </LiveProvider>
            <Handle type="source" position={Position.Bottom} id="a" />
            <Handle
                type="source"
                position={Position.Bottom}
                id="b"
                style={handleStyle}
            />
        </div>
    );
}
