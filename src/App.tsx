import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AIAgentProvider } from './contexts/AIAgentContext';
import { UserProvider, useUser } from './contexts/UserContext';

// Pages
import ParentHomePage from './pages/ParentHomePage';
import PlaygroundPage from './pages/PlaygroundPage';
import DashboardPage from './pages/DashboardPage';
import ForumPage from './pages/ForumPage';
import ForumRegistrationPage from './pages/ForumRegistrationPage';
import RegistrationPage from './pages/RegistrationPage';
import SignInPage from './pages/SignInPage';
import AIReportPage from './pages/AIReportPage';
import AboutUsPage from './pages/AboutUsPage';
import CountingTestPage from './pages/CountingTestPage';
import TestPage from './pages/TestPage';
import ProfilePage from './pages/ProfilePage';
import EnhancedTextRevealExample from './components/EnhancedTextRevealExample';

// Components
import Header from './components/Header';
import AIAssistant from './components/AIAssistant';
import ScrollToTop from './components/ScrollToTop';

function App() {
  const { user } = useUser();
  const location = useLocation();

  return (
    <ThemeProvider>
      <AIAgentProvider>
        {/* Scroll to top on route change */}
        <ScrollToTop />
        
        {/* Navigation Header */}
        <Header />

        <main id="main-content">
          <Routes>
            <Route path="/" element={<ParentHomePage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/forum-registration" element={<ForumRegistrationPage />} />
            <Route path="/registration" element={<RegistrationPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/ai-report" element={<AIReportPage />} />
            <Route path="/about" element={<AboutUsPage />} />
            <Route path="/counting-test" element={<CountingTestPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/text-reveal" element={<EnhancedTextRevealExample />} />
            <Route path="/profile" element={<ProfilePage />} />
            {/* ... etc */}
          </Routes>
        </main>

        {/* The AI Assistant is a global component, visible to anyone who is signed in */}
        {user && <AIAssistant />}
      </AIAgentProvider>
    </ThemeProvider>
  );
}

export default App;