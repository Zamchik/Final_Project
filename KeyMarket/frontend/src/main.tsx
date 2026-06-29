import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { themeConfig } from './styles/theme';
import App from './App';
import './styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={themeConfig}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);