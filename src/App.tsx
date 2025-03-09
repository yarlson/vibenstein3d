import { Scene } from './scenes/Scene';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { Minimap } from './components/Minimap';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { lazy } from 'react';
import './App.css';

// Import the Editor component (will be created later)
const Editor = lazy(() => import('./editor/Editor'));

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Game Route */}
        <Route
          path="/"
          element={
            <div className="app">
              <Scene />
              <HUD />
              <Minimap />
              <MobileControls />
            </div>
          }
        />

        {/* Editor Route */}
        <Route
          path="/editor"
          element={
            <React.Suspense fallback={<div>Loading Editor...</div>}>
              <Editor />
            </React.Suspense>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
