import { ChatEntity } from "@/features/chat/entities/chat.entity";

export const MOCK_MESSAGES: ChatEntity = [
  {
    from: "user",
    message: "I want to watch an action movie with great fight scenes",
  },
  {
    from: "ai",
    message:
      'Entendido! Já que você assistiu "O Homem nas Trevas", tenho algumas ótimas sugestões de filmes que podem te interessar, todos com elementos de suspense e tensão:\n\n*   **Hush - A Morte Ouve**: Perfeito para quem gosta de um suspense psicológico intenso e um jogo de gato e rato. A protagonista surda e muda adiciona uma camada única de vulnerabilidade e engenhosidade à luta pela sobrevivência.\n*   **Um Lugar Silencioso**: Se você curte um terror com uma premissa original e muita tensão, este filme é excelente. A necessidade de silêncio absoluto cria uma atmosfera de suspense constante e arrepiante.\n*   **Corra!**: Uma escolha fantástica para quem busca um terror mais inteligente e com crítica social. Ele mistura suspense, mistério e elementos psicológicos de forma brilhante, garantindo uma experiência única.\n\nEsses filmes foram selecionados por suas narrativas envolventes e capacidade de prender a atenção. Gostaria de saber mais detalhes sobre algum deles ou tem alguma preferência específica?',
    movies: [
      {
        title: "Hush - A Morte Ouve",
        director: "Mike Flanagan",
        actors: [
          "Kate Siegel",
          "John Gallagher Jr.",
          "Michael Trucco",
          "Samantha Sloyan",
        ],
        releaseYear: 2016,
        streamingPlatform: "Netflix",
        imdbRating: 6.6,
        description:
          "Uma escritora surda e muda que vive isolada na floresta precisa lutar por sua vida quando um assassino mascarado aparece em sua janela.",
        durationInMinutes: 81,
      },
      {
        title: "Um Lugar Silencioso",
        director: "John Krasinski",
        actors: [
          "Emily Blunt",
          "John Krasinski",
          "Millicent Simmonds",
          "Noah Jupe",
        ],
        releaseYear: 2018,
        streamingPlatform: "Paramount+",
        imdbRating: 7.5,
        description:
          "Uma família é forçada a viver em silêncio absoluto para evitar criaturas misteriosas que caçam pelo som.",
        durationInMinutes: 90,
      },
      {
        title: "Corra!",
        director: "Jordan Peele",
        actors: [
          "Daniel Kaluuya",
          "Allison Williams",
          "Bradley Whitford",
          "Catherine Keener",
        ],
        releaseYear: 2017,
        streamingPlatform: "Telecine",
        imdbRating: 7.8,
        description:
          "Um jovem negro visita a propriedade da família de sua namorada branca e descobre um segredo perturbador por trás de sua aparente hospitalidade.",
        durationInMinutes: 104,
      },
    ],
  },
];
