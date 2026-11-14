import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './fonts.css'
import { resetSavedDataOnce } from './game/storage.js'

resetSavedDataOnce()

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
