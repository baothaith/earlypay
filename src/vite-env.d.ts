/// <reference types="vite/client" />

// Allow importing markdown files as raw strings via ?raw query
declare module '*.md?raw' {
  const content: string
  export default content
}
