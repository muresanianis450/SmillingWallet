/// <reference types="vite/client" />

/**
 * CSS Modules. Without this every `import styles from './X.module.css'`
 * needs a `// @ts-ignore`, which then hides real errors on the same line.
 */
declare module '*.module.css' {
    const classes: Record<string, string>;
    export default classes;
}
