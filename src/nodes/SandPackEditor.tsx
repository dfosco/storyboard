import { SandpackProvider, SandpackPreview, SandpackLayout, SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { files } from "./files.tsx";

export function SandPackEditor() {

    return (
        <SandpackProvider template="react" files={files}>
        <SandpackLayout>
            <SandpackCodeEditor />
            <SandpackPreview
              showRefreshButton={true}
              showOpenInCodeSandbox={true}
            />
        </SandpackLayout>
        </SandpackProvider>
    );
}
