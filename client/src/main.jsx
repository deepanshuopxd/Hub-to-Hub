import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store } from './store/store'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            className: 'toast-hubdrive',
            success: {
              iconTheme: { primary: '#E8A020', secondary: '#080808' },
            },
            error: {
              iconTheme: { primary: '#C93030', secondary: '#F4F0E8' },
            },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)