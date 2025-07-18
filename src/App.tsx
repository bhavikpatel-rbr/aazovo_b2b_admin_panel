import { BrowserRouter } from 'react-router-dom'
import Theme from '@/components/template/Theme'
import Layout from '@/components/layouts'
import { AuthProvider } from '@/auth'
import Views from '@/views'
import appConfig from './configs/app.config'
import './locales'
import { store, persistor } from './reduxtool/store'
import { PersistGate } from 'redux-persist/integration/react'
import { Provider as ReduxProvider } from 'react-redux'
import Loader from './components/loader'

if (appConfig.enableMock) {
    import('./mock')
}

function App() {
    return (
        <ReduxProvider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <Theme>
                    <BrowserRouter basename="/adminpanel">
                        <Loader />
                        <AuthProvider>
                            <Layout>
                                <Views />
                            </Layout>
                        </AuthProvider>
                    </BrowserRouter>
                </Theme>
            </PersistGate>
        </ReduxProvider>
    )
}

export default App
