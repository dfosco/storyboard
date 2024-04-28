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
        <>
            <NodeResizer minWidth={100} minHeight={30} />
            <Handle type="target" position={Position.Top} />
            <LiveProvider code={data.markup ? data.markup : initialCode} scope={scope}>
                <div className="grid grid-cols-2 gap-4">
                    <LiveEditor className="font-mono" />
                    <LivePreview style={{ backgroundColor: "light gray" }} />
                </div>
            </LiveProvider>
            <Handle type="source" position={Position.Bottom} id="a" />
            <Handle
                type="source"
                autoFocus={true}
                position={Position.Bottom}
                id="b"
                style={handleStyle}
            />
        </>
    );
}
