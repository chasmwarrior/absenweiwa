sed -i 's/setAttendances(attRes.data);/setAttendances(Array.isArray(attRes.data) ? attRes.data : []);/g' src/pages/Dashboard.tsx
sed -i 's/setAttendances(attRes.data);/setAttendances(Array.isArray(attRes.data) ? attRes.data : []);/g' src/pages/Reports.tsx
sed -i "s/setPending(attRes.data.filter/setPending((Array.isArray(attRes.data) ? attRes.data : []).filter/g" src/pages/PendingActions.tsx
sed -i "s/const pending = res.data.filter/const pending = (Array.isArray(res.data) ? res.data : []).filter/g" src/components/Layout.tsx
