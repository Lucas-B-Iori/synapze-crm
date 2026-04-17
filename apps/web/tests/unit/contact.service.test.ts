import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();

function chainReturn(value: any) {
  const self = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    in: vi.fn(() => self),
    order: vi.fn(() => self),
    range: vi.fn(() => self),
    or: vi.fn(() => self),
    maybeSingle: vi.fn(() => Promise.resolve(value)),
    single: vi.fn(() => Promise.resolve(value)),
    insert: vi.fn(() => self),
    update: vi.fn(() => self),
    delete: vi.fn(() => self),
    ...value,
  };
  return self;
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
    rpc: mockRpc,
  })),
}));

import { createContact, updateContact, deleteContact, getCustomFieldDefinitions } from "@/server/services/contact.service";

describe("contact.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createContact", () => {
    it("returns error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error("no") });
      const result = await createContact("ws-1", { full_name: "John" });
      expect(result.error).toBe("Usuário não autenticado");
    });

    it("creates a contact and assignments", async () => {
      const user = { id: "user-1" };
      mockGetUser.mockResolvedValue({ data: { user }, error: null });

      const contact = { id: "c1", workspace_id: "ws-1", full_name: "John", email: null, phone: null, source: null, created_at: "now", updated_at: "now" };
      const chain = chainReturn({ data: contact, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await createContact("ws-1", { full_name: "John", assignedTo: ["user-2"] });
      expect(result.data).toEqual(contact);
      expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ workspace_id: "ws-1", full_name: "John" }));
    });
  });

  describe("updateContact", () => {
    it("updates contact and clears assignments when empty", async () => {
      const contact = { id: "c1", workspace_id: "ws-1", full_name: "John Updated", email: null, phone: null, source: null, created_at: "now", updated_at: "now" };
      const chain = chainReturn({ data: contact, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await updateContact("c1", { full_name: "John Updated", assignedTo: [] });
      expect(result.data).toEqual(contact);
      expect(chain.delete).toHaveBeenCalled();
    });
  });

  describe("deleteContact", () => {
    it("deletes contact by id", async () => {
      const chain = chainReturn({ error: null });
      mockFrom.mockReturnValue(chain);

      const result = await deleteContact("c1");
      expect(result.error).toBeUndefined();
      expect(chain.delete).toHaveBeenCalled();
      expect(chain.eq).toHaveBeenCalledWith("id", "c1");
    });
  });

  describe("getCustomFieldDefinitions", () => {
    it("returns definitions with options array", async () => {
      const defs = [{ id: "f1", workspace_id: "ws-1", name: "Field", field_type: "text", options: null, required: false, order_index: 0, created_at: "now" }];
      const chain = chainReturn({ data: defs, error: null });
      mockFrom.mockReturnValue(chain);

      const result = await getCustomFieldDefinitions("ws-1");
      expect(result.data).toEqual([{ ...defs[0], options: [] }]);
    });
  });
});
