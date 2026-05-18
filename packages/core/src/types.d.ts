export type EnhancedCopyMode = "button" | "shortcut" | "override-copy" | "all";
export type EnhancedCopyAction = "explain" | "debug" | "summarize" | "ask" | "share" | "custom";
export type EnhancedCopyConfig = {
    mode: EnhancedCopyMode;
    action: EnhancedCopyAction;
    customTemplate?: string;
    includeSourceUrl?: boolean;
    includeTitle?: boolean;
    includeSelection?: boolean;
    buttonLabel?: string;
};
export type EnhancedCopyInput = {
    title?: string;
    url?: string;
    selection?: string;
    action?: EnhancedCopyAction;
    customTemplate?: string;
    includeSourceUrl?: boolean;
    includeTitle?: boolean;
    includeSelection?: boolean;
};
export type EnhancedCopyController = {
    destroy: () => void;
    copyFromElement: (element: Element, action?: EnhancedCopyAction) => Promise<string>;
};
