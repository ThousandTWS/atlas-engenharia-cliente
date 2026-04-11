declare module 'react-ace' {
  import type { ComponentType } from 'react';
  const AceEditor: ComponentType<any>;
  export default AceEditor;
}

declare module 'ace-builds/src-noconflict/mode-html';
declare module 'ace-builds/src-noconflict/theme-github';
declare module 'ace-builds/src-noconflict/ext-language_tools';
declare module 'ace-builds/src-noconflict/ext-searchbox';
