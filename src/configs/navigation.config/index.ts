import dashboardsNavigationConfig from './dashboards.navigation.config'
import businessEntitiesNavigationConfig from './business-entities.navigation.config'
import productManagementNavigationConfig from './product-management.navigation.config'
import salesLeadsNavigationConfig from './sales-leads.navigation.config'
import marketingNavigationConfig from './marketing.navigation.config'
import taskNavigationConfig from './task.navigation.config'
import hrEmployeesNavigationConfig from './hr-employee.navigation.config'
import accessControlNavigationConfig from './access-controll.navigation.config'
import systemSettingsNavigationConfig from './system-tools.navigation.config'
import settingsNavigationConfig from './settings.navigatiom.config'
import masterNavigationConfig from './master.navigation.config'
import documentMasterNavigationConfig from './document-master.navigation.config'
import userengagementNavigationConfig from './user-engagement.navigation.config'
import otherNavigationConfig from './others.navigation.config'
import conceptNavigationConfig from './concepts.navigation.config'
import type { NavigationTree } from '@/@types/navigation'
import uiComponentNavigationConfig from './ui-components.navigation.config'
const navigationConfig: NavigationTree[] = [
    ...dashboardsNavigationConfig,
    ...businessEntitiesNavigationConfig,
    ...productManagementNavigationConfig,
    ...salesLeadsNavigationConfig,
    ...userengagementNavigationConfig,
    ...taskNavigationConfig,
    ...marketingNavigationConfig,
    ...hrEmployeesNavigationConfig,
    ...accessControlNavigationConfig,
    ...systemSettingsNavigationConfig,
    ...settingsNavigationConfig,
    ...documentMasterNavigationConfig,
    ...masterNavigationConfig,
    ...otherNavigationConfig,
    ...uiComponentNavigationConfig,
]

export default navigationConfig
