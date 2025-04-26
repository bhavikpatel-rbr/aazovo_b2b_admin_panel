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

    const currentRouteKey = useRouteKeyStore((state) => state.currentRouteKey)

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
                'flex flex-col', // Ensure flex column layout for header/content
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
                        imgClass="w-60 h-12" // Adjust size as needed
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
                <ScrollBar style={{ height: '100%' }} direction={direction}>
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
        </div>
    )
}

export default SideNav
