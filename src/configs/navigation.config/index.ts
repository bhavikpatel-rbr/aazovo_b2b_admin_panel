import dashboardsNavigationConfig from './dashboards.navigation.config'
import businessEntitiesNavigationConfig from './businessEntities.navigation.config'
import productManagementNavigationConfig from './product-management.navigation.config'
import salesLeadsNavigationConfig from './sales-leads.navigation.config'
import taskNavigationConfig from './task.navigation.config'
import hrEmployeesNavigationConfig from './hr-employee.navigation.config'
import accessControlNavigationConfig from './accessControll.navigation.config'
import systemSettingsNavigationConfig from './system-tools.navigation.config'
import settingsNavigationConfig from './adminSettings.navigatiom.config'
import masterNavigationConfig from './master.navigation.config'
import userengagementNavigationConfig from './user-engagement.navigation.config'
import otherNavigationConfig from './others.navigation.config'
import type { NavigationTree } from '@/@types/navigation'
import emailMessagesNavigationConfig from './emailMessagesRoutes.navigation.config'
import uiComponentNavigationConfig from './ui-components.navigation.config'
import webSettingsNavigationConfig from './webSettings.navigation.config'
const navigationConfig: NavigationTree[] = [
    ...dashboardsNavigationConfig,
    ...businessEntitiesNavigationConfig,
    ...productManagementNavigationConfig,
    ...salesLeadsNavigationConfig,
    ...userengagementNavigationConfig,
    ...taskNavigationConfig,
    ...emailMessagesNavigationConfig,
    ...hrEmployeesNavigationConfig,
    ...accessControlNavigationConfig,
    ...systemSettingsNavigationConfig,
    ...settingsNavigationConfig,
    ...webSettingsNavigationConfig,
    ...masterNavigationConfig,
    ...otherNavigationConfig,
    ...uiComponentNavigationConfig,
]

export default navigationConfig
