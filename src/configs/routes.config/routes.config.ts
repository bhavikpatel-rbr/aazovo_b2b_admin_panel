import dashboardsRoute from './dashboardsRoute'
import authRoute from './authRoute'
import authDemoRoute from './authDemoRoute'
import othersRoute from './othersRoute'
import businessEntityRoute from './businessEntityRoute'
import productManagementRoute from './productManagementRoute'
import salesLeadsRoute from './salesLeadsRoute'
import emailMessagesRoute from './emailMessagesRoute'
import taskRoute from './taskRoute'
import hrEmployeesRoute from './hrEmployeesRoute'
import accessControllRoute from './accessControllRoutes'
import masterRoutes from './masterRoutes'
import systemToolsRoutes from './systemToolsRoutes'
import adminSettingsRoutes from './adminSettingsRoutes'
import type { Routes } from '@/@types/routes'
import uiComponentsRoute from './uiComponentsRoute'
import userEngagementRoute from './userEngagementRoute'
import webSettingsRoutes from './webSettingsRoute'
import accountDocumentRoutes from './accountDocumentRoutes'

export const publicRoutes: Routes = [...authRoute]

export const protectedRoutes: Routes = [
    ...dashboardsRoute,
    ...authDemoRoute,
    ...othersRoute,
    ...businessEntityRoute,
    ...productManagementRoute,
    ...salesLeadsRoute,
    ...taskRoute,
    ...hrEmployeesRoute,
    ...accessControllRoute,
    ...systemToolsRoutes,
    ...masterRoutes,
    ...adminSettingsRoutes,
    ...webSettingsRoutes,
    ...userEngagementRoute,
    ...uiComponentsRoute,
    ...emailMessagesRoute,
    ...accountDocumentRoutes,
]
