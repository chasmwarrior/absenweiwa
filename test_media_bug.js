const pending = [{ approval_status: 'pending' }];
if (pending.length > 0 && (pending[0].approval_status === 'pending')) {
  console.log("Expected media logic runs");
} else {
  console.log("Unsolicited media logic runs");
}
