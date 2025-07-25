import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useUser } from './contexts/UserContext';

// Import your page components
import HomePage from './pages/HomePage';
import PlaygroundPage from './pages/PlaygroundPage';
import ForumPage from './pages/ForumPage';
import RegistrationPage from './pages/RegistrationPage';
// ... other page imports

// Import the AI Assistant
import AIAssistant from './components/AIAssistant';

function App() {
  const { user } = useUser();

  return (
    <>
      <div id="app-background"></div>
      
      {/* Your Navbar would be rendered here */}

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/playground" element={<PlaygroundPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/registration" element={<RegistrationPage />} />
          {/* ... etc */}
        </Routes>
      </main>

      {/* The AI Assistant is a global component, visible to anyone who is signed in */}
      {user && <AIAssistant />}
    </>
  );
}

export default App;