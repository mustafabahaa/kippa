/**
 * ONE-OFF MIGRATION — delete duplicate budgetAllocations docs and promote one
 * canonical doc per (budgetCycleId, categoryId).
 *
 * Background: saveBudgetAllocation(Batch) used to mint a fresh crypto.randomUUID()
 * per allocation on every save, so re-saving created duplicate docs. The write
 * path now derives a canonical id `${budgetCycleId}_${categoryId}` (commit
 * 4b01621), but the stale duplicate docs created before that fix are still in
 * Firestore and render as duplicate category rows on the dashboard. This script
 * cleans them up across ALL households.
 *
 * Keeper policy (matches the client-side dedupeAllocations helper):
 *  - If a doc already lives at the canonical id, keep it.
 *  - Otherwise promote the doc with the highest plannedAmount to the canonical
 *    id (copy all fields), then delete the promoted doc's original id too.
 *  - Delete every other doc in the group.
 * No keeper data is lost: plannedAmount / currency / carryLeftover / notes are
 * all carried over on promotion.
 *
 * Usage (from repo root):
 *   DRY RUN (report only):
 *     npx tsx functions/src/scripts/migrateDedupeBudgetAllocations.ts
 *   WRITE:
 *     npx tsx functions/src/scripts/migrateDedupeBudgetAllocations.ts --write
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or `firebase login` for Admin SDK.
 */
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Minimal .env loader — the functions workspace has no dotenv dependency.
// Mirrors .agents/skills/firebase-admin/scripts/run.mjs so the script targets
// the correct project (kippa-app-28062026) under ADC.
function loadProjectId(): string {
  // Script lives at <projectRoot>/functions/src/scripts/ — 3 levels up to root.
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const envPath = join(projectRoot, '.env');
  if (!existsSync(envPath)) return '';
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    if (trimmed.slice(0, eq).trim() === 'VITE_FIREBASE_PROJECT_ID') {
      return trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return '';
}

const projectId = loadProjectId();
const db = admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId }).firestore();
const WRITE = process.argv.includes('--write');

type AllocationDoc = {
  ref: admin.firestore.DocumentReference;
  id: string;
  data: admin.firestore.DocumentData;
};

function canonicalId(budgetCycleId: string, categoryId: string): string {
  return `${budgetCycleId}_${categoryId}`;
}

async function migrate() {
  const snapshot = await db.collectionGroup('budgetAllocations').get();
  console.log(`Scanned ${snapshot.size} budgetAllocation doc(s) across all households.\n`);

  if (snapshot.size === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  // Group every doc by its canonical (cycle, category) key.
  const groups = new Map<string, AllocationDoc[]>();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const key = canonicalId(data.budgetCycleId, data.categoryId);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push({ ref: doc.ref, id: doc.id, data });
    } else {
      groups.set(key, [{ ref: doc.ref, id: doc.id, data }]);
    }
  }

  const duplicateGroups = [...groups.entries()].filter(([, bucket]) => bucket.length > 1);

  const toDelete: AllocationDoc[] = [];   // docs to delete outright (non-keepers)
  const toPromote: AllocationDoc[] = [];  // keeper whose data must be copied to the canonical id
  const conflicting: string[] = [];       // groups where dupes disagree on plannedAmount

  for (const [key, bucket] of duplicateGroups) {
    const canonical = bucket.find(d => d.id === key);
    const keeper: AllocationDoc = canonical ?? bucket.reduce((best, cur) =>
      cur.data.plannedAmount > best.data.plannedAmount ? cur : best
    );

    for (const doc of bucket) {
      if (doc.id === keeper.id) continue;
      toDelete.push(doc);
    }

    // If the keeper is not at the canonical id, promote it: write its data to the
    // canonical id, then delete its original doc.
    if (keeper.id !== key) {
      toPromote.push(keeper);
      toDelete.push(keeper);
    }

    const amounts = new Set(bucket.map(d => d.data.plannedAmount));
    if (amounts.size > 1) conflicting.push(key);
  }

  // --- Report ---
  console.log(`Duplicate groups: ${duplicateGroups.length}`);
  console.log(`Docs to delete:   ${toDelete.length}`);
  console.log(`Promotions:       ${toPromote.length}`);
  if (conflicting.length > 0) {
    console.log(`\n⚠  ${conflicting.length} group(s) have duplicates with DIFFERENT plannedAmount values (review before --write):`);
    for (const key of conflicting) {
      const bucket = groups.get(key)!;
      console.log(`  - ${key}:`);
      bucket.forEach(d => console.log(`      ${d.id}  plannedAmount=${d.data.plannedAmount}`));
    }
  }

  console.log('\nPer-group detail:');
  for (const [key, bucket] of duplicateGroups) {
    const canonical = bucket.find(d => d.id === key);
    const keeper = canonical ?? bucket.reduce((best, cur) =>
      cur.data.plannedAmount > best.data.plannedAmount ? cur : best
    );
    const householdPath = bucket[0].ref.parent.parent?.id ?? '?';
    console.log(`  - [${householdPath}] ${key}  (${bucket.length} docs → 1)`);
    bucket.forEach(d => {
      const tag = d.id === keeper.id ? (d.id === key ? 'KEEP (canonical)' : 'KEEP→PROMOTE') : 'DELETE';
      console.log(`      ${d.id}  plannedAmount=${d.data.plannedAmount}  ${tag}`);
    });
  }

  if (toDelete.length === 0) {
    console.log('\nNo duplicates found. Nothing to migrate.');
    return;
  }

  if (!WRITE) {
    console.log('\nDRY RUN — re-run with --write to apply.');
    return;
  }

  // --- Apply: 400 ops/batch (safely under the 500 Firestore limit) ---
  let batch = db.batch();
  let inBatch = 0;

  const promoteIds = new Set(toPromote.map(d => d.ref.path));
  const deleteIds = new Set(toDelete.map(d => d.ref.path));

  // 1. Promotions first: set the keeper's data at the canonical id.
  for (const doc of toPromote) {
    const canonicalIdVal = canonicalId(doc.data.budgetCycleId, doc.data.categoryId);
    const canonicalRef = doc.ref.parent.doc(canonicalIdVal);
    batch.set(canonicalRef, { ...doc.data, id: canonicalIdVal });
    inBatch++;
    if (inBatch === 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
  }

  // 2. Deletes — non-keeper dupes plus the promoted keepers' original docs.
  // The promotion set() above landed in an earlier (or same) committed batch, so
  // the canonical doc is guaranteed to exist before its source is removed.
  for (const doc of toDelete) {
    void promoteIds; // kept for potential future gating
    batch.delete(doc.ref);
    inBatch++;
    if (inBatch === 400) { await batch.commit(); batch = db.batch(); inBatch = 0; }
  }

  if (inBatch > 0) await batch.commit();

  console.log(`\nDone. Promoted ${toPromote.length} doc(s) to canonical id, deleted ${toDelete.length} duplicate doc(s).`);
}

migrate().then(() => process.exit(0)).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
