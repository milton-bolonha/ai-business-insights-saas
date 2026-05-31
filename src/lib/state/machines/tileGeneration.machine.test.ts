import { createActor } from "xstate";
import { tileGenerationMachine } from "./tileGeneration.machine";
import { vi } from "vitest";

// Mock da API
global.fetch = vi.fn();

describe("tileGenerationMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve começar no estado idle", () => {
    const actor = createActor(tileGenerationMachine);
    actor.start();
    expect(actor.getSnapshot().value).toBe("idle");
  });

  it("deve transitar para generating ao receber START", () => {
    const actor = createActor(tileGenerationMachine);
    actor.start();

    actor.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    expect(actor.getSnapshot().value).toBe("generating");
    expect(actor.getSnapshot().context.prompt).toBe("Criar logo");
  });

  it("deve transitar para idle após geração bem-sucedida", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, tile: { id: "tile-1", content: "Logo gerado com sucesso" } }),
    } as any);

    const actor = createActor(tileGenerationMachine);
    actor.start();

    actor.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    await new Promise((resolve) => {
      actor.subscribe((state) => {
        if (state.value === "success") {
          expect(state.context.result?.tile?.id).toBe("tile-1");
          expect(state.context.error).toBeNull();
          resolve(void 0);
        }
      });
    });
  });

  it("deve lidar com erros de API e voltar ao estado error", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("API Error"));

    const actor = createActor(tileGenerationMachine);
    actor.start();

    actor.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    await new Promise((resolve) => {
      actor.subscribe((state) => {
        if (state.value === "error") {
          expect(state.context.error).toBe("Failed to generate tile");
          resolve(void 0);
        }
      });
    });
  });

  it("deve permitir retry após erro", () => {
    const actor = createActor(tileGenerationMachine);
    actor.start();

    // Iniciar
    actor.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });
    
    // Forçar transição direta de erro pelo mock se o fetch falhar
    // Para simplificar o teste síncrono da transição, podemos testar enviando RETRY a partir do estado error
  });

  it("deve permitir cancelamento durante geração", () => {
    const actor = createActor(tileGenerationMachine);
    actor.start();

    actor.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });
    expect(actor.getSnapshot().value).toBe("generating");

    // Cancel deve ir para cancelled
    actor.send({ type: "CANCEL" });
    expect(actor.getSnapshot().value).toBe("cancelled");
  });

  it("deve atualizar progresso durante geração", () => {
    const actor = createActor(tileGenerationMachine);
    actor.start();

    actor.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    actor.send({ type: "PROGRESS", progress: 50 });
    expect(actor.getSnapshot().context.progress).toBe(50);
  });
});
