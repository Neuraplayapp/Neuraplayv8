import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { PostProvider } from './contexts/PostContext';
import { ConversationProvider } from './contexts/ConversationContext';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <PostProvider>
        <ConversationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ConversationProvider>
      </PostProvider>
    </UserProvider>
  </React.StrictMode>
);