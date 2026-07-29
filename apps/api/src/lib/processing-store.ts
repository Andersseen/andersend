import { getEmailById, insertEmailEvent, updateEmailStatus } from "@andersseen/database";
import type { EmailProcessingStore, EmailRecordForProcessing } from "@andersseen/email-core";

export function createProcessingStore(db: D1Database, projectId: string): EmailProcessingStore {
  return {
    async getEmail(emailId): Promise<EmailRecordForProcessing | null> {
      const email = await getEmailById(db, projectId, emailId);
      if (!email) return null;
      return {
        id: email.id,
        status: email.status,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
      };
    },

    async markProcessing(emailId) {
      await updateEmailStatus(db, emailId, { status: "processing" });
    },

    async markSucceeded(emailId, result) {
      await updateEmailStatus(db, emailId, {
        status: result.status,
        providerMessageId: result.providerMessageId,
      });
    },

    async markFailed(emailId, error) {
      await updateEmailStatus(db, emailId, {
        status: "failed",
        errorCode: error.code,
        errorMessage: error.message,
      });
    },

    async recordEvent(emailId, type, payload) {
      await insertEmailEvent(db, emailId, type, payload);
    },
  };
}
