import appConfig from '@/configs/app.config'
import { REDIRECT_URL_KEY } from '@/constants/app.constant'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth'
import { useSelector } from 'react-redux'
import { authSelector } from '@/reduxtool/auth/authSlice'

const { unAuthenticatedEntryPath } = appConfig

const ProtectedRoute = () => {
    const userData = useSelector(authSelector)
    const authenticated = Boolean(userData.token)
    const { pathname } = useLocation()

    const getPathName =
        pathname === '/' ? '' : `?${REDIRECT_URL_KEY}=${location.pathname}`

    if (!authenticated) {
        return (
            <Navigate
                replace
                to={`${unAuthenticatedEntryPath}${getPathName}`}
            />
        )
    }

    return <Outlet />
}

export default ProtectedRoute
