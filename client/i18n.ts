import { useSyncExternalStore } from 'react'
import en from '../locale/en.json'
import zh from '../locale/zh.json'

export type UiKey = keyof typeof en.ui
type Translate = (key: string, params?: Record<string, unknown>) => string
export interface LocaleHost {
  register(namespace: string, dictionaries: { en: Record<string, string>; zh: Record<string, string> }): () => void
  bind(namespace: string): Translate
  getSnapshot(): { active: string; revision: number }
  subscribe(listener: () => void): () => void
}
let host: LocaleHost | undefined
let translate: Translate | undefined
export function installLocale(locale: LocaleHost): () => void {
  host = locale
  const dispose = locale.register('wisp-ops', { en: en.ui, zh: zh.ui })
  translate = locale.bind('wisp-ops')
  return () => { dispose(); if (host === locale) { host = undefined; translate = undefined } }
}
export function tr(key: UiKey, params?: Record<string, unknown>): string {
  if (translate) return translate(key, params)
  return en.ui[key].replace(/\{(\w+)\}/g, (match, name: string) => params && name in params ? String(params[name]) : match)
}
export function useLocale(): void {
  useSyncExternalStore(listener => host?.subscribe(listener) ?? (() => {}), () => host?.getSnapshot().revision ?? 0)
}
