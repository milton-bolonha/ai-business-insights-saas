import { describe, it, expect } from "vitest";
import { SEOEngine } from "./seo-engine";

describe("SEOEngine (Motor de Pontuação SEO)", () => {
  it("deve classificar a intenção de busca com base nas palavras-chave", () => {
    expect(SEOEngine.classifyIntent(["comprar react curso"])).toBe("Transactional");
    expect(SEOEngine.classifyIntent(["preço da mentoria"])).toBe("Transactional");
    expect(SEOEngine.classifyIntent(["react vs vue"])).toBe("Comparative");
    expect(SEOEngine.classifyIntent(["melhor framework de front-end"])).toBe("Comparative");
    expect(SEOEngine.classifyIntent(["login no painel admin"])).toBe("Navigational");
    expect(SEOEngine.classifyIntent(["como criar um blog com nextjs"])).toBe("Informational");
  });

  it("deve gerar o Schema.org de Artigo corretamente", () => {
    const post = {
      title: "Artigo de Teste",
      excerpt: "Breve resumo do artigo",
      featuredImage: "https://example.com/image.jpg",
      publishedAt: new Date("2026-05-01T12:00:00.000Z"),
      updatedAt: new Date("2026-05-15T12:00:00.000Z"),
      authorId: "Milton Bolonha",
    };

    const schema = SEOEngine.generateArticleSchema(post);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Article");
    expect(schema.headline).toBe(post.title);
    expect(schema.author[0].name).toBe("Milton Bolonha");
  });

  it("deve gerar Schema de Negócio Local para GEO SEO", () => {
    const geo = { city: "São Paulo", state: "SP", country: "Brasil" };
    const schema = SEOEngine.generateLocalBusinessSchema(geo);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("LocalBusiness");
    expect(schema.address.addressLocality).toBe("São Paulo");
  });

  it("deve calcular pontuação de SEO excelente para conteúdos ricos e bem estruturados", () => {
    const richContent = SEOEngine.calculateSEOScore({
      title: "Como estruturar um projeto Next.js com as melhores práticas de SEO",
      metaDescription: "Guia completo passo a passo sobre como configurar metadados, sitemap e schema markup em sua aplicação Next.js corporativa.",
      content: `
        <h1>Next.js e SEO</h1>
        <p>Next.js é um framework React fantástico para criar sites rápidos e otimizados para mecanismos de busca.</p>
        <p>Ao utilizar index, crawler, meta e google, nós conseguimos atingir as melhores colocações.</p>
        <p>Frases curtas ajudam bastante. O texto precisa ter links para referência interna e externa como <a href="https://google.com">Google</a>.</p>
        <p>Tente adicionar imagens para engajar mais os leitores. Este conteúdo é atualizado em 2026.</p>
      `,
      focusKeywords: ["react", "seo"],
      featuredImage: "https://example.com/seo.jpg",
      updatedAt: new Date(),
    });

    expect(richContent.score).toBeGreaterThan(60);
    expect(richContent.grade).toBeTypeOf("string");
    expect(richContent.breakdown.structure).toBeGreaterThan(0);
    expect(richContent.breakdown.content).toBeGreaterThan(0);
  });

  it("deve aplicar penalidade em caso de Keyword Stuffing", () => {
    // Generate text with heavy repetition of the focus keyword "react"
    const spamWords = Array(150).fill("react.").join(" "); // Adiciona pontos para encurtar sentenças
    const fillerWords = Array(200).fill("artigo.").join(" "); // Garante mais de 300 palavras
    
    const report = SEOEngine.calculateSEOScore({
      title: "Curso Completo de React para Iniciantes na Web",
      metaDescription: "Aprenda React do zero com este guia completo passo a passo contendo exemplos práticos de componentes, hooks e roteamento.",
      content: `<h1>React</h1> <p>${spamWords} ${fillerWords} <a href="/react">interno</a> <a href="https://react.dev">externo</a> <img alt="react logo" /></p>`,
      featuredImage: "https://example.com/logo.jpg",
      focusKeywords: ["react"],
      updatedAt: new Date(),
    });

    expect(report.negatives).toContain("PENALIDADE: Keyword Stuffing crítico detectado! (-20 pontos)");
  });
});
