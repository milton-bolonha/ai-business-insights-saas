import { interpret } from "xstate";
import { tileGenerationMachine } from "./tileGeneration.machine";

// Mock da API
global.fetch = jest.fn();

describe("tileGenerationMachine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve começar no estado idle", () => {
    const machine = interpret(tileGenerationMachine);
    machine.start();
    expect(machine.getSnapshot().matches("idle")).toBe(true);
  });

  it("deve transitar para generating ao receber START", () => {
    const machine = interpret(tileGenerationMachine);
    machine.start();

    machine.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    expect(machine.getSnapshot().matches("generating")).toBe(true);
    expect(machine.getSnapshot().context.generating).toBe(true);
    expect(machine.getSnapshot().context.prompt).toBe("Criar logo");
  });

  it("deve transitar para idle após geração bem-sucedida", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: "tile-1", content: "Logo gerado com sucesso" }),
    });

    const machine = interpret(tileGenerationMachine);
    machine.start();

    machine.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    await new Promise((resolve) => {
      machine.onTransition((state) => {
        if (state.matches("idle") && !state.context.generating) {
          expect(state.context.result?.id).toBe("tile-1");
          expect(state.context.error).toBeNull();
          resolve(void 0);
        }
      });
    });
  });

  it("deve lidar com erros de API e voltar ao estado error", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "API Error" }),
    });

    const machine = interpret(tileGenerationMachine);
    machine.start();

    machine.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    await new Promise((resolve) => {
      machine.onTransition((state) => {
        if (state.matches("error")) {
          expect(state.context.generating).toBe(false);
          expect(state.context.error).toBe("API Error");
          resolve(void 0);
        }
      });
    });
  });

  it("deve permitir retry após erro", () => {
    const machine = interpret(tileGenerationMachine);
    machine.start();

    // Simular erro
    machine.send({
      type: "ERROR",
      error: { message: "Network error" },
    });
    expect(machine.getSnapshot().matches("error")).toBe(true);

    // Retry deve voltar para generating com os mesmos parâmetros
    machine.send({ type: "RETRY" });
    expect(machine.getSnapshot().matches("generating")).toBe(true);
  });

  it("deve permitir cancelamento durante geração", () => {
    const machine = interpret(tileGenerationMachine);
    machine.start();

    machine.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });
    expect(machine.getSnapshot().matches("generating")).toBe(true);

    // Cancel deve ir para cancelled
    machine.send({ type: "CANCEL" });
    expect(machine.getSnapshot().matches("cancelled")).toBe(true);
  });

  it("deve atualizar progresso durante geração", () => {
    const machine = interpret(tileGenerationMachine);
    machine.start();

    machine.send({
      type: "START",
      prompt: "Criar logo",
      model: "gpt-4",
      useMaxPrompt: false,
      requestSize: "medium",
      dashboardId: "dash-1",
    });

    machine.send({ type: "PROGRESS", progress: 50 });
    expect(machine.getSnapshot().context.progress).toBe(50);
  });
});
