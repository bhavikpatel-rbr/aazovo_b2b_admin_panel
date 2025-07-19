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
import { useEffect, useState } from 'react'
import { ConfirmDialog } from '../shared'
import { useAppDispatch } from '@/reduxtool/store'
import { logoutAction } from '@/reduxtool/auth/middleware'
import { resetMasterState } from '@/reduxtool/master/masterSlice'

type SideNavProps = {
    translationSetup?: boolean
    /** Control whether default background styling is applied */
    background?: boolean
    className?: string
    contentClass?: string
    mode?: Mode
}

const sideNavStyle = {
    width: SIDE_NAV_WIDTH,
    minWidth: SIDE_NAV_WIDTH,
}

const sideNavCollapseStyle = {
    width: SIDE_NAV_COLLAPSED_WIDTH,
    minWidth: SIDE_NAV_COLLAPSED_WIDTH,
}

const SideNav = ({
    translationSetup = appConfig.activeNavTranslation,
    background = true, // Default background styling is enabled
    className,
    contentClass,
    mode,
}: SideNavProps) => {
    
    const defaultMode = useThemeStore((state) => state.mode)
    const direction = useThemeStore((state) => state.direction)
    const sideNavCollapse = useThemeStore(
        (state) => state.layout.sideNavCollapse,
    )

     
const dispatch = useAppDispatch();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)
 const handleSignOutClick = () => {
    setIsLogoutDialogOpen(true);
  };
  useEffect(() => {
        // This effect will run whenever the currentRouteKey changes,
        // which happens when the user navigates to a new page.
        dispatch(resetMasterState())
    }, [currentRouteKey, dispatch])

  const onDialogClose = () => {
    setIsLogoutDialogOpen(false);
  };

  const onDialogConfirm = () => {
    dispatch(logoutAction());
  };
    const userAuthority = useSessionUser((state) => state.user.authority)

    // --- Define background and style classes ---
    // You can customize these Tailwind classes as needed
    const backgroundClasses = 'bg-white dark:bg-neutral-900' // Example: White in light, Neutral-900 in dark
    const borderClasses = 'border-r border-gray-200 dark:border-neutral-700' // Example: Right border
    const shadowClasses = 'shadow-lg' // Example: Add a shadow

    return (
        <div
            style={sideNavCollapse ? sideNavCollapseStyle : sideNavStyle}
            className={classNames(
                'side-nav',
                'flex flex-col pt-2 pb-4', // Ensure flex column layout for header/content
                // Apply background and styles conditionally based on the `background` prop
                background && backgroundClasses,
                background && borderClasses,
                background && shadowClasses,
                // Original classes
                // 'side-nav-bg', // We are replacing this with Tailwind classes if `background` is true
                !sideNavCollapse && 'side-nav-expand',
                className, // Allow overriding via props
            )}
        >
            {/* SideNav Header (Logo Area) */}
            <Link
                to={appConfig.authenticatedEntryPath}
                className={classNames(
                    'side-nav-header',
                    'flex-shrink-0', // Prevent header from shrinking
                    'flex justify-center items-center gap-2', // Row layout, centering, gap
                    // Optional: Add a bottom border ONLY to the header if you want separation
                    // If the main div already has a border-r, you might not need this header border
                    // 'border-b border-gray-200 dark:border-gray-700',
                )}
                style={{ height: HEADER_HEIGHT }}
            >
                {sideNavCollapse ? (
                    <LogoWithoutName
                        imgClass="h-12" // Adjust size as needed
                        mode={mode || defaultMode}
                        type={sideNavCollapse ? 'streamline' : 'full'}
                        className={classNames(
                            sideNavCollapse &&
                                'ltr:ml-[11.5px] ltr:mr-[11.5px]', // Original centering logic
                            sideNavCollapse
                                ? SIDE_NAV_CONTENT_GUTTER
                                : LOGO_X_GUTTER,
                        )}
                    />
                ) : (
                    <Logo
                        imgClass="w-60 h-16" // Adjust size as needed
                        mode={mode || defaultMode}
                        type={sideNavCollapse ? 'streamline' : 'full'}
                        className={classNames(
                            sideNavCollapse &&
                                'ltr:ml-[11.5px] ltr:mr-[11.5px]', // Original centering logic
                            sideNavCollapse
                                ? SIDE_NAV_CONTENT_GUTTER
                                : LOGO_X_GUTTER,
                        )}
                    />
                )}

                {/* Removed the hardcoded text span, relying on Logo component */}
            </Link>

            {/* SideNav Content (Menu Area) */}
            <div
                className={classNames(
                    'side-nav-content',
                    'flex-grow', // Allow content to fill remaining space
                    'overflow-hidden', // Hide overflow before Scrollbar applies
                    contentClass,
                )}
            >
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
            {/* Fixed Logout Button at Bottom */}
                <div className="absolute bottom-4 w-full px-4">
                    <button
                         onClick={()=> setIsLogoutDialogOpen(true)}
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
