import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { themeConfig } from './styles/theme';
import AppComponent from './App';
import './styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={themeConfig}>
        <App>
          <AppComponent />
        </App>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);