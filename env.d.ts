interface ImportMetaEnv {
  readonly VITE_ENABLE_MODAL_IMAGE_BETA?: string;
  readonly GEMINI_API_KEY?: string;
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
