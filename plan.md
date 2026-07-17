1. **Implement Global Debug Logging (Trace Mode)**
   - We will override `console.log`, `console.warn`, and `console.error` globally in `server.ts` to write all output to a `debug.log` file, while still outputting to the console.
   - We will also add extensive `console.log` statements throughout `WhatsAppService.ts` and `api.ts` (especially around user syncing, number changes, and incoming message processing) to trace why new numbers aren't recognized and why group chats aren't working.
   - We will add an API endpoint `/api/debug-logs` that returns the contents of `debug.log` (tailing the last N lines).

2. **Display Debug Logs in the UI**
   - We will modify `src/pages/AuditLogs.tsx` to include a tab or a toggle that allows the user to switch between the standard "Audit Logs" and the new "Debug / Trace Logs". This will fulfill the request to show all activities and errors on the logs page.

3. **Investigate and Fix the Core Issues (Speculative)**
   - **New Numbers Not Recognized:** We'll verify if `userSyncService.updateAuthorizedNumbers()` is correctly called and if `senderNumber` parsing matches the newly registered IDs.
   - **Group Chat Ignored:** We'll check if the `botTemplates.features.allowed_groups` logic or the command parsing logic (`textMessage.replace`) is causing group messages to be skipped. We will log the `cleanTextMessage` and `rawCommand` to see what the bot actually receives.

4. **Complete Pre-Commit Steps**
   - Run tests and ensure the UI looks good.

5. **Submit Changes**
   - Submit the changes so the user can use the debug mode to trace any remaining issues or see them resolved.
