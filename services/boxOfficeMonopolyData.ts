// Box Office Monopoly Game Data

export interface AIPlayer {
  id: string;
  name: string;
  personality: string;
  strategy: 'aggressive' | 'defensive' | 'opportunistic' | 'speculative';
  emoji: string;
  currentStrategy: string;
  conversationHistory: string[];
  money: number;
  position: number;
  properties: Property[];
  inJail: boolean;
  jailTurns: number;
}

export interface Property {
  id: string;
  name: string;
  franchise: string;
  type: 'movie' | 'streaming' | 'studio';
  basePrice: number;
  rentBase: number;
  position: number;
  ownedBy?: string | null;
  houses: number;
  mortgageValue: number;
  mortgaged: boolean;
  colorGroup: 'blue' | 'red' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink' | 'brown';
}

export interface ChanceCard {
  id: string;
  title: string;
  description: string;
  type: 'collection' | 'payment' | 'movement' | 'property_action' | 'jail' | 'special';
  value?: number;
  action?: string;
  flavor: string;
}

// AI Personalities
export const aiPersonalities: AIPlayer[] = [
  {
    id: 'blockbuster-baron',
    name: 'The Blockbuster Baron',
    personality: 'Aggressive Hollywood mogul who loves big bets and quick profits. Takes risks and goes for instant returns.',
    strategy: 'aggressive',
    emoji: '🦹',
    currentStrategy: '',
    conversationHistory: [],
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0
  },
  {
    id: 'indie-auteur',
    name: 'The Indie Auteur',
    personality: 'Cultural elite who pursues artistic vision over profits. Builds carefully and values quality over quantity.',
    strategy: 'defensive',
    emoji: '🎭',
    currentStrategy: '',
    conversationHistory: [],
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0
  },
  {
    id: 'streaming-chief',
    name: 'The Streaming Chief',
    personality: 'Tech-savvy executive focused on long-term dominance. Buys everything affordable and maximizes subscriber revenue.',
    strategy: 'opportunistic',
    emoji: '📺',
    currentStrategy: '',
    conversationHistory: [],
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0
  },
  {
    id: 'remake-ruler',
    name: 'The Remake Ruler',
    personality: 'Copycat genius who purchases properties cheap and resells them at premium. Speculates on undervalued properties.',
    strategy: 'speculative',
    emoji: '👑',
    currentStrategy: '',
    conversationHistory: [],
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0
  }
];

