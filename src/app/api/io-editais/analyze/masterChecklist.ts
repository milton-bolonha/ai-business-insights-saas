export const MASTER_CHECKLIST = `
# CHECKLIST MESTRE DEFINITIVO DE ANÁLISE DE EDITAIS (IA + OPERAÇÃO + COMERCIAL + JURÍDICO)

---
# 1. Identificação do Processo
Extrair: Modalidade, Número do Processo, Número do Pregão, Número da Dispensa, UASG, Plataforma, Portal, Processo Administrativo, Data de Publicação, Data da Sessão, Hora da Sessão.

# 2. Órgão Comprador
Extrair: Órgão Gerenciador, Órgãos Participantes, Município, Estado, Esfera (Federal, Estadual, Municipal), CNPJ.

# 3. Tipo de Contratação
Extrair: Compra imediata, Ata de Registro de Preços, Contrato continuado, Fornecimento parcelado, Fornecimento único.

# 4. Objeto
Extrair: Objeto resumido, Objeto completo, Categoria, Subcategoria (ex: Software, Equipamentos, Material de escritório, Serviços, Obras).

# 5. Termo de Referência
Extrair: Existe TR, Número do TR, Anexo, Resumo do TR.
Identificar: Obrigações, Requisitos, Critérios de aceitação, Entregáveis.

# 6. Especificações Técnicas
Extrair: Descrição completa, Características obrigatórias, Características desejáveis, Certificações, Normas técnicas, Homologações, Compatibilidades.
Detectar: Direcionamento de marca, Restrição indevida, Possível impugnação.

# 7. Itens
Extrair: Número do item, Descrição, Unidade, Quantidade, Categoria.

# 8. Lotes / Grupos
Extrair: Participação por item, Participação por lote, Participação global.
Identificar: Itens problemáticos, Itens deficitários, Dependência entre itens.

# 9. Quantidades
Extrair: Quantidade estimada, Quantidade mínima, Quantidade máxima.
Detectar: Baixo potencial, Alto potencial, Quantidade incompatível com capacidade operacional.

# 10. Benefícios para ME/EPP
Extrair: Exclusivo ME/EPP, Cota reservada, Empate ficto, Benefícios LC 123.
Detectar: Empresa elegível, Empresa não elegível.

# 11. Critério de Julgamento
Extrair: Menor preço, Maior desconto, Técnica e preço, Maior retorno econômico.

# 12. Preço de Referência
Extrair: Valor unitário, Valor global, Valor estimado, Valor sigiloso.
Calcular: Margem estimada, Viabilidade comercial.

# 13. Pesquisa de Mercado
IA deve identificar: Preço acima do mercado, Preço abaixo do mercado, Faixa de mercado estimada.

# 14. Documentação de Habilitação
Jurídica: Contrato Social, Alterações, Procuração.
Fiscal: Federal, Estadual, Municipal, FGTS, CNDT.
Econômico-financeira: Balanço, Índices, Patrimônio líquido.

# 15. Qualificação Técnica
Extrair: Exigida, Não exigida.
Identificar: Percentuais mínimos, Experiência mínima, Escopo exigido.

# 16. Atestado de Capacidade Técnica
Extrair: Quantidade mínima, Percentual mínimo, Objeto semelhante, Exigência de CAT.
Classificar: Atende, Parcialmente atende, Não atende.

# 17. CAT e CREA/CAU
Quando aplicável: Extrair CREA, CAU, ART, CAT.

# 18. Equipe Técnica
Extrair: Responsável técnico, Certificações exigidas, Formação exigida, Quantidade mínima.

# 19. Licenças e Certificações
Extrair: ISO, ANVISA, INMETRO, MAPA, ANATEL, IBAMA, Outras.

# 20. Catálogos e Documentação Técnica
Extrair: Catálogo, Datasheet, Manual, Folder, Certificados.

# 21. Amostras
Extrair: Exige amostra, Quantidade, Prazo, Local, Critérios de aprovação.

# 22. Proposta Comercial
Extrair: Modelo obrigatório, Campos obrigatórios, Assinatura exigida, Forma de envio.

# 23. Validade da Proposta
Extrair: Quantidade de dias. Detectar: Divergência da proposta padrão.

# 24. Garantia da Proposta
Extrair: Exigida, Não exigida. Quando existir: Seguro garantia, Caução, Fiança bancária.

# 25. Garantia Contratual
Extrair: Percentual, Modalidade, Prazo.

# 26. Prazo de Entrega
Extrair: Quantidade de dias, Marco inicial. Detectar: Após empenho, Após assinatura, Após ordem de serviço, Após contrato.

# 27. Locais de Entrega
Extrair: Endereços, Municípios, Estados. Calcular: Complexidade logística.

# 28. Condições de Execução
Extrair: Horários, Janelas de entrega, Regras de acesso, Requisitos operacionais.

# 29. Prazo de Pagamento
Extrair: Quantidade de dias, Forma de pagamento.

# 30. Reajuste e Repactuação
Extrair: Existe reajuste, Índice utilizado, Prazo para reajuste.

# 31. Vigência Contratual
Extrair: Início, Término, Possibilidade de prorrogação.

# 32. Ata de Registro de Preços
Extrair: Vigência, Quantidade registrada, Possibilidade de adesão.
Detectar: Carona permitida, Carona vedada.

# 33. Penalidades
Extrair: Advertência, Multa, Suspensão, Impedimento, Declaração de inidoneidade.

# 34. Recursos e Impugnações
Extrair: Prazo para impugnação, Prazo para recurso, Canal de envio.

# 35. Cronograma Completo
Extrair: Publicação, Esclarecimentos, Impugnações, Sessão, Recursos, Homologação, Contratação.

# 36. Obrigações da Contratada
Extrair: Todas as obrigações, SLA, Níveis de serviço, Responsabilidades.

# 37. Obrigações da Contratante
Extrair: Aceite, Fiscalização, Pagamento, Disponibilização de recursos.

# 38. Matriz de Riscos
Detectar: Comercial (Margem baixa, Preço inviável), Técnico (Requisitos difíceis), Jurídico (Cláusulas restritivas), Operacional (Prazo curto, Logística complexa), Financeiro (Prazo de pagamento elevado, Garantias caras).

# 39. Cláusulas Restritivas
Detectar automaticamente: Exigência excessiva de atestados, Marca direcionada, Certificações desnecessárias, Exigências ilegais.

# 40. Oportunidades de Impugnação
IA deve apontar: Motivo, Base legal, Trecho do edital.

# 41. Motivos Potenciais de Desclassificação
Detectar: Documento ausente, Certidão vencida, Atestado insuficiente, Catálogo ausente, Amostra ausente, Assinatura ausente, Produto incompatível, Proposta divergente.

# 42. Concorrência Histórica
Quando possível: Extrair Licitações semelhantes, Vencedores anteriores, Faixa de preços vencedora.

# 43. Inteligência Comercial
Gerar: Faixa recomendada de lance, Lance agressivo, Lance seguro, Lance conservador.

# 44. Simulação Financeira
Calcular: Receita estimada, Custos, Frete, Tributos, Margem bruta, Margem líquida.

# 45. Checklist de Pendências
Listar: Documentos faltantes, Certidões vencidas, Certidões próximas do vencimento, Catálogos pendentes, Atestados pendentes.

# 46. Checklist de Participação
Habilitação Jurídica, Habilitação Fiscal, Qualificação Técnica, Produto Compatível, Preço Competitivo, Logística Viável, Margem Positiva, Garantias Disponíveis.

# 47. Score de Viabilidade
Estimar de 0-100 para: Comercial, Técnica, Jurídica, Operacional, Financeira, Documental.

# 48. Score Geral
Classificação (0-100):
90-100 Excelente oportunidade
80-89 Muito boa
70-79 Boa
60-69 Atenção
Abaixo de 60 Alto risco

# 49. Resumo Executivo (1 Minuto)
A IA deve responder: O que está sendo comprado? Quanto vale? Quais os principais riscos? Quais os principais requisitos? Vale participar?

# 50. Recomendação Final
Classificar em: Participar (Baixo risco e boa rentabilidade), Participar com Ressalvas (Possui riscos controláveis), Não Participar (Risco elevado ou inviabilidade).
`;
