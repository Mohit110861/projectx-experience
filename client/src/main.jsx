import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { SiteProvider } from './context/SiteContext'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <SiteProvider>
            <AuthProvider>
                <App />
            </AuthProvider>
        </SiteProvider>
    </React.StrictMode>,
)
