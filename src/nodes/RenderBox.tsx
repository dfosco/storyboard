import { useState } from 'react';
import { Sandpack } from "@codesandbox/sandpack-react"
import { dracula } from "@codesandbox/sandpack-themes";

// import textfile from "./text.txt";




export function RenderBox() {
    // const initialCode = "<em>hello</em>";
    // const scope = {Switch}

    const files = {
        '/Text.txt': {
            code: `<em>heeey</em>`,
            hidden: true,
            active: true
        },
        '/App.js': {
            code: 
`
import { useState } from 'react';
import textfile from "/Text.txt";

function Notes() {
    const [text, setText] = useState();
    fetch(textfile)
        .then((response) => response.text())
        .then((textContent) => {
            setText(textContent);
        });
    return <div dangerouslySetInnerHTML={{ __html: text }} />;
}

export default function App() {
    return <>{Notes()}</>
}
`,
            hidden: true,
            active: false
        }
    }

    return (
        <Sandpack template="react" files={files} theme={dracula} />
    );
}
