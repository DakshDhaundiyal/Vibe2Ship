import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'motion/react'
import HomePage from './pages/HomePage'
import MapPage from './pages/MapPage'
import ReportPage from './pages/ReportPage'
import ActivityPage from './pages/ActivityPage'
import ProfilePage from './pages/ProfilePage'
import GovDashboardPage from './pages/GovDashboardPage'
import RealtimeFeed from './components/RealtimeFeed'
import WelcomeScreen from './components/WelcomeScreen'
import { FloatingDock } from './components/ui/floating-dock'
import { PageSpotlight } from './components/MagicCard'
import {
  IconHome,
  IconMap,
  IconPlus,
  IconChartBar,
  IconBuilding,
  IconUser,
} from '@tabler/icons-react'

function BottomNav() {
  const navigate = useNavigate();

  const items = [
    {
      title: 'Home',
      icon: <IconHome className="h-full w-full text-neutral-300" />,
      onClick: () => navigate('/'),
    },
    {
      title: 'Map',
      icon: <IconMap className="h-full w-full text-neutral-300" />,
      onClick: () => navigate('/map'),
    },
    {
      title: 'Report',
      icon: <IconPlus className="h-full w-full text-neutral-300" />,
      onClick: () => navigate('/report'),
    },
    {
      title: 'Activity',
      icon: <IconChartBar className="h-full w-full text-neutral-300" />,
      onClick: () => navigate('/activity'),
    },
    {
      title: 'Gov',
      icon: <IconBuilding className="h-full w-full text-neutral-300" />,
      onClick: () => navigate('/gov'),
    },
    {
      title: 'Profile',
      icon: <IconUser className="h-full w-full text-neutral-300" />,
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    /* Fixed bottom center — safe area aware */
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto">
        <FloatingDock
          items={items}
          desktopClassName="shadow-xl shadow-black/50"
          mobileClassName="mr-4 mb-2"
        />
      </div>
    </div>
  );
}

function App() {
  const [showWelcome, setShowWelcome] = useState(true)

  return (
    <>
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[2000] pointer-events-auto"
          >
            <WelcomeScreen onComplete={() => setShowWelcome(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <BrowserRouter>
        <main className="pb-28 min-h-screen" style={{ backgroundColor: '#000' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/gov" element={<GovDashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </main>
        <BottomNav />
        <PageSpotlight glowColor="100, 0, 200" spotlightRadius={180} />
        <RealtimeFeed />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#111',
              color: '#e2e8f0',
              border: '1px solid #222',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#34d399', secondary: '#111' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#111' } },
          }}
        />
      </BrowserRouter>
    </>
  )
}

export default App
