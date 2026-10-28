// "Night of Shadows" — every text the players and the host see. Simple English on purpose.
export const title='Night of Shadows';
export const lobby={image:'intro',title:'Night of Shadows',text:'Wait for the investigation to begin…'};

export const intro={image:'intro',eyebrow:'Station Wraith · Festival of Shadows',title:'Night of Shadows',
  text:'High above a dead, ruined planet, the old research station Wraith drifts in the dark. Tonight is the Festival of Shadows: glowfruit carved like masks of ancient dark lords, red emergency lights, space wind howling behind the windows.\n\nYou are an independent arbiter — a bounty hunter hired to keep the peace at the party.'};
export const cabin={image:'cabin',eyebrow:'The captain’s cabin',title:'Baron Malrec is dead.',
  text:'The Baron — an artefact dealer and a blackmailer — sits in his chair with a Festival mask of horror on his face.\n\nA cup of punch on the desk. Dark marks on his neck. A burned blaster hole in his chest. The heart stimulator in his chair has been hacked.\n\nFour guests were near the cabin. Nobody could leave through the airlock.'};

export const suspects={
  seraphine:{name:'Lady Seraphine',role:'A fallen noblewoman',image:'suspect-seraphine',
    motive:'The Baron ruined her noble house and sold her family treasures at auction.',
    alibi:'I only came to drink a toast to the end of his business, and I left. He was fine when I drank!'},
  medi7:{name:'MEDI-7 “Seven”',role:'A reprogrammed medical droid',image:'suspect-medi7',
    motive:'After the auction, the Baron planned to wipe its memory and sell it for parts.',
    alibi:'My protocols forbid harming living beings. I only tried to give him something to calm his breathing.'},
  corvin:{name:'Corvin',role:'Smuggler and pilot',image:'suspect-corvin',
    motive:'The Baron took his ship and threatened to hand him over to the Vorn cartel.',
    alibi:'Yes, we fought. My blaster went off by accident — into the wall — when he came at me with a knife!'},
  ysolde:{name:'Ysolde',role:'A dark mystic, a Night Witch of Draxa',image:'suspect-ysolde',
    motive:'The Baron stole her family’s ancient shadow relic — on the Festival night, of all nights.',
    alibi:'The spirits were restless tonight. I only put a curse of fear on him. I never touched him.'}
};
export const suspectOrder=['seraphine','medi7','corvin','ysolde'];

// The fixed circle: each suspect defends themselves and accuses the next one. The vote only picks who speaks first.
export const circle=['medi7','corvin','ysolde','seraphine'];
export const speeches={
  medi7:{defence:['My protocols forbid harming living beings. I only tried to calm his breathing.','I repeat: I did not harm him.'],
    accuse:['But Corvin — the Baron took his ship and threatened to hand him over to the Vorn cartel.','Corvin is lying.']},
  corvin:{defence:['We fought, okay? My blaster went off by accident — into the wall!','I told you — the shot hit the wall!'],
    accuse:['But Ysolde — the Baron stole her family relic on the Festival night. She wanted revenge.','Ask the witch.']},
  ysolde:{defence:['The spirits were restless. I only put a curse of fear on him. I never touched him.','A curse leaves no marks!'],
    accuse:['But Lady Seraphine — he ruined her house and sold her family treasures.','The lady is not as sweet as she looks.']},
  seraphine:{defence:['I only came to drink a toast, and I left. He was fine when I drank!','I told you, it was only a toast!'],
    accuse:['But that droid — the Baron wanted to wipe its memory and sell it for parts.','The droid is hiding something.']}
};
// What each accuser points at. Round 1 shows the first half of the evidence, round 2 the second.
export const evidence={
  corvin:['Look: his belt buckle is half melted.','The air smells of ozone — and there is a burn on the Baron’s robe from a small pocket blaster.'],
  ysolde:['Look at the Baron’s throat: even marks, as if an invisible hand crushed it.','And under his chair: grey ritual dust from Draxa.'],
  seraphine:['Look inside the carved glowfruit on the table: an empty vial of swamp worm venom.','And smell his punch: bitter almonds.'],
  medi7:['Look at the terminal log: a huge power spike, just before he died.','And this cable in his heart stimulator — it is MEDI-7’s own connector.']
};

export const votes={
  accuse1:{question:'Who do you accuse first?'},
  accuse2:{question:'Who do you accuse now?'},
  verdict:{question:'Your verdict: who killed Baron Malrec?',extra:[['none','None of them'],['all','All four of them']],tie:'none'}
};

export const reveal={image:'terminal',eyebrow:'The terminal comes back to life',title:'The last 15 minutes',
  text:'The station’s medical terminal gets full power again. It plays the chair’s biosensor record from the Baron’s last 15 minutes.',
  timeline:[
    ['seraphine','Lady Seraphine poured swamp worm venom into his punch. It paralysed him — he could not call the guards.'],
    ['medi7','MEDI-7 used the paralysis and loaded malware into his heart stimulator. His heart lost its rhythm.'],
    ['ysolde','Ysolde came in and crushed his throat with dark power. No more air.'],
    ['corvin','Corvin saw him thrashing in the half-dark, panicked, and shot him in the chest. His heart stopped.']],
  autopsy:'Cause of death: everything at once — poison, choking, electric shock and a blaster wound.',
  truth:'Each of them planned a murder for the Festival night, hoping the fog, the power cuts and the chaos would help them escape. None of them knew about the others.',
  ending:'The suspects look at each other in the red emergency light. All of them are murderers — and all of them know it.'};
export const verdictText={
  all:'You were right: all four of them.',
  none:'Nobody? Every one of them did it.',
  one:name=>`You named only ${name}. ${name} was one of four killers.`
};
