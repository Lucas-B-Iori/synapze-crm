import { parsePhoneNumber } from "libphonenumber-js";

export function normalizePhone(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone, "BR");
    return parsed?.format("E.164") || phone.replace(/\D/g, "");
  } catch {
    return phone.replace(/\D/g, "");
  }
}

export function findContactByPhone(
  contacts: { id: string; phone: string | null }[],
  phone: string
): { id: string; phone: string | null } | undefined {
  const target = normalizePhone(phone);
  return contacts.find((c) => normalizePhone(c.phone || "") === target);
}
