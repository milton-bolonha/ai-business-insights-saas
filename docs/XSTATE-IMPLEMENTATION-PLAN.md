# 🎯 Plano de Implementação XState + Integração com Zustand

## 📋 **Visão Geral**

Este documento detalha o plano completo para implementar XState machines e integrá-las com Zustand, melhorando o gerenciamento de fluxos complexos na aplicação.

---

## 🎯 **Objetivos**

1. **Implementar XState machines** para fluxos complexos (tile generation, chat, onboarding)
2. **Integrar XState com Zustand** usando `zustand-middleware-xstate`
3. **Substituir lógica complexa** atualmente em componentes por máquinas de estado
4. **Melhorar UX** com feedback visual de estados e transições

---

## 📊 **Status Atual**

### ✅ **Já Existe (mas não está sendo usado)**

- `src/lib/state/machines/onboarding.machine.ts` - Máquina de onboarding
- `src/lib/state/machines/tileGeneration.machine.ts` - Máquina de geração de tiles
- `src/lib/state/machines/tileChat.machine.ts` - Máquina de chat com tiles
- `src/components/onboarding/OnboardingWizard.tsx` - Usa `onboardingMachine` (único uso atual)

### ❌ **Não Implementado**

- Integração XState com Zustand
- Uso de máquinas em outros componentes
- Máquinas para fluxos de contact chat
- Máquinas para fluxos de regeneração
- Máquinas para fluxos de checkout/pagamento

---

## 🚀 **Fase 1: Preparação e Dependências**

### 1.1 Instalar Dependências

```bash
npm install xstate @xstate/react zustand-middleware-xstate
```

### 1.2 Verificar Versões

- `xstate`: ^5.x (versão moderna com `setup()`)
- `@xstate/react`: ^4.x
- `zustand-middleware-xstate`: ^1.x (se disponível) ou criar middleware customizado

---

## 🚀 **Fase 2: Refatorar Máquinas Existentes**

### 2.1 Atualizar `onboarding.machine.ts`

**Arquivo**: `src/lib/state/machines/onboarding.machine.ts`

**Melhorias**:
- Usar API moderna do XState 5 (`setup()`)
- Adicionar mais estados (loading, error recovery)
- Integrar com Zustand via middleware

**Status**: ✅ Já existe, precisa atualização

### 2.2 Atualizar `tileGeneration.machine.ts`

**Arquivo**: `src/lib/state/machines/tileGeneration.machine.ts`

**Melhorias**:
- Integrar com TanStack Query mutations
- Adicionar estados de progresso mais granulares
- Suporte para cancelamento
- Integrar com workspaceStore

**Status**: ✅ Já existe, precisa integração

### 2.3 Atualizar `tileChat.machine.ts`

**Arquivo**: `src/lib/state/machines/tileChat.machine.ts`

**Melhorias**:
- Integrar com TanStack Query mutations
- Adicionar histórico de mensagens
- Suporte para attachments
- Estados de erro mais robustos

**Status**: ✅ Já existe, precisa integração

---

## 🚀 **Fase 3: Criar Novas Máquinas**

### 3.1 Máquina de Contact Chat

**Arquivo**: `src/lib/state/machines/contactChat.machine.ts`

**Estados**:
- `idle` - Sem chat ativo
- `sending` - Enviando mensagem
- `receiving` - Recebendo resposta
- `error` - Erro na comunicação
- `success` - Mensagem enviada com sucesso

**Eventos**:
- `SEND_MESSAGE` - Enviar mensagem
- `MESSAGE_SENT` - Mensagem enviada
- `MESSAGE_RECEIVED` - Resposta recebida
- `ERROR` - Erro ocorreu
- `CLEAR_CHAT` - Limpar histórico

**Integração**:
- Usar `useChatWithContact` mutation
- Atualizar workspaceStore após sucesso

### 3.2 Máquina de Regeneração

**Arquivo**: `src/lib/state/machines/regeneration.machine.ts`

