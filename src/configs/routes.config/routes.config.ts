import dashboardsRoute from './dashboardsRoute'
import authRoute from './authRoute'
import authDemoRoute from './authDemoRoute'
import othersRoute from './othersRoute'
import businessEntityRoute from './businessEntityRoute'
import productManagementRoute from './productManagementRoute'
import salesLeadsRoute from './salesLeadsRoute'
import marketingRoute from './marketingRoute'
import taskRoute from './taskRoute'
import hrEmployeesRoute from './hrEmployeesRoute'
import accessControllRoute from './accessControllRoutes'
import masterRoutes from './masterRoutes'
import systemToolsRoutes from './systemToolsRoutes'
import settingsRoutes from './settingsRoutes'
import documentMasterRoutes from './documentMasterRoutes'
import type { Routes } from '@/@types/routes'
import uiComponentsRoute from './uiComponentsRoute'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    ...dashboardsRoute,
    ...authDemoRoute,
    ...othersRoute,
    ...businessEntityRoute,
    ...productManagementRoute,
    ...salesLeadsRoute,
    ...marketingRoute,
    ...taskRoute,
    ...hrEmployeesRoute,
    ...accessControllRoute,
    ...systemToolsRoutes,
    ...masterRoutes,
    ...settingsRoutes,
    ...documentMasterRoutes,
    ...uiComponentsRoute,
]
