import { createBrowserRouter, Navigate } from 'react-router'
import Join from '../pages/Join.jsx'
import Chat from '../pages/Chat.jsx'

export const routes = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/join" replace />
    },
    {
        path: '/join',
        element: <Join />
    },
    {
        path: '/chat',
        element: <Chat />
    }
])