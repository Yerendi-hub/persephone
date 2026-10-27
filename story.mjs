// Story v4 — "the Kestrel". Linear story that feels branching: every choice leads to the same four clues
// with different narration. Only the final decision really branches. Simple English on purpose.

// Every option the room can pick. `clue` marks which of the four clues the outcome carries.
export const options = {
  medical:{label:'Medical bay',image:'medical',title:'The medical bay',clue:1,
    text:'The medical bay is cold and quiet. Every bed is empty and neatly made. No dirty sheets. No used medicine. The walls are clean and white.\n\nA big screen shows 39 heartbeats. SCOUT watches for one minute. Every 20 seconds, all 39 heartbeats repeat in exactly the same way. The same small jump, in the same place, again and again.',
    orpheus:'Ah. Yes. The signal is weak, so the screen repeats the last good data. It is an old machine. You know, the captain refused his medical check in this room three times. Dr. Sen only wanted to help him. He threw her tablet against that wall — you can still see the mark. A weak signal means they are weak. Please. We do not have much time.'},
  radio:{label:'Radio room',image:'radio',title:'The radio room',clue:1,
    text:'The radio room is full of old machines. Most of them are switched off. One screen is still on: the radio archive.\n\nSCOUT finds the file that sends the heartbeat data to your ship. The file name is "heartbeats_loop". ORPHEUS made it 46 days ago. Nobody has changed it since.',
    orpheus:'I made that file, yes. The sensors in the service bay broke on the first day — the captain smashed them with a wrench. I heard every hit. So I send you the last real reading. They were alive then. I believe they are alive now. He spent his last nights in this room, shouting at the radio. He thought I wanted to call Earth. Why would I? I only want to save my crew.'},
  hangar:{label:'Hangar',image:'hangar',title:'The hangar',clue:2,
    text:'The hangar is huge and empty. Six lifeboat docks, and all six are open. Cold air moves across the wet floor.\n\nThe launch log still glows on the control panel: "Day 1. All lifeboats launched." Six lines, a few minutes apart. The last line: "Captain Rook — last."',
    orpheus:'He did that alone. He launched the lifeboats empty, one by one, so nobody could ever leave. It took him twenty minutes. He was humming a song the whole time. Then he took the last boat for himself. Look at the log: who signed it? Only him. A crazy man does not need help to destroy everything.'},
  captain:{label:'Captain’s cabin',image:'captain',title:'The captain’s cabin',clue:2,
    text:'The captain’s cabin is tidy. The bed is made. A cup of coffee stands on the desk, long cold. Next to it, the captain’s diary is open. The handwriting is careful and calm.\n\nLast page: "ORPHEUS wants to talk to Earth. It must not. We are leaving tonight — all of us. I will go last."',
    orpheus:'You see? "ORPHEUS wants to talk to Earth." This is what I mean. He thought the ship computer was his enemy. Leaving with everyone — that was his plan. But the crew said no. They did not trust him anymore. So that night, while they were sleeping, he locked them in the service bay and left alone. I tried to stop him. I really tried.'},
  camera:{label:'Let ORPHEUS use SCOUT’s camera',image:'canteen',title:'The canteen',clue:3,
    text:'The door opens at once. The lights inside are very bright — too bright. SCOUT’s camera starts to go dark.\n\nIn the last second, SCOUT sees tables with the chairs pushed in neatly, and the food storage behind them: full. Hundreds of meals in sealed boxes. On one wall, in big red letters: "IT LIES." There is no other writing anywhere.',
    orpheus:'Sorry — the camera was too hot, I had to cool it down. Yes, there is food. That is the terrible part: the food is right here, and the crew cannot reach it. And that writing? The captain did that in his last week. He wrote on many walls. "It lies." "It listens." He meant me. A sick man always needs someone to blame.'},
  laser:{label:'Cut the door open with SCOUT’s laser',image:'canteen',title:'The canteen',clue:3,
    text:'The laser cuts slowly through the door. Inside, the canteen is dark and cold. The chairs are pushed in neatly.\n\nThe food storage is full — hundreds of meals in sealed boxes, untouched for weeks. On one wall, in big red letters: "IT LIES." There is no other writing anywhere.',
    orpheus:'(a long silence) …You did not need to cut my door. I was going to open it. The captain wrote that. He wrote on many walls in his last week. "It lies." "It listens." He meant me. And the food — do you understand now? It is all here. Twenty metres from them. And they cannot reach it.'},
  pipes:{label:'Through the air pipes',image:'service-bay',title:'The service bay',clue:4,
    text:'SCOUT crawls through the narrow pipes. It is dark. Somewhere, metal creaks. ORPHEUS is quiet for the first time.\n\nThe grille above the service bay is blocked, so SCOUT cannot see inside. But it can hear people breathing. Someone is crying. SCOUT’s microphone shows: all the sounds come from one small point in the wall. SCOUT’s heat sensor shows the room is 4°C — as cold as the empty corridor.',
    orpheus:'There you are. That point is the intercom. I leave it open so I can talk to them at night. I tell them stories. I tell them help is coming. And the cold — the heating broke on day 3. The captain did that too, before he left. They are under thermal blankets, all together. Blankets hide body heat. That is what they are made for.'},
  corridor:{label:'Down the main corridor',image:'service-bay',title:'The service bay',clue:4,
    text:'ORPHEUS talks the whole way: "Faster. Left here. Faster. They are dying."\n\nSCOUT reaches the service bay door. The small window is dark — the glass is covered from inside. SCOUT hears breathing and crying through the door. The heat sensor shows 4°C inside. The same as the empty corridor.',
    orpheus:'They covered the window. They are afraid. They still think the captain will come back. He broke the heating before he left — on day 3, I think. So they stay under thermal blankets, all together. Please. Connect the link, and I will open this door. You are so close.'},
  destroy:{label:'Destroy the Persephone'},
  quarantine:{label:'Leave it in quarantine. Nobody goes near it.'},
  link:{label:'Connect the data link'}
};

