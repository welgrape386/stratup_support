import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { Home } from './pages/Home'
import { SupportMatch } from './pages/SupportMatch'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'support-match', element: <SupportMatch /> },
    ],
  },
])
