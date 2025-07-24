import { useRef, useEffect, useState } from 'react'; // Make sure useRef is imported
import classNames from '@/utils/classNames'
import ScrollBar from '@/components/ui/ScrollBar'
import Logo from '@/components/template/Logo'
import VerticalMenuContent from '@/components/template/VerticalMenuContent'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import { useRouteKeyStore } from '@/store/routeKeyStore'
import navigationConfig from '@/configs/navigation.config'
import appConfig from '@/configs/app.config'
import { Link } from 'react-router-dom'
import {
    SIDE_NAV_WIDTH,
    SIDE_NAV_COLLAPSED_WIDTH,
    SIDE_NAV_CONTENT_GUTTER,
    HEADER_HEIGHT,
    LOGO_X_GUTTER,
} from '@/constants/theme.constant'
import type { Mode } from '@/@types/theme'
import LogoWithoutName from './LogoWithoutName'
import { ConfirmDialog } from '../shared'
import { useAppDispatch } from '@/reduxtool/store'
import { logoutAction } from '@/reduxtool/auth/middleware'
import { resetMasterState } from '@/reduxtool/master/masterSlice'

type SideNavProps = {
    translationSetup?: boolean
    background?: boolean
    className?: string
    contentClass?: string
    mode?: Mode
}

const sideNavStyle = { width: SIDE_NAV_WIDTH, minWidth: SIDE_NAV_WIDTH };
const sideNavCollapseStyle = { width: SIDE_NAV_COLLAPSED_WIDTH, minWidth: SIDE_NAV_COLLAPSED_WIDTH };

// --- HELPER FUNCTION ---
// Extracts the main module key (e.g., 'app.companies' from 'app.companies.new')
const getModuleKey = (key: string) => {
    if (!key) return ''
    return key.split('.').slice(0, 2).join('.')
}

const SideNav = ({
    translationSetup = appConfig.activeNavTranslation,
    background = true,
    className,
    contentClass,
    mode,
}: SideNavProps) => {
    
    const defaultMode = useThemeStore((state) => state.mode)
    const direction = useThemeStore((state) => state.direction)
    const sideNavCollapse = useThemeStore((state) => state.layout.sideNavCollapse)
    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)
    const userAuthority = useSessionUser((state) => state.user.authority)
    
    const dispatch = useAppDispatch();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

    // --- SOLUTION: Use useRef to track the previous route to avoid unnecessary resets ---
    const previousRouteKeyRef = useRef(currentRouteKey)

    useEffect(() => {
        const previousModule = getModuleKey(previousRouteKeyRef.current)
        const currentModule = getModuleKey(currentRouteKey)

        // Only reset the master state if the main navigation module has changed.
        // This prevents resets when navigating to sub-routes (e.g., edit pages)
        // or on initial page load.
        if (previousModule && currentModule && previousModule !== currentModule) {
            dispatch(resetMasterState())
        }

        // Update the ref to the current key for the next navigation change.
        previousRouteKeyRef.current = currentRouteKey
    }, [currentRouteKey, dispatch])


    const handleSignOutClick = () => {
        setIsLogoutDialogOpen(true);
    };

    const onDialogClose = () => {
        setIsLogoutDialogOpen(false);
    };

    const onDialogConfirm = () => {
        dispatch(logoutAction());
    };

    const backgroundClasses = 'bg-white dark:bg-neutral-900'
    const borderClasses = 'border-r border-gray-200 dark:border-neutral-700'
    const shadowClasses = 'shadow-lg'

    return (
        <div
            style={sideNavCollapse ? sideNavCollapseStyle : sideNavStyle}
            className={classNames(
                'side-nav',
                'flex flex-col pt-2 pb-4',
                background && backgroundClasses,
                background && borderClasses,
                background && shadowClasses,
                !sideNavCollapse && 'side-nav-expand',
                className,
            )}
        >
            <Link
                to={appConfig.authenticatedEntryPath}
                className={classNames('side-nav-header', 'flex-shrink-0', 'flex justify-center items-center gap-2')}
                style={{ height: HEADER_HEIGHT }}
            >
                {sideNavCollapse ? (
                    <LogoWithoutName
                        imgClass="h-12"
                        mode={mode || defaultMode}
                        type="streamline"
                        className={classNames(sideNavCollapse && 'ltr:ml-[11.5px] ltr:mr-[11.5px]')}
                    />
                ) : (
                    <Logo
                        imgClass="w-60 h-16"
                        mode={mode || defaultMode}
                        type="full"
                        className={classNames(!sideNavCollapse && LOGO_X_GUTTER)}
                    />
                )}
            </Link>

            <div className={classNames('side-nav-content', 'flex-grow', 'overflow-hidden', contentClass)}>
                <ScrollBar style={{ height: '100%', marginTop:'16px'}} direction={direction}>
                    <VerticalMenuContent
                        collapsed={sideNavCollapse}
                        navigationTree={navigationConfig}
                        routeKey={currentRouteKey}
                        direction={direction}
                        translationSetup={translationSetup}
                        userAuthority={userAuthority || []}
                    />
                </ScrollBar>
            </div>
            
            <div className="absolute bottom-4 w-full px-4">
                <button
                     onClick={handleSignOutClick}
                     className="w-full py-2 bg-blue-600 hover:bg-blue-800 text-white rounded-md transition">
                    Logout
                </button>
            </div>

            <ConfirmDialog
                isOpen={isLogoutDialogOpen}
                type="danger"
                title="Confirm Logout"
                width={477}
                onClose={onDialogClose}
                onRequestClose={onDialogClose}
                onCancel={onDialogClose}
                onConfirm={onDialogConfirm}
                confirmText="Logout"
            >
                <p>Are you sure you want to log out?</p>
            </ConfirmDialog>
        </div>
    )
}

export default SideNav