// Master property pool - randomly sampled for each game
export const propertyPool: Omit<Property, 'position' | 'houses' | 'mortgageValue' | 'mortgaged' | 'ownedBy'>[] = [
  // Marvel Universe
  { id: 'marvel-avengers', name: 'Avengers Endgame', franchise: 'Marvel Cinematic Universe', type: 'movie', basePrice: 400, rentBase: 50, colorGroup: 'red' },
  { id: 'marvel-iron-man', name: 'Iron Man Trilogy', franchise: 'Marvel Cinematic Universe', type: 'movie', basePrice: 300, rentBase: 35, colorGroup: 'red' },
  { id: 'marvel-spiderman', name: 'Spider-Man Universe', franchise: 'Marvel Cinematic Universe', type: 'movie', basePrice: 280, rentBase: 32, colorGroup: 'red' },
  { id: 'marvel-xmen', name: 'X-Men Saga', franchise: 'Marvel Cinematic Universe', type: 'movie', basePrice: 260, rentBase: 30, colorGroup: 'red' },

  // DC Universe
  { id: 'dc-justice-league', name: 'Justice League', franchise: 'DC Extended Universe', type: 'movie', basePrice: 380, rentBase: 45, colorGroup: 'blue' },
  { id: 'dc-batman', name: 'The Dark Knight Trilogy', franchise: 'DC Extended Universe', type: 'movie', basePrice: 320, rentBase: 38, colorGroup: 'blue' },
  { id: 'dc-wonder-woman', name: 'Wonder Woman', franchise: 'DC Extended Universe', type: 'movie', basePrice: 290, rentBase: 34, colorGroup: 'blue' },
  { id: 'dc-superman', name: 'Man of Steel', franchise: 'DC Extended Universe', type: 'movie', basePrice: 270, rentBase: 31, colorGroup: 'blue' },

  // Star Wars
  { id: 'star-wars-sequel', name: 'Star Wars: The Rise of Skywalker', franchise: 'Star Wars', type: 'movie', basePrice: 450, rentBase: 55, colorGroup: 'yellow' },
  { id: 'star-wars-original', name: 'Star Wars: A New Hope', franchise: 'Star Wars', type: 'movie', basePrice: 250, rentBase: 28, colorGroup: 'yellow' },
  { id: 'star-wars-prequel', name: 'Star Wars: Phantom Menace', franchise: 'Star Wars', type: 'movie', basePrice: 230, rentBase: 25, colorGroup: 'yellow' },
  { id: 'star-wars-mandalorian', name: 'The Mandalorian Series', franchise: 'Star Wars', type: 'streaming', basePrice: 370, rentBase: 42, colorGroup: 'yellow' },

  // Horror Classics
  { id: 'horror-scream', name: 'Scream Franchise', franchise: 'Slasher Horror', type: 'movie', basePrice: 240, rentBase: 27, colorGroup: 'purple' },
  { id: 'horror-friday-13', name: 'Friday the 13th Series', franchise: 'Slasher Horror', type: 'movie', basePrice: 200, rentBase: 23, colorGroup: 'purple' },
  { id: 'horror-halloween', name: 'Halloween Franchise', franchise: 'Slasher Horror', type: 'movie', basePrice: 190, rentBase: 22, colorGroup: 'purple' },
  { id: 'horror-conjuring', name: 'The Conjuring Universe', franchise: 'Supernatural Horror', type: 'movie', basePrice: 310, rentBase: 37, colorGroup: 'purple' },

  // Animation Studios
  { id: 'pixar-toy-story', name: 'Toy Story Franchise', franchise: 'Pixar Animation', type: 'movie', basePrice: 330, rentBase: 39, colorGroup: 'green' },
  { id: 'pixar-finding-nemo', name: 'Finding Nemo', franchise: 'Pixar Animation', type: 'movie', basePrice: 280, rentBase: 33, colorGroup: 'green' },
  { id: 'dreamworks-shrek', name: 'Shrek Franchise', franchise: 'DreamWorks Animation', type: 'movie', basePrice: 290, rentBase: 34, colorGroup: 'green' },
  { id: 'dreamworks-madagascar', name: 'Madagascar Series', franchise: 'DreamWorks Animation', type: 'movie', basePrice: 250, rentBase: 29, colorGroup: 'green' },

  // James Bond
  { id: 'bond-skyfall', name: 'James Bond: Skyfall', franchise: 'James Bond', type: 'movie', basePrice: 350, rentBase: 41, colorGroup: 'orange' },
  { id: 'bond-casino-royale', name: 'James Bond: Casino Royale', franchise: 'James Bond', type: 'movie', basePrice: 300, rentBase: 35, colorGroup: 'orange' },
  { id: 'bond-no-time-die', name: 'James Bond: No Time to Die', franchise: 'James Bond', type: 'movie', basePrice: 420, rentBase: 50, colorGroup: 'orange' },

  // Streaming Services
  { id: 'netflix-house-cards', name: 'Game of Thrones', franchise: 'Netflix Original', type: 'streaming', basePrice: 360, rentBase: 43, colorGroup: 'pink' },
  { id: 'netflix-stranger-things', name: 'Stranger Things', franchise: 'Netflix Original', type: 'streaming', basePrice: 320, rentBase: 38, colorGroup: 'pink' },
  { id: 'hbo-succession', name: 'Succession', franchise: 'HBO Max', type: 'streaming', basePrice: 290, rentBase: 34, colorGroup: 'pink' },
  { id: 'disney-mandalorian', name: 'The Mandalorian', franchise: 'Disney+', type: 'streaming', basePrice: 380, rentBase: 45, colorGroup: 'pink' },

  // Studios
  { id: 'universal', name: 'Universal Pictures', franchise: 'Major Studios', type: 'studio', basePrice: 500, rentBase: 60, colorGroup: 'brown' },
  { id: 'paramount', name: 'Paramount Pictures', franchise: 'Major Studios', type: 'studio', basePrice: 480, rentBase: 58, colorGroup: 'brown' },
  { id: 'warner-bros', name: 'Warner Bros.', franchise: 'Major Studios', type: 'studio', basePrice: 510, rentBase: 62, colorGroup: 'brown' },
  { id: 'disney-studio', name: 'Walt Disney Pictures', franchise: 'Major Studios', type: 'studio', basePrice: 520, rentBase: 64, colorGroup: 'brown' },

  // Romantic Comedies
  { id: 'rom-com-love-actually', name: 'Love Actually', franchise: 'Romantic Comedy', type: 'movie', basePrice: 220, rentBase: 25, colorGroup: 'yellow' },
  { id: 'rom-com-500-days', name: '500 Days of Summer', franchise: 'Romantic Comedy', type: 'movie', basePrice: 180, rentBase: 21, colorGroup: 'yellow' },
  { id: 'rom-com-crazy-stupid-love', name: 'Crazy, Stupid, Love', franchise: 'Romantic Comedy', type: 'movie', basePrice: 170, rentBase: 20, colorGroup: 'yellow' },

  // Sci-Fi
  { id: 'sci-fi-interstellar', name: 'Interstellar', franchise: 'Sci-Fi Epics', type: 'movie', basePrice: 340, rentBase: 40, colorGroup: 'orange' },
  { id: 'sci-fi-blade-runner', name: 'Blade Runner 2049', franchise: 'Sci-Fi Epics', type: 'movie', basePrice: 310, rentBase: 37, colorGroup: 'orange' },
  { id: 'sci-fi-arrival', name: 'Arrival', franchise: 'Sci-Fi Epics', type: 'movie', basePrice: 280, rentBase: 33, colorGroup: 'orange' },
];

