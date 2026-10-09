// Tile legend:
//   .  grass          G  tall grass (dragons hide here later)
//   =  path           ~  water
//   T  tree           R  rock
//   #  castle wall    B  castle battlement   H  castle window   D  castle door
//   f  flowers
// Cave:
//   W  cave wall      ,  cave floor     g  gravel (dragons hide here)   C  crystal
// Maldred's tower:
//   X  tower wall     x  tower floor    r  red carpet    F  torch
// Throne room (inside Bracken Castle; the castle doors D lead in):
//   o  stone floor    K  throne         N  banner

export const SOLID = new Set(['T', '~', '#', 'B', 'H', 'R', 'W', 'C', 'X', 'F', 'K', 'N']);
export const ENCOUNTER_TILES = new Set(['G', 'g']);

export const MAPS = {
  bracken: {
    id: 'bracken',
    name: 'Bracken Castle',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TT....BBBBBBBBBBBB....TT',
      'T.....#H##H##H##H#.....T',
      'T..f..############..f..T',
      'T.....#####DD#####.....T',
      'T..........==..........T',
      'T....GGG...==...~~~~...T',
      'T...GGGGG..==..~~~~~~..T',
      'T...GGGGG..==..~~~~~~..T',
      'T....GGG...==...~~~~...T',
      'T..........==..........T',
      'T....=================.T',
      'T....=.......=.........T',
      'T..GGGGG...RR=..GGGGG..T',
      'T..GGGGG...RR=..GGGGG..T',
      'T..GGGGG.....=..GGGGG..T',
      'T.....f......=.....f...T',
      'TT...........=........TT',
      'TTTTTTTTTTTTT=TTTTTTTTTT',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    start: { x: 11, y: 6, dir: 'down' },
    npcs: [
      {
        id: 'griffith',
        x: 9,
        y: 5,
        // Short, simple lines. {name} is replaced with the player's name.
        lines: [
          'Hi, {name}!',
          'I am Griffith.',
          'You can be a Dragon Master!',
          'Dragons hide in the tall grass.',
          'Go and look!',
        ],
      },
      {
        // Blocks the way to the forest until the castle dragons are caught.
        id: 'ana',
        x: 13,
        y: 17,
        gate: 'bracken',
        lines: ['Stop, {name}!', 'Get all {total} dragons here.', 'You have {count}.'],
      },
    ],
    exits: [
      { x: 13, y: 18, to: 'forest', tx: 13, ty: 1, dir: 'down' },
      { x: 11, y: 4, to: 'throne', tx: 5, ty: 8, dir: 'up' },
      { x: 12, y: 4, to: 'throne', tx: 6, ty: 8, dir: 'up' },
    ],
  },

  throne: {
    id: 'throne',
    name: 'Throne Room',
    rows: [
      '############',
      '#H#N#KK#N#H#',
      '#oooorroooo#',
      '#oooorroooo#',
      '#oooorroooo#',
      '#oooorroooo#',
      '#oooorroooo#',
      '#oooorroooo#',
      '#oooorroooo#',
      '#####DD#####',
    ],
    start: { x: 5, y: 8, dir: 'up' },
    npcs: [
      {
        id: 'king',
        x: 5,
        y: 2,
        dressup: true,
        lines: ['Hello, {name}!', 'I am King Roland.', 'Will you dress me up?'],
      },
    ],
    exits: [
      { x: 5, y: 9, to: 'bracken', tx: 11, ty: 5, dir: 'down' },
      { x: 6, y: 9, to: 'bracken', tx: 12, ty: 5, dir: 'down' },
    ],
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    rows: [
      'TTTTTTTTTTTTT=TTTTTTTTTT',
      'TT..GGG......=...GGGG.TT',
      'T..GGGGG.....=..GGGGGG.T',
      'T..GGGGG..T..=..GGGGGG.T',
      'T...GGG..TTT.=...GGGG..T',
      'T.........T..=.........T',
      'T~~~~~~~~~~~~=~~~~~~~~~T',
      'T.....f......=......f..T',
      'T..TT.....GGG=GGG.....TT',
      'T..TT....GGGG=GGGG....TT',
      'T........GGGG=GGGG.....T',
      'T.GGGG....GG.=.GG......T',
      'T.GGGG.......=.........T',
      'T.GGGG..TT...===========',
      'T......TTT..........GG.T',
      'T..f.......GGGG....GGG.T',
      'T.........GGGGGG...GG..T',
      'TT.......f.GGGG.......TT',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    start: { x: 13, y: 1, dir: 'down' },
    npcs: [
      {
        id: 'bo',
        x: 22,
        y: 13,
        gate: 'forest',
        lines: ['Stop, {name}!', 'Get all {total} dragons here.', 'You have {count}.'],
      },
    ],
    exits: [
      { x: 13, y: 0, to: 'bracken', tx: 13, ty: 17, dir: 'up' },
      { x: 23, y: 13, to: 'cave', tx: 1, ty: 6, dir: 'right' },
    ],
  },

  cave: {
    id: 'cave',
    name: 'Mountain Cave',
    rows: [
      'WWWWWWWWWWWWWWWWWWWWWWWW',
      'W,,,,,,WW,,,,,,,,,WW,,,W',
      'W,ggg,,WW,,gggg,,,WW,g,W',
      'W,ggg,,,,,,gggg,,,,,,g,W',
      'W,,,,,C,,,,,,,,,,,C,,,,W',
      'WWW,,,,,,ggggg,,,,,,WWWW',
      ',,,,,,,,,ggggg,,,ggg,,,,',
      'WWW,,C,,,,,,,,,,,ggg,,,W',
      'W,,,,,,,WWW,,,,,,,,,,,,W',
      'W,gggg,,WWW,,C,,gggg,,,W',
      'W,gggg,,,,,,,,,,gggg,,,W',
      'W,,,,,,,,ggg,,,,,,,,,C,W',
      'W,,C,,,,,ggg,,,,ggg,,,,W',
      'WWWWWWWWWWWWWWWWWWWWWWWW',
    ],
    start: { x: 1, y: 6, dir: 'right' },
    npcs: [
      {
        // Guards the tower door until every dragon is caught.
        id: 'griffith-cave',
        sprite: 'griffith',
        x: 22,
        y: 6,
        gate: 'cave',
        lines: ['Stop, {name}!', 'Maldred is in the tower.', 'Get all {total} dragons here.', 'You have {count}.'],
      },
    ],
    exits: [
      { x: 0, y: 6, to: 'forest', tx: 22, ty: 13, dir: 'left' },
      { x: 23, y: 6, to: 'tower', tx: 5, ty: 8, dir: 'up' },
    ],
  },

  tower: {
    id: 'tower',
    name: "Maldred's Tower",
    rows: [
      'XXXXXXXXXXXX',
      'XFXXXXXXXXFX',
      'XxxxxrrxxxxX',
      'XxxxxrrxxxxX',
      'XxFxxrrxxFxX',
      'XxxxxrrxxxxX',
      'XxxxxrrxxxxX',
      'XxxxxrrxxxxX',
      'XxxxxrrxxxxX',
      'XXXXXrrXXXXX',
    ],
    start: { x: 5, y: 8, dir: 'up' },
    npcs: [
      {
        id: 'maldred',
        x: 5,
        y: 2,
        battle: true,
        lines: ['I am Maldred!', 'I want all the dragons!', 'You can not stop me!'],
        rematch: ['You again, {name}?', 'This time I will win!'],
      },
    ],
    exits: [
      { x: 5, y: 9, to: 'cave', tx: 22, ty: 6, dir: 'left' },
      { x: 6, y: 9, to: 'cave', tx: 22, ty: 6, dir: 'left' },
    ],
  },
};

// Said after beating Maldred.
export const VICTORY_LINES = ['You did it, {name}!', 'Maldred ran away!', 'Come back to fight him again!'];

// For saves that already had all 14 dragons before Maldred's tower existed.
export const MALDRED_HINT_LINES = ['You have all 14 dragons!', 'Oh no! Maldred is in the tower!', 'Go to the cave and stop him, {name}!'];

// Said when he catches the last dragon in an area.
export const AREA_DONE_LINES = {
  bracken: ['You got all 4 castle dragons!', 'The forest is open!'],
  forest: ['You got all 5 forest dragons!', 'The cave is open!'],
  cave: ['You got all 14 dragons!', 'Oh no! Maldred is in the tower!', 'Go and stop him, {name}!'],
};

export function tileAt(map, x, y) {
  const row = map.rows[y];
  if (!row || x < 0 || x >= row.length) return 'T';
  return row[x];
}
