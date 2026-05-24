type LenitTraitValue = string | number | boolean;
type LenitTraits = Record<string, LenitTraitValue>;

interface LenitConfig {
    boardKey: string;
    userId: string;
    traits?: LenitTraits;
}

interface Window {
    Lenit?: LenitConfig[];
}

interface ImportMetaEnv {
    readonly VITE_LENIT_BOARD_KEY?: string;
}