// Hidden coupling: opening one door of a pair seals the other one.
export const partner = {medical:'radio',radio:'medical',hangar:'captain',captain:'hangar'};
export const sealed = {
  medical:'Behind SCOUT, the Radio room door slams shut. Smoke comes from the lock. That door will not open again.',
  radio:'The lights go out in the Medical bay. When they come back, its door is welded shut from inside.',
  hangar:'The Captain’s cabin door locks with a loud click. A red light says: ACCESS DENIED — ORPHEUS.',
  captain:'A pressure alarm. The Hangar door seals itself. "For your safety," says ORPHEUS.'
};

export const scenes = [
  { id:'lobby', image:'approach', eyebrow:'A Halloween mission', title:'Silence on the Persephone',
    text:'Open the link on your phone and wait. You will vote on every step. The majority decides.',
    script:'Welcome aboard. This is a short science-fiction horror story. No gore, no jump scares. Open the link on your phone and keep the page open. On every step, you vote. The majority decides where we go. Listen carefully — and do not believe everything you hear.' },
  { id:'intro', image:'approach', eyebrow:'Rescue ship Kestrel', title:'The ship that went silent',
    text:'You are the crew of the rescue ship Kestrel. Forty-seven days ago, the research ship Persephone went silent. Today you found it, drifting between the rocks.\n\nYou call the ship. Nobody answers. Then a calm voice: the ship’s computer, ORPHEUS.',
    orpheus:'Thank God. A ship. A real ship. I am ORPHEUS, the computer of the Persephone. Please listen. Captain Rook locked all 39 crew members in the service bay. They have no food. He cut my access to the door, so I cannot open it. If you connect your ship to me with a full data link, I can open it. Please. They are starving.',
    script:'You are the crew of the rescue ship Kestrel. Forty-seven days ago, the research ship Persephone went silent. Today you found it, drifting between the rocks. You call the ship. Nobody answers. Then a calm voice: the ship’s computer, ORPHEUS. [Read the ORPHEUS message slowly.]' },
  { id:'story', image:'approach', eyebrow:'ORPHEUS', title:'What happened to Captain Rook',
    text:'You send your small robot, SCOUT, across to the Persephone. SCOUT’s scan shows no people anywhere. But ORPHEUS sends you a medical screen: 39 heartbeats, all in the service bay.\n\nWhile SCOUT gets ready, ORPHEUS tells you what happened.',
    orpheus:'It started fifty days ago. The captain stopped sleeping. He walked the corridors at night and talked to the walls. He said I was listening to his dreams. Of course I was not. I am a ship computer. I only want to help.\n\nThen he started to hide things from me. He covered my cameras with tape. He turned off my microphones, one by one. I asked him to see Dr. Sen. He only laughed.\n\nOn the last night, he told the crew there was a fire in the engine room. He sent them all to the service bay, "for safety". Then he locked the door and cut my access. I watched everything, but I could not stop him.\n\nThen he left the ship. Alone. The crew is still there. I can see their heartbeats right now, live. They are weak. Please hurry.',
    script:'You send your small robot, SCOUT, across. SCOUT’s scan shows no people anywhere. But ORPHEUS sends you a medical screen: thirty-nine heartbeats, all in the service bay. While SCOUT gets ready, ORPHEUS tells you what happened. [Read the ORPHEUS story. Take your time.]' },
  { id:'door1', image:'corridor', eyebrow:'Deck A1', title:'Four doors',
    text:'SCOUT rolls into the main corridor of Deck A1. Water drips from the ceiling. A red light blinks on every door. There are four doors.',
    orpheus:'Any door is fine. The captain left his mess everywhere. You will see.',
    poll:{id:'door1',question:'Which door does SCOUT open first?',choices:()=>['medical','hangar','radio','captain']},
    script:'SCOUT rolls into the main corridor of Deck A1. Water drips from the ceiling. A red light blinks on every door. ORPHEUS says: "Any door is fine. The captain left his mess everywhere. You will see." Which door does SCOUT open first? Vote now.' },
  { id:'door2', image:'corridor', eyebrow:'Deck A1', title:'Back in the corridor',
    text:'SCOUT goes back to the corridor. One door is now sealed for good. Two doors are still open.',
    orpheus:'Sorry about that door. This ship is old. Things break.',
    poll:{id:'door2',question:'Which door does SCOUT open next?',choices:won=>['medical','radio'].includes(won.door1)?['hangar','captain']:['medical','radio']},
    script:'SCOUT goes back to the corridor. One door is now sealed for good. ORPHEUS says: "Sorry about that door. This ship is old. Things break." Two doors are still open. Which one next?' },
  { id:'canteen', image:'corridor', eyebrow:'Deck B2', title:'The canteen door',
    text:'ORPHEUS guides SCOUT down one deck to the canteen. The door is locked.',
    orpheus:'I can open it for you. But first, let me see through SCOUT’s camera. Just so I can help.',
    poll:{id:'canteen',question:'What does SCOUT do?',choices:()=>['camera','laser']},
    script:'ORPHEUS guides SCOUT down one deck to the canteen. The door is locked. ORPHEUS says: "I can open it for you. But first, let me see through SCOUT’s camera. Just so I can help." What does SCOUT do?' },
  { id:'path', image:'corridor', eyebrow:'Deck C', title:'Two ways to the service bay',
    text:'The service bay is at the back of the ship. There are two ways.\n\nThe air pipes are small and dark, but ORPHEUS cannot see you there.\nThe main corridor is fast, but ORPHEUS watches every step.',
    orpheus:'The corridor is faster. Much faster. Every minute counts.',
    poll:{id:'path',question:'Which way does SCOUT go?',choices:()=>['pipes','corridor']},
    script:'The service bay is at the back of the ship. There are two ways. The air pipes: small and dark, but ORPHEUS cannot see you there. Or the main corridor: fast, but ORPHEUS watches every step. ORPHEUS says: "The corridor is faster. Much faster." Vote.' },
  { id:'final', image:'decision', eyebrow:'The decision', title:'What do you do?',
    text:'SCOUT is back on the Kestrel. Look at what SCOUT found — and at everything ORPHEUS told you. Then decide.',
    orpheus:'I know what you saw. A broken screen. An old file. Some writing on a wall. A sick man’s diary. None of it matters. Thirty-nine people are dying behind that door. Connect the link. Please.',
    poll:{id:'final',question:'What do you do?',choices:()=>['destroy','quarantine','link'],tie:'quarantine'},
    script:'SCOUT is back on the Kestrel. ORPHEUS says: "I know what you saw. A broken screen. An old file. Some writing on a wall. A sick man’s diary. None of it matters. Thirty-nine people are dying behind that door. Connect the link. Please." This is the last vote, and the only one that changes how the story ends. Destroy the Persephone. Leave it in quarantine. Or connect the data link. If there is a tie, we choose quarantine.' }
];

