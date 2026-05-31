import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock incondicional do fetch global para evitar erros com URLs relativas no ambiente de teste Node
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
);
