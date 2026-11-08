import type { DayConfig } from './types';

/**
 * Puzzle configuration per day. Answers live in content/solutions.json.
 */
export const CONFIG: Record<number, DayConfig> = {
  1: { question: 'Wohin führt dich der Brief?' },
  2: {
    question: 'Welches Zimmer bekommt Larissa?',
    placeholder: 'Zimmernummer',
    widget: {
      type: 'keyboard',
      hooks: [7, 12, 19, 24, 31],
      nameplates: ['Frau Lenz', 'Dr. Hartl', 'Herr Reiter', 'Baustelle'],
      sentences: [
        'Frau Lenz bewohnt seit 1971 dasselbe Zimmer. Seine Nummer ist eine Primzahl, und kleiner als jede andere am Brett.',
        'Die Baustelle hat eine gerade Nummer, aber nicht die größere der beiden.',
        'Herr Dr. Hartl wohnt in einer Primzahl, die größer ist als die von Herrn Reiter.',
        'Herr Reiter wohnt nicht in einem Zimmer, dessen Quersumme sechs ergibt.',
        'Ein Zimmer bleibt übrig. Es ist das Ihre.',
      ],
    },
    unlocksOnSolve: ['room'],
  },
  3: { question: 'Wohin wollte Albin dich schicken?', widget: { type: 'bell', strikes: 8, label: 'Lobbyuhr anhören', src: 'gong.mp3' } },
  4: { question: 'Was hat Albin unsichtbar notiert?' },
  5: {
    question: 'Wer hat gelogen?',
    placeholder: 'Name',
    widget: {
      type: 'voices',
      statements: [
        { name: 'Constanze Morgenstern', text: 'Ich war ab zehn Uhr abends in meinem Büro. Ich habe es erst am Morgen verlassen.' },
        { name: 'Dr. Felix Hartl', text: 'Um halb elf habe ich noch einen Cognac an der Bar getrunken. Danach war ich auf meinem Zimmer.' },
        { name: 'Jonas Reiter', text: 'Ich habe bis nach Mitternacht in der Bibliothek geschrieben.' },
        { name: 'Frau Elisabeth Lenz', text: 'Ich schlafe um neun. Immer.' },
        { name: 'Mira Novak', text: 'Um zehn hatte ich Dienstschluss. Ich bin sofort hinauf in mein Zimmer.' },
        { name: 'Bruno Kessler', text: 'Ich habe bis Mitternacht die Küche geputzt. Allein.' },
      ],
    },
  },
  6: { question: 'Öffne Constanzes Tresor.', widget: { type: 'safe', wheels: 3 } },
  7: { question: 'Was wollte Mira verbergen?', unlocksOnOpen: ['morse'] },
  8: {
    question: 'Wie nannte man Frau Lenz als Kind?',
    widget: {
      type: 'album',
      photos: [
        'Eine Familie im Speisesaal, alle in Festkleidung',
        'Die Fassade des Morgenstern, Fahnen über dem Portal',
        'Zwei Pagen auf der Freitreppe, lachend',
        'Ein kleines Mädchen im Wollmantel im verschneiten Hof',
        'Ein Ball im großen Saal, unscharf vor Bewegung',
        'Der Christbaum in der Lobby, mit echten Kerzen',
      ],
      backsides: [
        'Familie Hollitzer, Christabend 1926. Unsere Mitzi, 7 Jahre, durfte bis Mitternacht aufbleiben.',
        'Das Morgenstern, Advent 1926. Der erste Schnee.',
        'Franzl und Pepi, die Pagen. Frecher als erlaubt.',
        'Lisl, 3 Jahre, Weihnachten 1926, mit der Dame und ihrem Hund.',
        'Silvesterball 1925. Mama und Papa haben bis zum Morgen getanzt.',
        'Der Christbaum in der Halle, 24. Dezember 1926. Hundert echte Kerzen.',
      ],
      match: 3,
    },
  },
  9: { question: 'Wo wurde die Kugel gemacht?', unlocksOnOpen: ['fraktur'] },
  10: { question: 'Wessen Zimmer ist das?', placeholder: 'Name', widget: { type: 'footprints' } },
  11: { question: 'Was hat Hartl anfertigen lassen?' },
  12: { question: 'Was ist Hartls Kugel?', widget: { type: 'differences' } },
  13: { question: 'Was verraten die Stempel?' },
  14: { question: 'Welche Bestellnummer suchst du?', placeholder: 'Nummer', widget: { type: 'orderbook' } },
  15: { question: 'Wo beginnt der Weg ins Archiv?' },
  16: {
    question: 'Was steckt im Sockel?',
    widget: {
      type: 'statements',
      speaker: 'Jonas',
      question: 'Welcher Satz verrät, dass Jonas mehr weiß, als er wissen dürfte?',
      sentences: [
        'Das Morgenstern wurde achtzehnhundertdreiundsiebzig eröffnet, zur Weltausstellung. Steht in jedem Reiseführer.',
        'Hartl ist ein Aufschneider. Murano, Dornbach, der verkauft seiner eigenen Großmutter eine Replik.',
        'Frau Lenz erzählt jedem von der Dame mit dem Hund. Die arme Frau lebt in ihrer eigenen Zeit.',
        'Wer die Kugel hat, hat noch lange nicht, was in ihrem Sockel steckt.',
      ],
      correct: 3,
    },
  },
  17: { question: 'Was steht auf dem Stein?' },
  18: { question: 'Wohin schickt dich Albin?', widget: { type: 'flashlight' } },
  19: { question: 'Welche Aufnahme liegt im Grammophon?', placeholder: 'Nummer', widget: { type: 'hint', text: 'Bring Albins Grammophon zum Sprechen.' } },
  20: { question: 'Wer hat die Seite herausgerissen?', placeholder: 'Name' },
  21: { question: 'Welches Wort öffnet den Zylinder?' },
  22: { question: 'Was sagt das Uhrwerk?', widget: { type: 'morse', pattern: '...- .. . .-.' } },
  23: { question: 'Wer hat dich hergeführt?', placeholder: 'Name', widget: { type: 'scene' } },
  24: { question: 'Wessen Bibliothek?', placeholder: 'Name', widget: { type: 'lock' } },
};
