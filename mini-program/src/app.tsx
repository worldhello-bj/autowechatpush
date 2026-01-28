import React, { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { AuthProvider } from './context/AuthContext'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
  })

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}

export default App