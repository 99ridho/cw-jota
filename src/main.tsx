import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import '@fontsource/pt-sans/latin-400.css'
import '@fontsource/pt-sans/latin-700.css'
import '@fontsource/pt-mono/latin-400.css'
import './index.css'
import { ANALYTICS_URL } from './config'
import { router } from './routes'
import { usePersisted } from './store/session'

const syncLang = (lang: string) => document.documentElement.setAttribute('lang', lang)
syncLang(usePersisted.getState().lang)
usePersisted.subscribe((s) => syncLang(s.lang))

// Optional no-cookie page counter, off unless VITE_ANALYTICS_URL is set.
if (ANALYTICS_URL) {
  const s = document.createElement('script')
  s.async = true
  s.src = '//gc.zgo.at/count.js'
  s.dataset.goatcounter = ANALYTICS_URL
  document.head.appendChild(s)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
