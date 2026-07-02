/// <reference types="vite/client" />

// Для модульных SCSS (когда делаешь import styles from './styles.scss')
declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

// Для глобальных (side-effect) SCSS (import './styles/global.scss')
declare module '*.scss';