import React from 'react';
import { useAuth } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import LandingView from './views/LandingView';
import AdminDashboard from './views/AdminDashboard';
import UserDashboard from './views/UserDashboard';
import AlertBanner from './components/common/AlertBanner';

export default function App() {
  const { loggedInUser } = useAuth();

  if (!loggedInUser) {
    return (
      <>
        <AlertBanner />
        <LandingView />
      </>
    );
  }

  return (
    <>
      <AlertBanner />
      {loggedInUser.isAdmin ? (
        <AdminDashboard />
      ) : (
        <ChatProvider>
          <UserDashboard />
        </ChatProvider>
      )}
    </>
  );
}
