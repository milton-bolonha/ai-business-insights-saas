# Segurança e Gestão de Arquivos no OS System

Uma Ordem de Serviço pode gerar risco de segurança e processos jurídicos para os lojistas (ex: "Meu celular não estava arranhado assim quando entreguei"). Para mitigar esses cenários de disputas legais, a arquitetura de arquivos foi implementada focando no controle rígido de mídias e proteção Cloud.

## 1. Mídia com Isolamento Baseado em Fases (Timeline Shield)

Toda foto, vídeo ou documento anexado a uma Ordem de Serviço recebe, obrigatoriamente, um carimbo da fase em que foi enviado (`phase: OSStatus`).

O `OSFileGallery.tsx` exige que o operador indique a **fase** da prova:
- **Intake**: Prova visual do estado em que o celular chegou.
- **Diagnosis**: Fotos das oxidações, placas rachadas ou laudos para aprovar orçamento.
- **Production**: Fotos do conserto e lacre de garantia.
- **Delivery**: Cópia do RG da pessoa que buscou e vídeo do aparelho sendo testado na frente do dono.

Essa blindagem na camada visual (UI) garante que fotos não se misturem e que a loja possa gerar relatórios precisos do "Antes vs Depois".

## 2. Padrões de Armazenamento Cloud (Cloudinary)

Para proteger o volume de dados e organizar as pastas, o padrão exigido no módulo para salvamento no Cloudinary é hierárquico e fechado ao `workspaceId`.

**Estrutura do Bucket:**
`workspaces/{workspace_id}/os/{os_id}/{fase}/file.jpg`

*Isso garante que:*
1. Uma loja nunca poderá enxergar as OS de outra loja (separação por `workspace_id`).
2. Fica trivial fazer um expurgo/arquivamento via Cloud (limpar anexos antigos) excluindo as subpastas `os_id` finalizadas há mais de 2 anos, ajudando no controle de custos (Storage).
3. Uma mídia gerada no momento de `intake` fica fisicamente separada do `diagnosis`, inviabilizando fraudes.

## 3. Coleta Segura de Assinatura

No fluxo de checkout (`PickupQueue`), implementamos o componente nativo `SignatureCapture`.
Este componente traduz o traçado digital feito via mouse ou toque num iPad em um Buffer criptografado `base64/png`, para armazená-lo com metadados do momento exato e prender aquela assinatura unicamente ao ID da Ordem de Serviço.

O botão de liberação de entrega não pode ser clicado pela UI caso falte a assinatura ou a URL fotográfica provando que o usuário final levou o aparelho embora, bloqueando erro humano (o operador da loja entregando sem coletar o comprovante).
