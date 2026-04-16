import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspaceId } from "@/server/actions/workspace.actions";
import { fetchContacts, fetchCustomFieldDefinitions } from "@/server/actions/contact.actions";
import { ContactsPage } from "./contacts-page";

export default async function ContactsRoute() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const workspaceId = await getActiveWorkspaceId();
  if (!workspaceId) {
    redirect("/dashboard");
  }

  const [contactsResult, fieldsResult] = await Promise.all([
    fetchContacts(workspaceId, {}, 1, 50),
    fetchCustomFieldDefinitions(workspaceId),
  ]);

  return (
    <ContactsPage
      initialContacts={contactsResult.data?.contacts || []}
      initialTotal={contactsResult.data?.total || 0}
      customFields={fieldsResult.data || []}
      workspaceId={workspaceId}
      userId={userData.user.id}
    />
  );
}
