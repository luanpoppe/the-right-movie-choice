export class MovieQueryExamplesPrompts {
  static QUERY_EXAMPLES_TEMPERATURE = 1.2;

  static text() {
    return MovieQueryExamplesPrompts.textForBatch(3, []);
  }

  static textForBatch(count: number, existingTexts: string[]) {
    const existingSection = MovieQueryExamplesPrompts.buildExistingTextsSection(
      existingTexts,
    );

    return `Crie exatamente ${count} exemplos curtos, naturais e criativos de buscas por filmes, séries, animes ou outras obras audiovisuais para serem exibidos como sugestões na landing page do The Right Movie Choice.

Todos os exemplos devem estar em inglês natural e devem parecer buscas que uma pessoa realmente escreveria ao procurar algo para assistir.

Crie exemplos variados entre si. Combine diferentes tipos de critérios, como:

* gênero;
* época;
* temática;
* clima ou atmosfera;
* características dos personagens;
* duração;
* estilo;
* contexto de quem vai assistir;
* tipo de experiência desejada.

Evite exemplos genéricos demais, como apenas "action movies" ou "good comedy movies".

Evite também buscas excessivamente específicas, artificiais ou longas.

Não repita a mesma estrutura mudando apenas gênero, década ou outro detalhe.

Cada exemplo deve representar uma intenção de busca claramente diferente das demais.

Os exemplos devem ser exclusivamente relacionados à descoberta ou escolha de algo para assistir.
${existingSection}
Não inclua explicações, comentários, numeração ou qualquer conteúdo adicional.

Retorne exatamente ${count} itens em queryExamples, cada um contendo um único campo queryExample.
`;
  }

  private static buildExistingTextsSection(existingTexts: string[]) {
    if (existingTexts.length === 0) {
      return "";
    }

    const listedTexts = existingTexts.map((text) => `- ${text}`).join("\n");

    return `
As sugestões abaixo já estão no pool — não repita, parafraseie nem gere variações mínimas delas:

${listedTexts}
`;
  }
}
