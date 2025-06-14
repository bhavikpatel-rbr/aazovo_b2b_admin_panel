import ModeSwitcher from './ModeSwitcher'
import LayoutSwitcher from './LayoutSwitcher'
import ThemeSwitcher from './ThemeSwitcher'
import DirectionSwitcher from './DirectionSwitcher'
import CopyButton from './CopyButton'
import useDarkMode from '@/utils/hooks/useDarkMode'

export type ThemeConfiguratorProps = {
    callBackClose?: () => void
}

const ThemeConfigurator = ({ callBackClose }: ThemeConfiguratorProps) => {

    const [isDark, setIsDark] = useDarkMode()
    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex flex-col gap-y-10 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h6>{!isDark ? "Light Mode" : "Dark Mode"}</h6>
                        <span>{!isDark ? "Switch theme to dark mode" : "Switch theme to light mode" }</span>
                    </div>
                    <ModeSwitcher />
                </div>
                {/* <div className="flex items-center justify-between">
                    <div>
                        <h6>Direction</h6>
                        <span>Select a direction</span>
                    </div>
                    <DirectionSwitcher callBackClose={callBackClose} />
                </div> */}
                <div>
                    <h6 className="mb-3">Theme</h6>
                    <ThemeSwitcher />
                </div>
                <div>
                    <h6 className="mb-3">Layout</h6>
                    <LayoutSwitcher />
                </div>
            </div>
            <CopyButton />
        </div>
    )
}

export default ThemeConfigurator
