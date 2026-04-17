import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockOrder = vi.fn();
const mockGetUser = vi.fn();

function resetChainMocks() {
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle });
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, maybeSingle: mockMaybeSingle, order: mockOrder, select: mockSelect, limit: mockFrom });
  mockOrder.mockReturnValue({ select: mockSelect });
  mockFrom.mockReturnValue({ select: mockSelect, insert: mockInsert, update: mockUpdate, delete: mockDelete, eq: mockEq });
  mockInsert.mockReturnValue({ select: mockSelect, single: mockSingle });
  mockUpdate.mockReturnValue({ eq: mockEq, select: mockSelect, single: mockSingle });
  mockDelete.mockReturnValue({ eq: mockEq });
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

const mockAdminCreateUser = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { createUser: mockAdminCreateUser } },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

import { createWorkspace, getWorkspacesForUser, inviteMember } from "@/server/services/workspace.service";

describe("workspace.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChainMocks();
  });

  describe("getWorkspacesForUser", () => {
    it("returns error when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });
      const result = await getWorkspacesForUser();
      expect(result.error).toBe("Usuário não autenticado");
    });

    it("returns workspaces for authenticated user", async () => {
      const user = { id: "user-1", email: "a@b.com" };
      mockGetUser.mockResolvedValue({ data: { user }, error: null });

      const workspaces = [{ id: "ws-1", name: "WS 1" }];
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [{ workspace: workspaces[0] }], error: null }),
            }),
          }),
        }),
      });

      const result = await getWorkspacesForUser();
      expect(result.error).toBeUndefined();
      expect(result.data).toEqual(workspaces);
    });
  });

  describe("createWorkspace", () => {
    it("returns error when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("Unauthorized") });
      const result = await createWorkspace("My Workspace");
      expect(result.error).toBe("Usuário não autenticado");
    });

    it("creates workspace via RPC", async () => {
      const user = { id: "user-1", email: "a@b.com" };
      mockGetUser.mockResolvedValue({ data: { user }, error: null });

      const workspace = { id: "ws-1", name: "My Workspace", slug: "my-workspace-123", owner_id: user.id };
      mockRpc.mockResolvedValue({ data: workspace, error: null });

      const result = await createWorkspace("My Workspace");
      expect(mockRpc).toHaveBeenCalledWith("create_workspace_with_owner", {
        p_name: "My Workspace",
        p_owner_id: "user-1",
      });
      expect(result.data).toEqual(workspace);
    });

    it("returns error when RPC fails", async () => {
      const user = { id: "user-1", email: "a@b.com" };
      mockGetUser.mockResolvedValue({ data: { user }, error: null });
      mockRpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

      const result = await createWorkspace("My Workspace");
      expect(result.error).toBe("DB error");
    });
  });

  describe("inviteMember", () => {
    it("returns error when user lacks permission", async () => {
      const user = { id: "user-1", email: "a@b.com" };
      mockGetUser.mockResolvedValue({ data: { user }, error: null });

      // myMembership returns professional (not owner/manager)
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { role: "professional" }, error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await inviteMember("ws-1", "new@user.com", "professional");
      expect(result.error).toBe("Sem permissão para convidar membros");
    });
  });
});
