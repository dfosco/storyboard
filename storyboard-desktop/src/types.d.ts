declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "ghostty-web" {
  export interface ITerminalOptions {
    cols?: number;
    rows?: number;
    cursorBlink?: boolean;
    fontSize?: number;
    fontFamily?: string;
    scrollback?: number;
    disableStdin?: boolean;
    theme?: {
      background?: string;
      foreground?: string;
      cursor?: string;
      selectionBackground?: string;
      black?: string;
      red?: string;
      green?: string;
      yellow?: string;
      blue?: string;
      magenta?: string;
      cyan?: string;
      white?: string;
      brightBlack?: string;
      brightRed?: string;
      brightGreen?: string;
      brightYellow?: string;
      brightBlue?: string;
      brightMagenta?: string;
      brightCyan?: string;
      brightWhite?: string;
    };
  }

  export interface ITerminalAddon {
    activate(terminal: Terminal): void;
    dispose(): void;
  }

  export class Terminal {
    readonly cols: number;
    readonly rows: number;

    constructor(options?: ITerminalOptions);

    open(parent: HTMLElement): void;
    write(data: string | Uint8Array): void;
    writeln(data: string): void;
    resize(cols: number, rows: number): void;
    dispose(): void;
    focus(): void;
    blur(): void;
    reset(): void;
    clear(): void;

    onData(callback: (data: string) => void): { dispose: () => void };
    onResize(callback: (size: { cols: number; rows: number }) => void): { dispose: () => void };
    onBell(callback: () => void): { dispose: () => void };
    onTitleChange(callback: (title: string) => void): { dispose: () => void };

    getSelection(): string;
    selectAll(): void;
    clearSelection(): void;

    loadAddon(addon: ITerminalAddon): void;
  }
}
