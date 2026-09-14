import { LetterChapter, EasterEgg } from '../types';

export const LETTER_CHAPTERS: LetterChapter[] = [
  {
    id: 1,
    title: "Estrella 1 — El Comienzo",
    subtitle: "Un momento para detener el tiempo",
    icon: "⭐",
    text: [
      "Querido Jonathan:",
      "Hoy estoy muy contenta de tener la oportunidad de escribirte y de poder poner en palabras tantas emociones, recuerdos y sentimientos que aparecen cuando pienso en ti."
    ]
  },
  {
    id: 2,
    title: "Estrella 2 — El Hombre en el que te convertiste",
    subtitle: "Música, pasión y constancia",
    icon: "🎧",
    specialEffect: 'dj-evolution',
    text: [
      "En esta nueva vuelta al sol, me emociona mucho pensar en el hombre en el que te has convertido.",
      "Te veo haciendo lo que te gusta, haciendo música como DJ, siguiendo tus pasiones, cuidándote y también guiando al Moisés por el buen camino del ejercicio.",
      "Estoy muy orgullosa de ti, hermanito."
    ]
  },
  {
    id: 3,
    title: "Estrella 3 — Los Hermanos",
    subtitle: "El amor incondicional de nuestra familia",
    icon: "🤝",
    text: [
      "También me hace feliz saber que estás cerca de nuestros hermanos, que se tienen los unos a los otros, que se cuidan y siguen alimentando ese amor tan especial de esta familia loca que tenemos.",
      "Yo te pienso mucho y te extraño muchísimo."
    ]
  },
  {
    id: 4,
    title: "Estrella 4 — El Leoncito y Nuestros Papás",
    subtitle: "Dos luces eternas alumbrando tus pasos",
    icon: "✨",
    specialEffect: 'celestial-flight',
    text: [
      "A veces recuerdo cuando eras pequeño y siento que disfruté tanto esa etapa tuya.",
      "Para mí siempre vas a tener algo de ese leoncito de la familia, lleno de energía, personalidad y vida.",
      "Y también siento que mamá y papá siguen de alguna manera cerquita de ti, como dos angelitos acompañando tus pasos, cuidándote y alumbrándote el camino.",
      "Me imagino que, si pudieran verte hoy y ver en el hombre en el que te has convertido, estarían tan orgullosos de ti como lo estoy yo."
    ]
  },
  {
    id: 5,
    title: "Estrella 5 — El Futuro",
    subtitle: "Construyendo tu propia felicidad",
    icon: "🍁",
    specialEffect: 'leaves-canada',
    text: [
      "Espero de corazón que algún día puedas venir a verme aquí a Canadá y que podamos volver a compartir juntos.",
      "Y como decía la mamá, mi mayor deseo para ti es que seas feliz.",
      "Que pongas tu vida en manos de tu propia felicidad, que sigas escogiendo aquello que te haga bien y que nunca dejes de construir una vida que realmente se sienta tuya.",
      "Te quiero muchísimo, hermano."
    ]
  }
];

export const EASTER_EGGS_INITIAL: EasterEgg[] = [
  {
    id: 'dj',
    title: 'Audífonos de DJ 🎧',
    description: 'Tus mezclas, tu ritmo y esa pasión por la música que llena de energía cualquier lugar.',
    emoji: '🎧',
    x: 28,
    y: 3.5,
    found: false
  },
  {
    id: 'gym',
    title: 'Mancuerna de Entrenamiento 🏋️',
    description: 'La disciplina del ejercicio y cómo guías con cariño e inspiración al Moisés.',
    emoji: '🏋️',
    x: 62,
    y: 4.8,
    found: false
  },
  {
    id: 'lion',
    title: 'El Leoncito Dorado 🦁',
    description: 'Ese leoncito de la familia lleno de chispa, personalidad y un corazón gigante.',
    emoji: '🦁',
    x: 96,
    y: 6.2,
    found: false
  },
  {
    id: 'canada',
    title: 'Hoja de Arce Canadiense 🍁',
    description: 'El horizonte de Canadá esperándote para darnos ese abrazo pendiente y compartir juntos.',
    emoji: '🍁',
    x: 132,
    y: 7.0,
    found: false
  }
];
