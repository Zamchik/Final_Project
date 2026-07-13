import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from '@/App';
import '@/app/styles/global.scss';
import { themeConfig } from './app/styles/theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={themeConfig}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);