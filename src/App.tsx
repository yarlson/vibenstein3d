import { Scene } from './scenes/Scene';
import { HUD } from './components/HUD';
import './App.css';

function App() {
  return (
    <div className="app">
      <Scene />
      <HUD />
    </div>
  );
}

export default App;
