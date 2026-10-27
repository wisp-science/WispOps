import { readFileSync, readdirSync } from 'node:fs'
import { expect, it } from 'vitest'
import ts from 'typescript'
import en from '../locale/en.json'
import zh from '../locale/zh.json'
import { installLocale, tr } from '../client/i18n'

it('pairs every UI key and interpolation placeholder across English and Chinese', () => {
  expect(Object.keys(en.ui).sort()).toEqual(Object.keys(zh.ui).sort())
  const placeholders = (s: string) => [...s.matchAll(/\{\w+\}/g)].map(m => m[0]).sort()
  for (const key of Object.keys(en.ui) as (keyof typeof en.ui)[]) expect(placeholders(en.ui[key]), key).toEqual(placeholders(zh.ui[key]))
})
it('binds the DSH locale service and reads language changes at translation time', () => {
  let language: 'en' | 'zh' = 'en'
  let dictionaries: { en: Record<string, string>; zh: Record<string, string> }
  const dispose = installLocale({ register: (_ns, values) => { dictionaries = values; return () => {} }, bind: () => key => dictionaries[language][key]!, getSnapshot: () => ({ active: language, revision: 0 }), subscribe: () => () => {} })
  expect(tr('server.operations')).toBe('Server operations')
  language = 'zh'
  expect(tr('server.operations')).toBe('服务器运维')
  dispose()
})
it('keeps authored Chinese copy out of client components', () => {
  for (const file of readdirSync('client').filter(f => f.endsWith('.tsx'))) {
    const source = ts.createSourceFile(file, readFileSync(`client/${file}`, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    function visit(node: ts.Node) {
      if (ts.isStringLiteral(node) || ts.isJsxText(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) expect(node.text, `${file}: ${node.getText(source)}`).not.toMatch(/[\u3400-\u9fff]/)
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
})
