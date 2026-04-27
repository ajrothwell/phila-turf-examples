import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light'],
      langs: ['ts', 'vue', 'json'],
    })
  }
  return highlighterPromise
}

export async function highlight(code: string, lang: 'ts' | 'vue' | 'json' = 'ts'): Promise<string> {
  const h = await getHighlighter()
  return h.codeToHtml(code, { lang, theme: 'github-light' })
}