// Chance cards
export const chanceCards: ChanceCard[] = [
  // Collections
  { id: 'oscar-win', title: 'Oscar Victory!', description: 'You win the Best Picture Oscar! Collect $200 from every player as celebration fees.', type: 'collection', value: 200, flavor: 'The champagne is flowing!' },
  { id: 'world-premiere', title: 'World Premiere Party!', description: 'Throw a lavish world premiere party. Collect $150 from every player for tickets.', type: 'collection', value: 150, flavor: 'Red carpet. Paparazzi. Magic.' },
  { id: 'box-office-boom', title: 'Box Office Explosion!', description: 'Your latest film becomes a sensation. Collect $100 from every player for hype royalties.', type: 'collection', value: 100, flavor: 'Word of mouth goes viral!' },
  { id: 'streaming-deal', title: 'Streaming Deal Signed!', description: 'Land a massive streaming contract. Collect $180 from every player.', type: 'collection', value: 180, flavor: 'Content is king!' },

  // Payments
  { id: 'reshoots-required', title: 'Reshoots Required!', description: 'Creative differences require expensive reshoots. Pay $200 to the film fund.', type: 'payment', value: 200, flavor: 'Sometimes movies need a rewrite.' },
  { id: 'marketing-fiasco', title: 'Marketing Fiasco!', description: 'Your marketing campaign backfires. Pay $150 for damage control ads.', type: 'payment', value: 150, flavor: 'Social media can be brutal.' },
  { id: 'piracy-lawsuit', title: 'Piracy Lawsuit!', description: 'Your film gets pirated massively. Pay $175 in legal fees.', type: 'payment', value: 175, flavor: 'Copyright infringement is serious.' },
  { id: 'production-delay', title: 'Production Delayed!', description: 'Weather and union strikes delay production. Pay $120 for crew overtime.', type: 'payment', value: 120, flavor: 'Movies never go smoothly.' },
  { id: 'bad-reviews', title: 'Critics Hate It!', description: 'Your film gets demolished by critics. Pay $80 for PR consultants.', type: 'payment', value: 80, flavor: 'Roger Ebert would not be pleased.' },

  // Movement
  { id: 'festival-circuit', title: 'Film Festival Tour!', description: 'Your indie film needs festival exposure. Move forward 7 spaces to the next streaming service.', type: 'movement', action: 'festival', flavor: 'Sundance or bust!' },
  { id: 'hollywood-walk', title: 'Walk of Fame!', description: 'Get honored on the Hollywood Walk of Fame. Advance to the nearest studio space.', type: 'movement', action: 'walk_of_fame', flavor: 'Your star shines bright!' },
  { id: 'distribution-deal', title: 'Distribution Deal!', description: 'Secure international distribution. Move forward 5 spaces.', type: 'movement', action: 'forward_5', flavor: 'Your film goes global!' },
  { id: 'bad-press', title: 'Scandal Breaks!', description: 'Controversial scandal derails your career. Go back 3 spaces to do damage control.', type: 'movement', action: 'backward_3', flavor: 'The tabloids are merciless.' },

  // Property Actions
  { id: 'property-tax', title: 'Property Tax Assessment!', description: 'Building licenses and permits are due. Pay $25 for each property you own.', type: 'property_action', value: 25, flavor: 'Taxes on theaters are the highest.' },
  { id: 'franchise-expans', title: 'Franchise Expansion!', description: 'Sequel rights become available. Pay $50 to add a house to any property you own.', type: 'property_action', action: 'upgrade_house', flavor: 'The franchise must go on!' },
  { id: 'streaming-rights', title: 'Streaming Rights!', description: 'Your properties get picked up by streaming. Collect double rent from all players.', type: 'property_action', action: 'double_rent', flavor: 'Binge-worthy content!' },

  // Jail Cards
  { id: 'creative-block', title: 'Creative Block!', description: 'Writers strike hits your project. Go directly to jail for rewrites.', type: 'jail', action: 'go_to_jail', flavor: 'The blank page is your prison.' },
  { id: 'box-office-flop', title: 'Box Office Flop!', description: 'Your film bombs spectacularly. Go to jail for "finding your voice".', type: 'jail', action: 'go_to_jail', flavor: 'Sometimes you just bomb.' },

  // Special Cards
  { id: 'oscar-kiss', title: 'Oscar Acceptance Kiss!', description: 'Give everyone a passionate kiss for luck. Everyone passes the hat - you collect $50 from each.', type: 'collection', value: 50, flavor: 'Romance on the red carpet!' },
  { id: 'cannes-palme', title: 'Cannes Palme d\'Or!', description: 'Your art-house film wins at Cannes! You\'re now the festival king - collect from all players.', type: 'special', action: 'festival_king', flavor: 'Critics bow before you!' },
];

