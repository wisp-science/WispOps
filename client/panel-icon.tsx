export function PanelIcon({ kind }: { kind: 'refresh' | 'download' | 'upload' | 'check' | 'clock' | 'alert' | 'external' | 'info' | 'cloud' | 'lock' }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'refresh' && <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 6.1A8 8 0 0 1 20 12M4 12a8 8 0 0 0 13.9 5.9"/></>}
    {kind === 'download' && <path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>}
    {kind === 'upload' && <path d="M12 15V3m-5 5 5-5 5 5M5 16v4h14v-4"/>}
    {kind === 'check' && <path d="m5 12 4 4L19 6"/>}
    {kind === 'clock' && <><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></>}
    {kind === 'alert' && <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v4m0 4h.01"/></>}
    {kind === 'external' && <path d="M14 4h6v6m0-6L10 14M10 4H4v16h16v-6"/>}
    {kind === 'info' && <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/></>}
    {kind === 'cloud' && <path d="M7 19a5 5 0 1 1 0-10 6 6 0 0 1 11.7-1.8A6 6 0 0 1 18 19H7Z"/>}
    {kind === 'lock' && <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>}
  </svg>
}
