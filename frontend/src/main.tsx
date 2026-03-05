import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletConnectProvider } from '@btc-vision/walletconnect';
import { App } from './App.js';
import './styles/globals.css';
import './styles/animations.css';
import './styles/components.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
        <WalletConnectProvider>
            <App />
        </WalletConnectProvider>
    </React.StrictMode>
);