**Estados**:
- `idle` - Sem regeneração
- `regenerating` - Regenerando conteúdo
- `success` - Regeneração bem-sucedida
- `error` - Erro na regeneração

**Eventos**:
- `START_REGENERATION` - Iniciar regeneração
- `REGENERATION_SUCCESS` - Sucesso
- `REGENERATION_ERROR` - Erro
- `CANCEL` - Cancelar

**Uso**:
- Regeneração de tiles
- Regeneração de contacts (futuro)

### 3.3 Máquina de Checkout/Pagamento

**Arquivo**: `src/lib/state/machines/checkout.machine.ts`

**Estados**:
- `idle` - Sem checkout
- `redirecting` - Redirecionando para Stripe
- `processing` - Processando pagamento
- `success` - Pagamento bem-sucedido
- `error` - Erro no pagamento
- `cancelled` - Checkout cancelado

**Eventos**:
- `START_CHECKOUT` - Iniciar checkout
- `REDIRECT_TO_STRIPE` - Redirecionar
- `PAYMENT_SUCCESS` - Pagamento OK
- `PAYMENT_ERROR` - Erro
- `CANCEL` - Cancelar

**Integração**:
- Integrar com Stripe checkout
- Atualizar authStore após sucesso
- Triggerar migração de dados guest → member

---

## 🚀 **Fase 4: Integração com Zustand**

### 4.1 Criar Middleware Customizado

**Arquivo**: `src/lib/stores/middleware/xstate-middleware.ts`

**Implementação**:
```typescript
import { StoreApi, create } from 'zustand';
import { ActorRefFrom, setup } from 'xstate';

export function xstateMiddleware<TMachine extends ReturnType<typeof setup>>(
  machine: TMachine
) {
  return (config: StoreApi<any>) => {
    // Implementação do middleware
    // Integra máquina XState com store Zustand
  };
}
```

**Alternativa**: Se `zustand-middleware-xstate` não estiver disponível, criar middleware customizado.

### 4.2 Criar Stores com XState

**Exemplo**: `src/lib/stores/tileGenerationStore.ts`

```typescript
import { create } from 'zustand';
import { xstateMiddleware } from './middleware/xstate-middleware';
import { tileGenerationMachine } from '@/lib/state/machines/tileGeneration.machine';

export const useTileGenerationStore = create(
  xstateMiddleware(tileGenerationMachine)
);
```

### 4.3 Integrar com workspaceStore

**Estratégia**:
- Máquinas XState gerenciam fluxos complexos
- Zustand stores gerenciam estado simples
- Comunicação via eventos e callbacks

---

## 🚀 **Fase 5: Integração com Componentes**

### 5.1 Refatorar `AdminContainer.tsx`

**Mudanças**:
- Usar `useTileGenerationStore` para geração de tiles
- Usar `useTileChatStore` para chat com tiles
- Usar `useContactChatStore` para chat com contacts
- Usar `useCheckoutStore` para fluxo de pagamento

**Benefícios**:
- Código mais limpo
- Melhor gerenciamento de estados
- Feedback visual melhor

### 5.2 Criar Hooks Customizados

**Arquivo**: `src/containers/admin/hooks/useTileGeneration.ts`

```typescript
import { useTileGenerationStore } from '@/lib/stores/tileGenerationStore';
import { useContent } from '@/lib/stores/contentHooks';

export function useTileGeneration() {
  const machine = useTileGenerationStore();
  const content = useContent();
  
  // Lógica de integração
  // Conectar eventos da máquina com mutations do TanStack Query
}
```

### 5.3 Atualizar Componentes de UI

**Componentes a atualizar**:
- `TileGridAde.tsx` - Usar máquina de geração
- `TileDetailModal.tsx` - Usar máquina de chat
- `ContactDetailModal.tsx` - Usar máquina de chat de contact
- `UpgradeModal.tsx` - Usar máquina de checkout

---

## 🚀 **Fase 6: Testes e Validação**

### 6.1 Testes Unitários

- Testar cada máquina isoladamente
- Testar transições de estado
- Testar eventos

