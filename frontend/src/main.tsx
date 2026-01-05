import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'

console.log('main.tsx loaded')

const App = React.lazy(() => {
  console.log('Loading App...')
  return import('./App.tsx').catch(err => {
    console.error('Failed to load App:', err)
    throw err
  })
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <React.Suspense fallback={<div style={{ padding: '20px' }}>Loading app...</div>}>
      <App />
    </React.Suspense>
  </React.StrictMode>,
)
