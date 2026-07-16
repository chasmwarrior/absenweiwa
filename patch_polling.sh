sed -i 's/console.error(err);/if (err?.response?.status !== 429) console.error(err);/g' src/hooks/useWhatsAppStatus.ts
sed -i 's/setInterval(fetchStatus, 3000);/setInterval(fetchStatus, 15000);/g' src/hooks/useWhatsAppStatus.ts
sed -i 's/console.error(err);/if (err?.response?.status !== 429) console.error(err);/g' src/pages/Dashboard.tsx
sed -i 's/console.error(err);/if (err?.response?.status !== 429) console.error(err);/g' src/components/Layout.tsx
sed -i 's/console.error(err);/if (err?.response?.status !== 429) console.error(err);/g' src/pages/Reports.tsx
sed -i 's/console.error(err);/if (err?.response?.status !== 429) console.error(err);/g' src/pages/PendingActions.tsx
