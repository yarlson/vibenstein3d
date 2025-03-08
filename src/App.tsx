import { Scene } from './scenes/Scene';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import { Minimap } from './components/Minimap';
import './App.css';

function App() {
  return (
    <div className="app">
      <Scene />
      <HUD />
      <Minimap />
      <MobileControls />
    </div>
  );
}

export default App;
