import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { themeConfig } from '@/app/styles/theme';
import AppComponent from '@/App';
import '@/app/styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfigProvider theme={themeConfig}>
        <App>
          <AppComponent />
        </App>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);