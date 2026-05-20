export interface FormationPlayer {
  number: string;
  position: { x: number; y: number };
  role: string;
}

export interface Formation {
  name: string;
  shortName: string;
  description: string;
  players: FormationPlayer[];
  style: 'defensive' | 'balanced' | 'attacking';
  era: 'classic' | 'modern' | 'contemporary';
}

// Standard field positions (relative to a 1000x600 field)
const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = 600;

// Position helpers
const createPosition = (x: number, y: number) => ({
  x: (x / 100) * FIELD_WIDTH,
  y: (y / 100) * FIELD_HEIGHT,
});

export const SOCCER_FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2',
    shortName: '442',
    description: 'Classic balanced formation with two banks of four',
    style: 'balanced',
    era: 'classic',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '2', position: createPosition(25, 20), role: 'Right Back' },
      { number: '5', position: createPosition(25, 35), role: 'Centre Back' },
      { number: '6', position: createPosition(25, 65), role: 'Centre Back' },
      { number: '3', position: createPosition(25, 80), role: 'Left Back' },
      { number: '4', position: createPosition(50, 25), role: 'Right Midfielder' },
      { number: '8', position: createPosition(50, 40), role: 'Central Midfielder' },
      { number: '7', position: createPosition(50, 60), role: 'Central Midfielder' },
      { number: '11', position: createPosition(50, 75), role: 'Left Midfielder' },
      { number: '10', position: createPosition(75, 40), role: 'Striker' },
      { number: '9', position: createPosition(75, 60), role: 'Striker' },
    ],
  },

  '4-3-3': {
    name: '4-3-3',
    shortName: '433',
    description: 'Modern attacking formation with wingers and a central striker',
    style: 'attacking',
    era: 'modern',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '2', position: createPosition(25, 20), role: 'Right Back' },
      { number: '5', position: createPosition(25, 35), role: 'Centre Back' },
      { number: '4', position: createPosition(25, 65), role: 'Centre Back' },
      { number: '3', position: createPosition(25, 80), role: 'Left Back' },
      { number: '6', position: createPosition(45, 35), role: 'Defensive Midfielder' },
      { number: '8', position: createPosition(50, 50), role: 'Central Midfielder' },
      { number: '10', position: createPosition(55, 65), role: 'Attacking Midfielder' },
      { number: '7', position: createPosition(75, 25), role: 'Right Winger' },
      { number: '9', position: createPosition(80, 50), role: 'Striker' },
      { number: '11', position: createPosition(75, 75), role: 'Left Winger' },
    ],
  },

  '3-5-2': {
    name: '3-5-2',
    shortName: '352',
    description: 'Formation with wing-backs providing width',
    style: 'balanced',
    era: 'modern',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '5', position: createPosition(25, 30), role: 'Right Centre Back' },
      { number: '6', position: createPosition(25, 50), role: 'Centre Back' },
      { number: '3', position: createPosition(25, 70), role: 'Left Centre Back' },
      { number: '2', position: createPosition(45, 15), role: 'Right Wing-Back' },
      { number: '4', position: createPosition(50, 35), role: 'Central Midfielder' },
      { number: '8', position: createPosition(50, 50), role: 'Central Midfielder' },
      { number: '10', position: createPosition(50, 65), role: 'Central Midfielder' },
      { number: '7', position: createPosition(45, 85), role: 'Left Wing-Back' },
      { number: '9', position: createPosition(75, 40), role: 'Striker' },
      { number: '11', position: createPosition(75, 60), role: 'Striker' },
    ],
  },

  '4-2-3-1': {
    name: '4-2-3-1',
    shortName: '4231',
    description: 'Modern formation with double pivot and attacking midfielder',
    style: 'balanced',
    era: 'contemporary',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '2', position: createPosition(25, 20), role: 'Right Back' },
      { number: '5', position: createPosition(25, 35), role: 'Centre Back' },
      { number: '4', position: createPosition(25, 65), role: 'Centre Back' },
      { number: '3', position: createPosition(25, 80), role: 'Left Back' },
      { number: '6', position: createPosition(45, 40), role: 'Defensive Midfielder' },
      { number: '8', position: createPosition(45, 60), role: 'Defensive Midfielder' },
      { number: '7', position: createPosition(60, 25), role: 'Right Midfielder' },
      { number: '10', position: createPosition(60, 50), role: 'Attacking Midfielder' },
      { number: '11', position: createPosition(60, 75), role: 'Left Midfielder' },
      { number: '9', position: createPosition(80, 50), role: 'Striker' },
    ],
  },

  '5-3-2': {
    name: '5-3-2',
    shortName: '532',
    description: 'Defensive formation with three centre-backs',
    style: 'defensive',
    era: 'modern',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '2', position: createPosition(25, 15), role: 'Right Wing-Back' },
      { number: '5', position: createPosition(25, 30), role: 'Right Centre Back' },
      { number: '6', position: createPosition(25, 50), role: 'Centre Back' },
      { number: '4', position: createPosition(25, 70), role: 'Left Centre Back' },
      { number: '3', position: createPosition(25, 85), role: 'Left Wing-Back' },
      { number: '7', position: createPosition(50, 35), role: 'Central Midfielder' },
      { number: '8', position: createPosition(50, 50), role: 'Central Midfielder' },
      { number: '10', position: createPosition(50, 65), role: 'Central Midfielder' },
      { number: '9', position: createPosition(75, 40), role: 'Striker' },
      { number: '11', position: createPosition(75, 60), role: 'Striker' },
    ],
  },

  '3-4-3': {
    name: '3-4-3',
    shortName: '343',
    description: 'Attacking formation with wide forwards',
    style: 'attacking',
    era: 'contemporary',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '5', position: createPosition(25, 30), role: 'Right Centre Back' },
      { number: '6', position: createPosition(25, 50), role: 'Centre Back' },
      { number: '4', position: createPosition(25, 70), role: 'Left Centre Back' },
      { number: '2', position: createPosition(45, 20), role: 'Right Midfielder' },
      { number: '8', position: createPosition(45, 40), role: 'Central Midfielder' },
      { number: '7', position: createPosition(45, 60), role: 'Central Midfielder' },
      { number: '3', position: createPosition(45, 80), role: 'Left Midfielder' },
      { number: '11', position: createPosition(75, 25), role: 'Right Forward' },
      { number: '9', position: createPosition(80, 50), role: 'Striker' },
      { number: '10', position: createPosition(75, 75), role: 'Left Forward' },
    ],
  },

  '4-1-4-1': {
    name: '4-1-4-1',
    shortName: '4141',
    description: 'Defensive formation with holding midfielder',
    style: 'defensive',
    era: 'modern',
    players: [
      { number: '1', position: createPosition(10, 50), role: 'Goalkeeper' },
      { number: '2', position: createPosition(25, 20), role: 'Right Back' },
      { number: '5', position: createPosition(25, 35), role: 'Centre Back' },
      { number: '6', position: createPosition(25, 65), role: 'Centre Back' },
      { number: '3', position: createPosition(25, 80), role: 'Left Back' },
      { number: '4', position: createPosition(40, 50), role: 'Defensive Midfielder' },
      { number: '7', position: createPosition(55, 25), role: 'Right Midfielder' },
      { number: '8', position: createPosition(55, 40), role: 'Central Midfielder' },
      { number: '10', position: createPosition(55, 60), role: 'Central Midfielder' },
      { number: '11', position: createPosition(55, 75), role: 'Left Midfielder' },
      { number: '9', position: createPosition(80, 50), role: 'Striker' },
    ],
  },
};

