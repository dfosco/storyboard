// import { useCallback } from 'react';
import { LiveProvider, LiveEditor, LivePreview } from "react-live";
// import { NodeProps } from 'reactflow';
// import { useState } from 'react';

import * as Switch from '@radix-ui/react-switch';
import './switch.css';

const handleStyle = { left: 10 };

export function ReactLiveEditor({data}:any) {
    const initialCode = "<em>hello</em>";
    const scope = {Switch}
    return (
        <div className='bg-red-800 focus-visible:ring '>
            <input className="nodrag" placeholder="Tab to Edit" />
            <LiveProvider code={data.markup ? data.markup : initialCode} scope={scope}>
                <div className="flex flex-col">
                    <LiveEditor className="font-mono" />
                    <LivePreview className="bg-slate-100" />
                </div>
            </LiveProvider>
        </div>
    );
}
