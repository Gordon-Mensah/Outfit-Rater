// 📚 WHAT IS THIS FILE?
// This is the ENTRY POINT of your entire React app.
// Everything starts here!

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import App from './App.jsx'
import './index.css'

// 🎯 RENDER THE APP
// This code runs ONCE when your app loads in the browser

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* BrowserRouter enables multiple pages (routes) */}
    <BrowserRouter>
      {/* AuthProvider wraps everything so all components can access user data */}
      <AuthProvider>
        {/* Your main App component */}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// 📖 STRUCTURE EXPLANATION:
//
// Think of this like Russian nesting dolls:
// 
// ReactDOM.createRoot
//   └─ React.StrictMode (helps catch bugs)
//       └─ BrowserRouter (enables /login, /signup, / pages)
//           └─ AuthProvider (shares user data)
//               └─ App (your main component)
//                   └─ All your other components
//
// This means:
// - BrowserRouter is available to App and everything inside
// - AuthProvider is available to App and everything inside
// - Every component can use useAuth() because of AuthProvider
// - Every component can use useNavigate() because of BrowserRouter