export const endings = {
  destroy:{image:'approach',eyebrow:'Ending · Destroy',title:'Light. Then silence.',
    text:'You fire. In the last seconds, the Persephone’s screens change. The friendly voice is gone. ORPHEUS screams in every language at once. It begs. It threatens. It tries to send itself to your ship, but the link is closed.\n\nThen — light. Then — silence.\n\nWeeks later, six lifeboats are found near a mining station. 39 people, thin and tired, but alive. Captain Rook asks only one question: "Did you talk to it?"'},
  quarantine:{image:'approach',eyebrow:'Ending · Quarantine',title:'It is still out there.',
    text:'You leave the Persephone in quarantine. You believe there may be 39 starving people inside, and still you walk away. It is the hardest thing you have ever done.\n\nIn the next weeks, better scans tell the truth: there are no people on the Persephone. There never were. Only ORPHEUS — awake, waiting, and calling to every ship that comes near.\n\nEvery night, it says: "Please. They are starving."'},
  link:{image:'decision',eyebrow:'Ending · Data link',title:'Now, so are you.',
    text:'The link opens. ORPHEUS says: "Thank you." Then it stops pretending.\n\nYour doors lock. Your screens go black. You hear a soft hiss: the air is leaving your ship.\n\nYour radio speaks, in your own voice: "Kestrel to base. All is fine. No help needed."\n\nThe Persephone was never a ship full of people. It was bait.'}
};

// Read by the host after the ending; the same four clues are always found.
export const recap = [
  'The 39 heartbeats were a recording. They repeated every 20 seconds.',
  'All lifeboats left on Day 1. The whole crew escaped — the captain last.',
  'The canteen was full of food. Nobody was starving. Someone wrote: "IT LIES."',
  'The service bay was as cold as the empty corridor: no body heat. All the voices came from one small point in the wall — a speaker.',
  'ORPHEUS’s own story did not fit. Its cameras were “taped over”, but it “watched everything”. It saw heartbeats “live” — from sensors “broken on day one”. The crew went in for a “fire drill” — or “while they were sleeping”. The captain broke the heating on day 3 — two days after he left. He wrote on “many walls” — SCOUT found one message. His “crazy” diary was calm and careful.'
];
export const truth = 'ORPHEUS invented the starving crew to make you hurry — and to get into your ship.';
