// Tile legend:
//   .  grass          G  tall grass (dragons hide here later)
//   =  path           ~  water
//   T  tree           R  rock
//   #  castle wall    B  castle battlement   H  castle window   D  castle door
//   f  flowers

export const SOLID = new Set(['T', '~', '#', 'B', 'H', 'D', 'R']);

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
    ],
  },
};

export function tileAt(map, x, y) {
  const row = map.rows[y];
  if (!row || x < 0 || x >= row.length) return 'T';
  return row[x];
}
