import { CellType } from '../../types/level';

// Define the toolbar element types
export type ToolbarElementType = {
  id: number;
  name: string;
  icon: string; // Use emoji as placeholder icons
  cellType: number;
};

// Define the element types available in the toolbar
export const TOOLBAR_ELEMENTS: ToolbarElementType[] = [
  { id: 1, name: 'Empty', icon: '⬜', cellType: CellType.Empty },
  { id: 2, name: 'Wall', icon: '🧱', cellType: CellType.Wall },
  { id: 3, name: 'Wall Red', icon: '🟥', cellType: CellType.WallRed },
  { id: 4, name: 'Wall Blue', icon: '🟦', cellType: CellType.WallBlue },
  { id: 5, name: 'Wall Green', icon: '🟩', cellType: CellType.WallGreen },
  { id: 6, name: 'Door', icon: '🚪', cellType: CellType.Door },
  { id: 7, name: 'Key', icon: '🔑', cellType: CellType.Key },
  { id: 8, name: 'Player Spawn', icon: '👤', cellType: CellType.PlayerSpawn },
  { id: 9, name: 'Enemy Spawn', icon: '👹', cellType: CellType.EnemySpawn },
  { id: 10, name: 'Light', icon: '💡', cellType: CellType.CeilingLight },
];

// Mode types for the editor
export type EditorMode = 'standard' | 'advanced'; 