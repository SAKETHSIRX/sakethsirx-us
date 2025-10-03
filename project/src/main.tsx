import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import App from './App.tsx';
import AuthPage from './components/ui/auth-page.tsx';
import { SubscriptionCheckout } from './components/ui/subscription-checkout.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/checkout" element={<SubscriptionCheckout />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
