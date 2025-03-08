import { Scene } from './scenes/Scene';
import { HUD } from './components/HUD';
import { MobileControls } from './components/MobileControls';
import './App.css';

function App() {
  return (
    <div className="app">
      <Scene />
      <HUD />
      <MobileControls />
    </div>
  );
}

export default App;
