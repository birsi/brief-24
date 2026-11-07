import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import NotebookToast from './components/NotebookToast';
import { GameProvider } from './game/store';
import Calendar from './screens/Calendar';
import Day from './screens/Day';
import Delivered from './screens/Delivered';
import Notebook from './screens/Notebook';
import Dev from './screens/Dev';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <GameProvider>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/day/:num" element={<Day />} />
          <Route path="/day/:num/delivered" element={<Delivered />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/dev" element={<Dev />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <NotebookToast />
      </GameProvider>
    </BrowserRouter>
  </StrictMode>,
);