export const getFormationByName = (name: string): Formation | undefined => {
  return SOCCER_FORMATIONS[name];
};

export const getFormationsByStyle = (style: Formation['style']): Formation[] => {
  return Object.values(SOCCER_FORMATIONS).filter(f => f.style === style);
};

export const getFormationsByEra = (era: Formation['era']): Formation[] => {
  return Object.values(SOCCER_FORMATIONS).filter(f => f.era === era);
};

export const getAllFormations = (): Formation[] => {
  return Object.values(SOCCER_FORMATIONS);
};

// Convert formation to annotation format
export const formationToAnnotation = (
  formation: Formation,
  timestamp: number,
  authorId: string,
  team: 'home' | 'away' = 'home',
  scale: { width: number; height: number } = { width: 1000, height: 600 }
): any => {
  const players = formation.players.map(player => ({
    number: player.number,
    position: {
      x: (player.position.x / 1000) * scale.width,
      y: (player.position.y / 600) * scale.height,
    },
    team,
  }));

  return {
    id: `formation-${Date.now()}`,
    type: 'formation',
    timestamp,
    authorId,
    players,
    formation: formation.name,
    style: {
      homeColor: { r: 34, g: 197, b: 94, a: 1 }, // Green
      awayColor: { r: 239, g: 68, b: 68, a: 1 }, // Red
      lineColor: { r: 255, g: 255, b: 255, a: 0.5 }, // White with transparency
      showLines: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};