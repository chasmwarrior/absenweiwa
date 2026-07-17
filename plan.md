1. **Update API Endpoint for Pending Actions**
   - Edit `src/api/api.ts` endpoint `PUT /api/attendances/:id/approval` to accept fields: `penalty_amount`, `bonus_amount`, `status`, `notes`.
2. **Verify API Endpoint update**
   - Use `read_file` to verify the changes in `src/api/api.ts`.
3. **Update UI for Pending Actions Approval**
   - Edit `src/pages/PendingActions.tsx` to implement a modal for approval that includes inputs for denda/potongan (penalty/bonus) and catatan (notes), rather than just direct approve/reject buttons.
4. **Verify Pending Actions UI Update**
   - Use `read_file` on `src/pages/PendingActions.tsx` to ensure the modal and action handler are correctly implemented.
5. **Update Check-In Late Status**
   - Edit `handleCheckIn` in `src/services/WhatsAppService.ts` to set the status to 'telat (potong libur)' and adjust the reply message if `nowTime > 14:00`.
6. **Verify Check-In Late Status Update**
   - Use `read_file` on `src/services/WhatsAppService.ts` to verify the late check-in changes.
7. **Fix Command Parsing Aliases**
   - Edit the command parsing logic in `src/services/WhatsAppService.ts` (where `command ===` checks happen) to properly handle aliases (e.g., masuk, in, msk, pulang, out, plng, libur, off, lbr) mapped to their core functions, and completely remove the requirement for the `!` prefix by updating the command replace logic.
8. **Verify Command Parsing Aliases**
   - Use `read_file` to confirm the changes in `src/services/WhatsAppService.ts`.
9. **Update Anti-Spam Warning and Penalty**
   - Edit the anti-spam block in `src/services/WhatsAppService.ts`. If `now - lastTime < SPAM_THRESHOLD_MS`, send a warning message string threatening a penalty for spamming, then return early.
10. **Verify Anti-Spam Warning Update**
    - Use `read_file` to verify the changes in `src/services/WhatsAppService.ts`.
11. **Implement Cron Job for Absence Reminder**
    - Edit `server.ts` to add a `node-cron` job running 5 minutes before the start time to message users who have not checked in.
12. **Update Missing Check-in / Checkout edge cases**
    - Edit `handleCheckOut` in `src/services/WhatsAppService.ts` to log checkout as late or requiring admin review if the user didn't check in.
13. **Verify Cron Job and Checkout Updates**
    - Use `read_file` on `server.ts` and `src/services/WhatsAppService.ts` to verify the modifications.
14. **Replace "bot" with "aku/nama program"**
    - Edit hardcoded text in `src/services/WhatsAppService.ts`, `server.ts`, and `src/api/api.ts` to use "aku" or the program name instead of "bot".
15. **Verify Text Replacement**
    - Use `read_file` to confirm the text replacements.
16. **Implement Message Queue/Delay for Spam Prevention**
    - Edit `sendWhatsAppMessage` in `WhatsAppService.ts` to introduce an asynchronous delay (e.g., using a Promise and setTimeout) based on a message queue to avoid triggering WhatsApp spam filters.
17. **Verify Message Queue/Delay**
    - Use `read_file` to check the queue implementation in `src/services/WhatsAppService.ts`.
18. **Add Reset Attendances Data Feature**
    - Edit `src/api/api.ts` to add an endpoint `/api/data/reset-attendances`. Edit `src/pages/Settings.tsx` to add a button to invoke this endpoint.
19. **Verify Reset Feature**
    - Use `read_file` on `src/api/api.ts` and `src/pages/Settings.tsx` to confirm the new feature.
20. **Reject Forwarded Media and Unsolicited Documents**
    - Edit `WhatsAppService.ts` inside the `messages.upsert` event handler to check if `m.message?.extendedTextMessage?.contextInfo?.isForwarded` or `m.message?.imageMessage?.contextInfo?.isForwarded` is true, and reject the message if so.
    - Implement a state tracking mechanism (e.g., `expectedMedia.set(user.id, true)`) in `WhatsAppService.ts` when media is requested, and check against this state before processing incoming images to ignore unsolicited files.
21. **Verify Media Rules Implementation**
    - Use `read_file` to verify the changes in `src/services/WhatsAppService.ts`.
22. **Add Active Commands Page**
    - Create a new file `src/pages/ActiveCommands.tsx` to display active commands, and edit `src/App.tsx` and `src/components/Layout.tsx` routing and nav menu to register the new page.
23. **Verify Active Commands Page**
    - Use `read_file` to confirm `src/pages/ActiveCommands.tsx`, `Layout.tsx`, and routing updates.
24. **Fix 14:00 Holiday Bug**
    - Edit `handleCheckIn` in `src/services/WhatsAppService.ts` to correct the `config.late_cut_holiday` condition so it no longer sets the status to 'holiday' when checking in past 14:00.
25. **Verify 14:00 Bug Fix**
    - Use `read_file` to confirm the fix in `src/services/WhatsAppService.ts`.
26. **Test changes and build**
    - Run `npm run build` and start the server and run any relevant unit or e2e tests (if present) to ensure changes are correct and have no regressions.
27. **Pre commit checks**
    - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
28. **Submit changes**
    - Submit the PR.