### 6.2 Testes de Integração

- Testar integração com TanStack Query
- Testar integração com Zustand
- Testar fluxos completos

### 6.3 Testes E2E

- Testar fluxo completo de geração de tile
- Testar fluxo completo de chat
- Testar fluxo completo de checkout

---

## 📝 **Checklist de Implementação**

### **Fase 1: Preparação**
- [ ] Instalar dependências (`xstate`, `@xstate/react`, `zustand-middleware-xstate`)
- [ ] Verificar compatibilidade de versões
- [ ] Criar estrutura de pastas

### **Fase 2: Refatorar Máquinas Existentes**
- [ ] Atualizar `onboarding.machine.ts` para XState 5
- [ ] Atualizar `tileGeneration.machine.ts` com integração TanStack Query
- [ ] Atualizar `tileChat.machine.ts` com melhorias

### **Fase 3: Criar Novas Máquinas**
- [ ] Criar `contactChat.machine.ts`
- [ ] Criar `regeneration.machine.ts`
- [ ] Criar `checkout.machine.ts`

### **Fase 4: Integração com Zustand**
- [ ] Criar middleware customizado ou usar `zustand-middleware-xstate`
- [ ] Criar stores com XState (`tileGenerationStore`, `tileChatStore`, etc.)
- [ ] Integrar com `workspaceStore` e `authStore`

### **Fase 5: Integração com Componentes**
- [ ] Refatorar `AdminContainer.tsx`
- [ ] Criar hooks customizados (`useTileGeneration`, `useTileChat`, etc.)
- [ ] Atualizar componentes de UI

### **Fase 6: Testes**
- [ ] Testes unitários das máquinas
- [ ] Testes de integração
- [ ] Testes E2E

---

## 🎯 **Priorização**

### **Alta Prioridade** (Implementar Primeiro)
1. **Refatorar `tileGeneration.machine.ts`** - Usado em geração de tiles
2. **Criar `checkout.machine.ts`** - Fluxo crítico de pagamento
3. **Integração com Zustand** - Base para tudo

### **Média Prioridade**
4. **Refatorar `tileChat.machine.ts`** - Melhorar UX de chat
5. **Criar `contactChat.machine.ts`** - Consistência com tile chat
6. **Criar `regeneration.machine.ts`** - Melhorar regeneração

### **Baixa Prioridade**
7. **Atualizar `onboarding.machine.ts`** - Já funciona, pode esperar
8. **Testes completos** - Após implementação principal

---

## 📚 **Recursos e Referências**

### **Documentação**
- [XState Docs](https://xstate.js.org/docs/)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [TanStack Query Docs](https://tanstack.com/query/latest)

### **Exemplos**
- `src/lib/state/machines/onboarding.machine.ts` - Exemplo existente
- `src/components/onboarding/OnboardingWizard.tsx` - Uso de máquina

### **Padrões**
- Máquinas devem ser puras (sem side effects)
- Side effects via `invoke` com promises
- Integração com TanStack Query via `invoke`
- Integração com Zustand via middleware

---

## ⚠️ **Considerações Importantes**

### **Performance**
- Máquinas XState são leves, mas muitas máquinas podem impactar performance
- Usar `useSelector` para evitar re-renders desnecessários
- Considerar lazy loading de máquinas

### **Complexidade**
- Não criar máquinas para lógica simples
- Usar máquinas apenas para fluxos complexos com múltiplos estados
- Manter máquinas pequenas e focadas

### **Manutenibilidade**
- Documentar cada máquina
- Usar nomes descritivos para estados e eventos
- Manter testes atualizados

---

## 🎉 **Resultado Esperado**

Após implementação completa:

1. ✅ Fluxos complexos gerenciados por XState
2. ✅ Integração perfeita com Zustand e TanStack Query
3. ✅ Código mais limpo e manutenível
4. ✅ Melhor UX com feedback visual de estados
5. ✅ Testes robustos para todos os fluxos

---

**Última atualização**: 2024-07-29
**Versão**: 1.0.0

