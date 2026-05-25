import './migrate-roles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import theme from './theme'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <ErrorBoundary title="Application error">
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