// Helper functions for random selection
export function getRandomProperties(count: number): Property[] {
  const shuffled = [...propertyPool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // Assign positions (distribute around the board)
  return selected.map((prop, index) => ({
    ...prop,
    position: [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39][index] || index * 2 + 1,
    houses: 0,
    mortgageValue: Math.floor(prop.basePrice / 2),
    mortgaged: false,
  }));
}

export function getShuffledChanceCards(): ChanceCard[] {
  return [...chanceCards].sort(() => Math.random() - 0.5);
}

export function createRandomAIOpponents(): AIPlayer[] {
  const available = [...aiPersonalities].sort(() => Math.random() - 0.5).slice(0, 3);
  return available.map((ai, index) => ({
    ...ai,
    money: 1500,
    position: 0,
    properties: [],
    inJail: false,
    jailTurns: 0,
    conversationHistory: []
  }));
}

export interface GameState {
  humanPlayer: {
    money: number;
    position: number;
    properties: Property[];
    inJail: boolean;
    jailTurns: number;
  };
  aiOpponents: AIPlayer[];
  currentPlayerIndex: number;
  properties: Property[];
  chanceCards: ChanceCard[];
  chanceCardIndex: number;
  gameRound: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner?: string;
  lastRoll: [number, number] | null;
  doublesCount: number;
}

// Game constants
export const STARTING_MONEY = 1500;
export const SALARY_PASS_GO = 200;
export const BOARD_SIZE = 40;
export const JAIL_POSITION = 10;
export const GO_POSITION = 0;
