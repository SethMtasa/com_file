import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ChakraProvider } from '@chakra-ui/react';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/tailwind-light/theme.css";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <PrimeReactProvider>    
  <ChakraProvider>
        <App />
  </ChakraProvider>
    </PrimeReactProvider>
  </React.StrictMode>
);

reportWebVitals();
