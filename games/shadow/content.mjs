// "Night of Shadows" — every text the players and the host see. Simple English on purpose.
export const title='Night of Shadows';
export const lobby={image:'intro',title:'Night of Shadows',text:'Wait for the investigation to begin…'};

export const intro={image:'intro',eyebrow:'Station Wraith · Festival of Shadows',title:'Night of Shadows',
  text:'High above a dead, ruined planet, the old research station Wraith drifts in the dark. Tonight is the Festival of Shadows: glowfruit carved like masks of ancient dark lords, red emergency lights, space wind howling behind the windows.\n\nYou are the Arbiters — a team of independent judges, hired to keep the peace at the party and to judge any crime on the station.'};
export const cabin={image:'cabin',eyebrow:'The captain’s cabin',title:'Baron Malrec is dead.',
  text:'The Baron — an artefact dealer and a blackmailer — sits in his chair with a Festival mask of horror on his face.\n\nA cup of punch on the desk. Dark marks on his neck. A burned blaster hole in his chest. The heart stimulator in his chair has been hacked.\n\nFour guests were near the cabin. Nobody could leave through the airlock.'};

// tag: one word for the vote tiles. traits: what the Arbiters know about them (shown on the suspect pages).
export const suspects={
  seraphine:{name:'Lady Seraphine',tag:'Alchemist',role:'A fallen noblewoman',image:'suspect-seraphine',action:'act-seraphine',
    traits:['Studied alchemy for years — she knows every poison in the galaxy.','Carries a jewelled flask everywhere.','The Baron ruined her noble house.'],
    motive:'The Baron ruined her noble house and sold her family treasures at auction.'},
  medi7:{name:'MEDI-7 “Seven”',tag:'Medical droid',role:'A reprogrammed medical droid',image:'suspect-medi7',action:'act-medi7',
    traits:['Can plug into any medical device — even a heart stimulator.','Knows the Baron’s body better than the Baron does.','Was going to be wiped and sold for parts.'],
    motive:'After the auction, the Baron planned to wipe its memory and sell it for parts.'},
  corvin:{name:'Corvin',tag:'Gunslinger',role:'Smuggler and pilot',image:'suspect-corvin',action:'act-corvin',
    traits:['The fastest hand with a pocket blaster on the station.','Panics easily in the dark.','The Baron took his ship.'],
    motive:'The Baron took his ship and threatened to hand him over to the Vorn cartel.'},
  ysolde:{name:'Ysolde',tag:'Night Witch',role:'A dark mystic from Draxa',image:'suspect-ysolde',action:'act-ysolde',
    traits:['Her dark power can crush a throat without a single touch.','Burns grey ritual dust from Draxa.','The Baron stole her family’s ancient relic.'],
    motive:'The Baron stole her family’s ancient shadow relic — on the Festival night, of all nights.'}
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
  accuse1:{title:'Who do you accuse first?',text:'Four guests, four reasons to hate the Baron. Choose who has to explain themselves first.',question:'Who do you accuse first?'},
  accuse2:{title:'Someone had to do it.',text:'Everyone has an alibi. But someone in this room killed the Baron. Who do you choose now?',question:'Who do you accuse now?'},
  verdict:{title:'It’s time for the final verdict.',text:'Based on the evidence — who will you arrest?',question:'Who will you arrest?',extra:[['none','None of them'],['all','All four of them']],tie:'none'}
};
// Slide shown after each accusation vote, before the circle of speeches.
export const accusedSlide={
  accuse1:name=>({eyebrow:'Accusation 1',title:`You accused ${name}.`,text:`Let’s hear what ${name} has to say.`}),
  accuse2:name=>({eyebrow:'Accusation 2',title:`Based on the evidence, you accuse ${name}.`,text:`And ${name} says…`})
};

export const reveal={image:'terminal',eyebrow:'The terminal comes back to life',title:'The last 15 minutes',
  text:'The station’s medical terminal gets full power again. It plays the chair’s biosensor record from the Baron’s last 15 minutes.',
  timeline:[ // images: the action shot of each suspect
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
