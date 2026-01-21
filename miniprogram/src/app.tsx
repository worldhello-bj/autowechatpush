
import Taro, { useLaunch } from '@tarojs/taro'
import apiClient, { setTokens } from './services/apiClient'
import './app.scss'

function App(props: any) {
  useLaunch(async () => {
    console.log('App launched.')
    
    // Auto login with WeChat
    try {
        // Check if already logged in (optional, but good for speed)
        // if (apiClient.isAuthenticated()) return

        const { code } = await Taro.login()
        if (code) {
            console.log('Got WeChat code:', code)
            const res = await apiClient.auth.loginWithWeChat(code)
            
            if (res.success && res.data) {
                setTokens(res.data.accessToken, res.data.refreshToken)
                console.log('WeChat auto-login success', res.data.user.name)
                Taro.showToast({ title: `Welcome ${res.data.user.name}`, icon: 'none' })
            } else {
                console.error('WeChat login failed', res.error)
                Taro.showToast({ title: 'Login Failed', icon: 'none' })
            }
        } else {
            console.error('Taro.login failed, no code')
        }
    } catch (err) {
        console.error('Login flow error', err)
    }
  })

  return props.children
}

export default App
