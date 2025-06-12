import { useContext } from 'react'
import classNames from 'classnames'
import { GroupContextProvider } from './context/groupContext'
import MenuContext from './context/menuContext'
import type { CommonProps } from '../@types/common'
import type { ReactNode } from 'react'
import { useThemeStore } from '@/store/themeStore'

export interface MenuGroupProps extends CommonProps {
    label: string | ReactNode
}

const MenuGroup = (props: MenuGroupProps) => {
    const { label, children, className } = props
  const layoutType = useThemeStore((state) => state.layout.type)
    const { sideCollapsed } = useContext(MenuContext)

    const menuGroupDefaultClass = 'menu-group'
    const menuGroupClass = classNames(menuGroupDefaultClass, className)

    
    return (
        <div className={menuGroupClass}>
            {label && !sideCollapsed && label != 'Dashboard' && (
                <div className={classNames('menu-title')} style={{color :layoutType == 'collapsibleSide' ? 'black' :'white'}}>{label}</div>
            )}
            <GroupContextProvider value={null}>
                <ul>{children}</ul>
            </GroupContextProvider>
        </div>
    )
}

MenuGroup.displayName = 'MenuGroup'

export default MenuGroup
