import { describe, it, expect } from "vitest";
import { canPerformAction } from "@/hooks/usePermission";
import type { WorkspaceRole } from "@/types/workspace";

describe("canPerformAction", () => {
  const cases: { userRole: WorkspaceRole; required: WorkspaceRole; expected: boolean }[] = [
    { userRole: "owner", required: "owner", expected: true },
    { userRole: "owner", required: "manager", expected: true },
    { userRole: "owner", required: "professional", expected: true },
    { userRole: "owner", required: "assistant", expected: true },
    { userRole: "manager", required: "owner", expected: false },
    { userRole: "manager", required: "manager", expected: true },
    { userRole: "manager", required: "professional", expected: true },
    { userRole: "manager", required: "assistant", expected: true },
    { userRole: "professional", required: "manager", expected: false },
    { userRole: "professional", required: "professional", expected: true },
    { userRole: "professional", required: "assistant", expected: true },
    { userRole: "assistant", required: "professional", expected: false },
    { userRole: "assistant", required: "assistant", expected: true },
  ];

  cases.forEach(({ userRole, required, expected }) => {
    it(`${userRole} ${expected ? "pode" : "não pode"} executar ação de ${required}`, () => {
      expect(canPerformAction(userRole, required)).toBe(expected);
    });
  });

  it("retorna false quando userRole é nulo", () => {
    expect(canPerformAction(null, "assistant")).toBe(false);
    expect(canPerformAction(undefined, "assistant")).toBe(false);
  });
});
