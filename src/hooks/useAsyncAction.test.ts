import { describe, expect, it, vi, beforeEach } from "vitest";
import { runAsyncAction } from "./async-action-runner";

vi.mock("../lib/observability", () => ({
  reportError: vi.fn(),
}));

import { reportError } from "../lib/observability";

describe("runAsyncAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna ok com o valor e chama onSuccess", async () => {
    const onSuccess = vi.fn();
    const result = await runAsyncAction(async () => 42, {
      onSuccess,
      captureErrors: false,
    });

    expect(result).toEqual({ ok: true, value: 42 });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(reportError).not.toHaveBeenCalled();
  });

  it("retorna erro, chama onError e reporta quando captureErrors=true", async () => {
    const onError = vi.fn();
    const result = await runAsyncAction(
      async () => {
        throw new Error("falhou");
      },
      {
        captureErrors: true,
        operation: "test_op",
        onError,
      },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toBe("falhou");
    expect(onError).toHaveBeenCalledWith(result.error);
    expect(reportError).toHaveBeenCalledWith(
      result.error,
      expect.objectContaining({
        surface: "async_action",
        operation: "test_op",
      }),
    );
  });

  it("não reporta quando captureErrors=false", async () => {
    const result = await runAsyncAction(
      async () => {
        throw new Error("esperado");
      },
      { captureErrors: false },
    );

    expect(result.ok).toBe(false);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("normaliza throw não-Error", async () => {
    const result = await runAsyncAction(
      async () => {
        throw "string-fail";
      },
      { captureErrors: false },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("string-fail");
  });
});
