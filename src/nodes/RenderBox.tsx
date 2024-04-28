// import { useCallback } from 'react';
import { Sandpack } from "@codesandbox/sandpack-react"
import { dracula } from "@codesandbox/sandpack-themes";

// import * as Switch from '@radix-ui/react-switch';
import './switch.css';

const handleStyle = { left: 10 };

export function RenderBox({data}:any) {
    // const initialCode = "<em>hello</em>";
    // const scope = {Switch}

    const files = {
        '/App.js': {
            code: 
`export default function App() {
    return <h1>Hello world</h1>
}`,
            active: false,
            hidden: false
          },
        '/Button.js': {
          code: `export default () => <button />`,
          active: true, 
          hidden: false
        }
    }

    return (
        <Sandpack template="react" files={files} theme={dracula} />
    );
}
