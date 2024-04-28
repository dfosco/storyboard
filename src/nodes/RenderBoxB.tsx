import { useSandpack, SandpackProvider, SandpackPreview, SandpackLayout, SandpackCodeEditor, useActiveCode } from "@codesandbox/sandpack-react";
import { files } from "./files.tsx";

export function RenderBoxB({data}:any) {
    
 
const SimpleCodeViewer = () => {
  const { sandpack } = useSandpack();
  const { files, activeFile } = sandpack;
 
  const code = `// ${files[activeFile].code}`;
  return <pre>{code}</pre>;
};


const CustomEditor = () => {
    const { code, updateCode } = useActiveCode()
        
    return (
      <textarea
        onChange={e => updateCode(e.target.value)}
        value={code}
        spellCheck="false"
      />
    )
  }


    return (
        <SandpackProvider template="react" files={files}>
        <SandpackLayout>
            <CustomEditor />
            {/* This will render the pre on the right side of your sandpack component */}
            {/* <SimpleCodeViewer /> */}
            <div className="preview">
          <SandpackPreview
            files={files["/App.js"]}
        
            showRefreshButton={false}
            showOpenInCodeSandbox={false}
          />
        </div>
        </SandpackLayout>
        </SandpackProvider>
    );
}
