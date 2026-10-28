// "The Pumpkin Case" — all text the players and the host see. Simple English on purpose.
// Lobby before the host starts, then a briefing every player pages through on their own phone.
export const lobby={image:'emperor',title:'The Great Pumpkin Investigation',text:'Wait for the Great Pumpkin Investigation to begin…'};
export const story=[
  {image:'intro-pumpkin',text:'Tonight is the Galactic Pumpkin Carving Contest. The Emperor carved the most beautiful pumpkin in the galaxy.'},
  {image:'intro-smashed',text:'This morning, it was found on the floor of the Throne Room. Smashed.',quote:'Find who did this. Or I will find someone to blame.'},
  {image:'detective',text:'You are an Imperial Detective. Five rooms are locked. Each one hides one piece of evidence. Open them, collect the evidence, and name the criminal.'},
  {image:'who-guilty',text:'Now you will meet 5 suspects. Each of them has special marks — like muddy boots or cookie crumbs. Look at the symbols carefully: the evidence you find will show the same symbols.'}
];
export const script='Welcome, detectives. Look at your phones and at the screen: I will read the briefing together with you. Then each of you investigates alone, for five minutes: five puzzles, five pieces of evidence. If you fail a puzzle, that evidence is lost — but four pieces are enough. At the end, name the criminal. The fastest correct detectives win the Emperor\'s respect.';
// Registration asks to draw the symbol twice. Set to false to accept the first drawing.
export const confirmSymbol=true;

// Trait icons. A clue matches every suspect who has that trait.
export const traits={
  mud:{icon:'🥾',label:'Muddy boots'}, cookie:{icon:'🍪',label:'Cookies'}, cape:{icon:'🧣',label:'Cape'},
  pole:{icon:'📏',label:'Long pole or stick'}, neat:{icon:'✨',label:'Neat and tidy'},
  saber:{icon:'⚔️',label:'Lightsaber'}, breath:{icon:'💨',label:'Heavy breathing'}, plans:{icon:'🗺️',label:'Death Star plans'},
  uniform:{icon:'🎖️',label:'Grey uniform'}, blaster:{icon:'🔫',label:'Blaster'}, armor:{icon:'🤍',label:'White armor'},
  trips:{icon:'🍌',label:'Trips over everything'}, oil:{icon:'🛢️',label:'Oil drops'}, wheels:{icon:'🛞',label:'Wheels'}, beep:{icon:'🔊',label:'Beeps a lot'}
};

export const suspects=[
  {id:'vader',name:'Darth Vader',image:'suspect-vader',motive:'His own pumpkin is not even half as nice.',
   traits:[['mud','Muddy boots — back from a swamp planet'],['cookie','Secret cookie lover'],['cape','Black cape'],['saber','Lightsaber'],['breath','Heavy breathing']]},
  {id:'tarkin',name:'Grand Moff Tarkin',image:'suspect-tarkin',motive:'He put the Death Star plans on that table. Maybe the pumpkin fell.',
   traits:[['cookie','Eats cookies in every meeting'],['neat','Very neat and tidy'],['pole','Long pointer stick'],['plans','Death Star plans'],['uniform','Grey uniform']]},
  {id:'klynn',name:'Stormtrooper Klynn',image:'suspect-klynn',motive:'The clumsiest soldier in the Empire.',
   traits:[['mud','Muddy boots'],['cookie','Always has cookies in his pocket'],['blaster','Blaster'],['armor','White armor'],['trips','Trips over everything']]},
  {id:'rex',name:'Royal Guard Rex',image:'suspect-rex',motive:'Always fixing and guarding everything. A bit too much.',
   traits:[['mud','Muddy boots — night patrol in the garden'],['cookie','Night-shift cookies'],['cape','Red cape'],['pole','Force pike'],['neat','Everything must be in a perfect line']]},
  {id:'mop3',name:'Cleaning droid MOP-3',image:'suspect-mop3',motive:'Cleans the Throne Room every night.',
   traits:[['neat','Very neat and tidy'],['pole','Long brush arm'],['oil','Oil drops'],['wheels','Wheels'],['beep','Beeps a lot']]}
];
export const culprit='rex';

