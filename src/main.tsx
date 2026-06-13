import { render } from 'preact'
import App from './App'
import './index.css'

// Request durable storage to prevent iOS Safari from silently evicting IndexedDB data.
if (navigator.storage?.persist) {
  navigator.storage.persist()
}

render(<App />, document.getElementById('app')!)
