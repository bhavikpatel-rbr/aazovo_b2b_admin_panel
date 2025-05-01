import { Navigate, Outlet } from 'react-router-dom'
import appConfig from '@/configs/app.config'
import { useAuth } from '@/auth'
import { useSelector } from 'react-redux'
import { authSelector } from '@/reduxtool/auth/authSlice'

const { authenticatedEntryPath } = appConfig

const PublicRoute = () => {
    const userData = useSelector(authSelector)
    const authenticated = Boolean(userData.token)

    return authenticated ? <Navigate to={authenticatedEntryPath} /> : <Outlet />
}

export default PublicRoute