// Order of play. Each puzzle unlocks one clue.
export const steps=['register','memory','matching','pattern','pipes','vault'];
export const puzzles={
  register:{title:'Your detective symbol',image:'puzzle-register',
    text:'Every Imperial Detective has a secret symbol. Draw any shape with one finger, in one line. Remember it well — what you draw and how you draw it. The Evidence Vault will ask for it at the end.'},
  memory:{title:'The Throne Room lights',image:'puzzle-lights',clue:'mud',
    text:'The Throne Room is dark. The light panel needs a code. Watch the symbols, then tap them in the same order. First 3, then 4, then 5.',
    symbols:['🎃','👻','🦇','💀','🕷️','🌙'],levels:[3,4,5],attempts:3},
  matching:{title:'The forensic droid',image:'puzzle-droid',clue:'cookie',
    text:'The forensic droid’s memory is scrambled. Match each description to the right thing. You can check only once.',
    pairs:[['Round and orange','🎃 Pumpkin'],['Best emperor in the galaxy','Emperor Palpatine'],['Flies at night, sleeps upside down','🦇 Bat'],['Breathes very loudly','Darth Vader'],['White armor, misses every shot','Stormtrooper'],['Sweet and round, with chocolate chips','🍪 Cookie']],
    decoys:['🍋 Lemon','🌙 Moon']},
  pattern:{title:'The security terminal',image:'puzzle-terminal',clue:'cape',
    text:'The security terminal is locked. Find the pattern and connect the symbols with one line. You have 3 tries.',
    cells:[['🏮','Lantern'],['🎃','Pumpkin'],['🦇','Bat'],['💡','Lightbulb'],['🕯️','Candle'],['💀','Skull'],['🍋','Lemon'],['🍭','Lollipop'],['🍁','Leaf']],
    answer:[0,3,6,7,8],attempts:3},
  pipes:{title:'MOP-3 has no power',image:'puzzle-mop3',clue:'neat',
    text:'The cleaning droid MOP-3 saw everything — but its power cable is broken. Tap pieces to turn them and connect the battery to the droid. When you press Ready, you have 10 seconds.',seconds:10,
    // Bit mask per tile: 1 = up, 2 = right, 4 = down, 8 = left. Battery enters (0,0) from the left; the droid is right of (3,3).
    solution:[[12,5,10,6],[3,10,12,5],[6,9,5,7],[11,14,3,10]]},
  vault:{title:'The Evidence Vault',image:'puzzle-vault',clue:'pole',
    text:'The Evidence Vault holds the last piece of evidence. Draw your detective symbol to open it. You have 3 tries.'}
};

export const clues={
  mud:{title:'Muddy boot prints',image:'clue-mud',trait:'mud',text:'The lights come on. On the floor: muddy boot prints, going straight to the pumpkin table.'},
  cookie:{title:'Cookie crumbs',image:'clue-cookie',trait:'cookie',text:'The forensic droid scans the floor: "Crumbs. Imperial chocolate-chip cookies. Very fresh."'},
  cape:{title:'Cape fibers',image:'clue-cape',trait:'cape',text:'The security camera saved one picture from 3:00 AM: fibers from a cape, caught on the edge of the table.'},
  neat:{title:'Everything perfectly straight',image:'clue-neat',trait:'neat',text:'MOP-3 beeps: "I did not clean tonight. But someone did. Every cup, every chair, every candle — polished and put in a perfect line."'},
  pole:{title:'A long, straight scratch',image:'clue-pole',trait:'pole',text:'Inside the vault: a photo of the table. A long, straight scratch — like from a pole or a stick.'}
};

export const reveal={
  title:'Case closed.',image:'reveal',
  text:'Royal Guard Rex was guarding the Throne Room at night. He saw that the Emperor\'s pumpkin was two millimetres off-centre. He could not stand it. He moved it. Then he polished the table. Then he moved it again.\n\nThe pumpkin did not survive the third time.\n\nThe Emperor has decided: Rex will guard the pumpkin patch on Hoth. Forever.',
  explain:'Rex is the only suspect with all five: muddy boots, cookies, a cape, a long pole (his force pike) and a need to keep everything in a perfect line. Vader had no pole and is not tidy. Tarkin has no muddy boots and no cape. Klynn has no cape, no pole and is not tidy. MOP-3 has no boots, no cookies and no cape.'
};
