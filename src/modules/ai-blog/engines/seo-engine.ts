export interface SEOOptimizationParams {
  content: string;
  focusKeywords: string[];
  geoTarget?: { city?: string; state?: string; country?: string };
  title?: string;
  metaDescription?: string;
  slug?: string;
  featuredImage?: string;
  updatedAt?: Date | string;
}

export interface SEOReport {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "E";
  status: "Excellent" | "Strong" | "Moderate" | "Weak" | "Critical";
  intent: "Informational" | "Transactional" | "Navigational" | "Comparative";
  breakdown: {
    structure: number;
    content: number;
    semantics: number;
    readability: number;
    links: number;
    media: number;
    freshness: number;
    intentMatch: number;
  };
  positives: string[];
  negatives: string[];
}

export class SEOEngine {
  /**
   * Generates standard Schema.org Article JSON-LD
   */
  static generateArticleSchema(post: any) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      image: [post.featuredImage || post.seo?.ogImage],
      datePublished: post.publishedAt instanceof Date ? post.publishedAt.toISOString() : post.publishedAt,
      dateModified: post.updatedAt instanceof Date ? post.updatedAt.toISOString() : post.updatedAt,
      author: [{
        "@type": "Person",
        name: post.authorId || "I/O AI Platform",
      }],
      description: post.excerpt || post.seo?.metaDescription,
    };
  }

  /**
   * Generates LocalBusiness Schema.org JSON-LD for GEO SEO
   */
  static generateLocalBusinessSchema(geoTarget: NonNullable<SEOOptimizationParams["geoTarget"]>) {
    return {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      address: {
        "@type": "PostalAddress",
        addressLocality: geoTarget.city,
        addressRegion: geoTarget.state,
        addressCountry: geoTarget.country,
      },
    };
  }

  /**
   * Classifies user search intent based on focus keywords
   */
  static classifyIntent(keywords: string[]): "Informational" | "Transactional" | "Navigational" | "Comparative" {
    if (keywords.length === 0) return "Informational";
    const text = keywords.join(" ").toLowerCase();

    // Transactional indicators
    if (/\b(comprar|buy|preço|price|promoção|discount|cupom|coupon|loja|store|venda|sell|contratar)\b/i.test(text)) {
      return "Transactional";
    }
    // Comparative indicators
    if (/\b(vs|versus|melhor|best|diferença|comparison|comparativo|qual é o melhor|ou|or)\b/i.test(text)) {
      return "Comparative";
    }
    // Navigational indicators
    if (/\b(login|entrar|sign in|site oficial|official website|download|portal|app)\b/i.test(text)) {
      return "Navigational";
    }

    return "Informational";
  }

  /**
   * Calculates a complete weighted enterprise SEO report with transformations and penalties
   */
  static calculateSEOScore(params: SEOOptimizationParams): SEOReport {
    const content = params.content || "";
    const title = params.title || "";
    const metaDescription = params.metaDescription || "";
    const slug = params.slug || "";
    const focusKeywords = params.focusKeywords || [];

    const positives: string[] = [];
    const negatives: string[] = [];

    // Define weights
    const weights = {
      structure: 25,
      content: 25,
      semantics: 20,
      readability: 10,
      links: 10,
      media: 5,
      freshness: 5
    };

    // --- 1. Structure (Max: 25) ---
    let structureRaw = 0;
    
    // Title
    if (title.trim()) {
      structureRaw += 5;
      if (title.length >= 45 && title.length <= 65) {
        structureRaw += 5;
        positives.push("Título tem o tamanho ideal (45-65 caracteres).");
      } else {
        negatives.push("Título está muito curto ou muito longo (ideal: 45-65 caracteres).");
      }
      const hasKeywordInTitle = focusKeywords.some(k => title.toLowerCase().includes(k.toLowerCase()));
      if (hasKeywordInTitle) {
        structureRaw += 5;
        positives.push("Palavra-chave em foco encontrada no título.");
      } else if (focusKeywords.length > 0) {
        negatives.push("Palavra-chave em foco ausente no título.");
      }
    } else {
      negatives.push("Título da publicação está ausente.");
    }

    // Meta Description
    if (metaDescription.trim()) {
      structureRaw += 5;
      if (metaDescription.length >= 110 && metaDescription.length <= 160) {
        structureRaw += 5;
        positives.push("Meta description com tamanho ideal (110-160 caracteres).");
      } else {
        negatives.push("Meta description fora do tamanho recomendado (ideal: 110-160 caracteres).");
      }
    } else {
      negatives.push("Meta description ausente (ruim para taxa de clique na SERP).");
    }

    // Normalize Structure score to max 25
    const structureScore = Math.min((structureRaw / 25) * 25, 25);

    // --- 2. Content & Keyword Density Transformation (Max: 25) ---
    const cleanText = content.replace(/<[^>]*>/g, " ");
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    let contentRaw = 0;

    // Word Count Transformation
    if (wordCount >= 2000) {
      contentRaw += 15;
      positives.push(`Excelente profundidade de conteúdo (${wordCount} palavras).`);
    } else if (wordCount >= 1000) {
      contentRaw += 12;
      positives.push(`Bom tamanho de conteúdo (${wordCount} palavras).`);
    } else if (wordCount >= 300) {
      contentRaw += 8;
      positives.push(`Tamanho médio de conteúdo (${wordCount} palavras).`);
    } else {
      negatives.push(`Conteúdo muito curto (${wordCount} palavras). Tente escrever ao menos 300 palavras.`);
    }

    // Non-linear Keyword Density Transformation
    let density = 0;
    if (focusKeywords.length > 0 && wordCount > 0) {
      const keyword = focusKeywords[0].toLowerCase();
      const occurrences = (cleanText.toLowerCase().match(new RegExp(keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g')) || []).length;
      density = (occurrences / wordCount) * 100;

      // Transformation Ti(xi)
      if (density >= 0.5 && density <= 2.2) {
        contentRaw += 10;
        positives.push(`Densidade de keyword excelente (${density.toFixed(2)}%).`);
      } else if (density > 2.2 && density <= 4.0) {
        contentRaw += 5;
        negatives.push(`Densidade de keyword levemente alta (${density.toFixed(2)}%). Evite exageros.`);
      } else if (density > 4.0) {
        contentRaw += 0; // Stuffing penalty handled in negative scoring later
        negatives.push(`Possível Keyword Stuffing detectado (${density.toFixed(2)}%). Reduza o uso da palavra-chave.`);
      } else {
        negatives.push("Palavra-chave principal não encontrada no conteúdo.");
      }
    }

    const contentScore = Math.min(contentRaw, 25);

    // --- 3. Semantic Coverage (Max: 20) ---
    const semanticDictionary: { [key: string]: string[] } = {
      react: ["next.js", "ssr", "metadata", "sitemap", "canonical", "open graph", "structured data", "crawling"],
      seo: ["meta", "crawler", "index", "google", "keywords", "search console", "rank", "backlinks"],
      mindfulness: ["mental health", "meditation", "stress", "well-being", "focus", "anxiety", "peace"],
      developer: ["coding", "software", "git", "api", "framework", "deployment", "github", "testing"],
      marketing: ["sales", "conversion", "traffic", "leads", "analytics", "roi", "funnel", "customer"]
    };

    let matchedSemanticCount = 0;
    const lowerContent = cleanText.toLowerCase();

    focusKeywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      Object.keys(semanticDictionary).forEach(key => {
        if (lowerKeyword.includes(key)) {
          semanticDictionary[key].forEach(term => {
            if (lowerContent.includes(term)) matchedSemanticCount++;
          });
        }
      });
    });

    const maxExpectedSemantic = 5;
    const semanticCoverage = Math.min(matchedSemanticCount / maxExpectedSemantic, 1.0);
    const semanticScore = semanticCoverage * 20;

    if (semanticCoverage >= 0.8) {
      positives.push("Excelente relevância semântica e termos de co-ocorrência.");
    } else if (semanticCoverage >= 0.4) {
      positives.push("Boa cobertura de termos contextuais.");
    } else if (focusKeywords.length > 0) {
      negatives.push("Falta de termos semanticamente relacionados para dar autoridade tópica.");
    }

    // --- 4. Readability & Flow Heuristics (Max: 10) ---
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
    let readabilityScore = 0;

    if (avgSentenceLength > 0 && avgSentenceLength <= 20) {
      readabilityScore = 10;
      positives.push("Frases curtas e objetivas, excelente legibilidade.");
    } else if (avgSentenceLength > 20 && avgSentenceLength <= 28) {
      readabilityScore = 6;
      positives.push("Legibilidade razoável. Tente pontuar sentenças mais vezes.");
    } else if (avgSentenceLength > 28) {
      readabilityScore = 2;
      negatives.push("Frases muito longas detectadas. Tente dividi-las para facilitar a leitura.");
    }

    // --- 5. Links & Interlinking (Max: 10) ---
    let linksScore = 0;
    const hasLinks = /href=/i.test(content) || /http/i.test(content);
    if (hasLinks) {
      const hasInternal = /href=["']\//i.test(content);
      const hasExternal = /href=["']http/i.test(content);
      if (hasInternal && hasExternal) {
        linksScore = 10;
        positives.push("Excelente mix de links internos e links externos de autoridade.");
      } else if (hasInternal) {
        linksScore = 6;
        positives.push("Possui links internos saudáveis.");
        negatives.push("Tente adicionar ao menos um link externo de referência.");
      } else {
        linksScore = 5;
        positives.push("Possui links externos de referência.");
        negatives.push("Tente adicionar ao menos um link interno para reter o usuário.");
      }
    } else {
      negatives.push("Nenhum link interno ou externo no documento.");
    }

    // --- 6. Media Optimization (Max: 5) ---
    let mediaScore = 0;
    const hasImages = /<img/i.test(content) || !!params.featuredImage;
    if (hasImages) {
      mediaScore += 3;
      const imageCount = (content.match(/<img/gi) || []).length;
      const altCount = (content.match(/alt=["'][^"']/gi) || []).length;
      if (imageCount === 0 || altCount >= imageCount) {
        mediaScore += 2;
        positives.push("Todas as imagens possuem atributos alternativos (ALT).");
      } else {
        negatives.push("Algumas imagens estão sem descrição de acessibilidade (ALT).");
      }
    } else {
      negatives.push("Nenhuma imagem adicionada. Conteúdos visuais engajam mais.");
    }

    // --- 7. Freshness (Max: 5) ---
    let freshnessScore = 0;
    const currentYear = new Date().getFullYear().toString();
    const hasCurrentYear = cleanText.includes(currentYear) || title.includes(currentYear);
    
    if (hasCurrentYear) {
      freshnessScore += 3;
      positives.push(`Conteúdo atualizado com menção ao ano corrente (${currentYear}).`);
    }
    
    const updated = params.updatedAt ? new Date(params.updatedAt) : new Date();
    const daysSinceUpdate = (new Date().getTime() - updated.getTime()) / (1000 * 3600 * 24);
    if (daysSinceUpdate <= 30) {
      freshnessScore += 2;
      positives.push("Publicação recentemente atualizada.");
    } else {
      negatives.push("Esta publicação não é atualizada há algum tempo.");
    }

    // --- Intent Match & Intent Detection ---
    const intent = this.classifyIntent(focusKeywords);
    let intentMatchBonus = 0;

    if (intent === "Transactional") {
      // Transactional expects buying elements
      if (/\b(preço|compre|garanta|oferta|adquira|shop|botão|comprar|desconto)\b/i.test(lowerContent)) {
        intentMatchBonus = 5;
        positives.push("Alinhamento excelente com intenção de busca Transacional.");
      } else {
        negatives.push("Palavra-chave transacional, mas o conteúdo carece de CTA de compra/preço.");
      }
    } else if (intent === "Comparative") {
      // Comparative expects vs, comparisons, tables
      if (/\b(vs|comparado|tabela|diferença|melhor|prós|contras)\b/i.test(lowerContent)) {
        intentMatchBonus = 5;
        positives.push("Alinhamento excelente com intenção de busca Comparativa.");
      } else {
        negatives.push("Palavra-chave comparativa, mas o conteúdo carece de tabelas ou prós/contras.");
      }
    } else {
      intentMatchBonus = 5; // Default Informational Match
    }

    // --- Aggregate Formula (Weighted Sum) ---
    const weightedSum =
      structureScore +
      contentScore +
      semanticScore +
      readabilityScore +
      linksScore +
      mediaScore +
      freshnessScore;

    let finalScore = Math.round(weightedSum);

    // --- 8. Penalties (Negative Scoring) ---
    if (density > 5.0) {
      finalScore -= 20; // Heavy stuffing penalty
      negatives.push("PENALIDADE: Keyword Stuffing crítico detectado! (-20 pontos)");
    }
    if (!title.trim()) {
      finalScore -= 10;
    }
    if (!metaDescription.trim()) {
      finalScore -= 8;
    }
    const hasH1 = /<h1/i.test(content) || title.trim().length > 0;
    if (!hasH1) {
      finalScore -= 10;
      negatives.push("PENALIDADE: H1 ausente na estrutura do artigo. (-10 pontos)");
    }

    // Keep score inside bounds
    finalScore = Math.max(0, Math.min(finalScore, 100));

    // --- Grade System ---
    let grade: "A+" | "A" | "B" | "C" | "D" | "E" = "E";
    let status: "Excellent" | "Strong" | "Moderate" | "Weak" | "Critical" = "Critical";

    if (finalScore >= 90) {
      grade = "A+";
      status = "Excellent";
    } else if (finalScore >= 75) {
      grade = "A";
      status = "Strong";
    } else if (finalScore >= 60) {
      grade = "B";
      status = "Moderate";
    } else if (finalScore >= 40) {
      grade = "C";
      status = "Weak";
    } else if (finalScore >= 20) {
      grade = "D";
      status = "Weak";
    }

    return {
      score: finalScore,
      grade,
      status,
      intent,
      breakdown: {
        structure: Math.round(structureScore),
        content: Math.round(contentScore),
        semantics: Math.round(semanticScore),
        readability: Math.round(readabilityScore),
        links: Math.round(linksScore),
        media: Math.round(mediaScore),
        freshness: Math.round(freshnessScore),
        intentMatch: intentMatchBonus
      },
      positives: positives.slice(0, 5), // Return top 5 positives
      negatives: negatives.slice(0, 5)  // Return top 5 negatives
    };
  }
}
