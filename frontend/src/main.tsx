
import React from 'react'
import {createRoot} from 'react-dom/client'
import './style.css'
import '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';

import App from './App'

const container = document.getElementById('root')

const root = createRoot(container!)

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)
