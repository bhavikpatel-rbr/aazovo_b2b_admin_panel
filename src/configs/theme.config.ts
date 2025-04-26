import { THEME_ENUM } from '@/constants/theme.constant'
import { Direction, Mode, ControlSize, LayoutType } from '@/@types/theme'

export type ThemeConfig = {
    themeSchema: string
    direction: Direction
    mode: Mode
    panelExpand: boolean
    controlSize: ControlSize
    layout: {
        type: LayoutType
        sideNavCollapse: boolean
    }
}

/**
 * Since some configurations need to be match with specific themes,
 * we recommend to use the configuration that generated from demo.
 */

export const themeConfig: ThemeConfig = {
    themeSchema: 'default',
    direction: 'ltr',
    mode: 'light',
    panelExpand: false,
    controlSize: 'md',
    layout: {
        type: 'framelessSide',
        sideNavCollapse: false,
    },
}
