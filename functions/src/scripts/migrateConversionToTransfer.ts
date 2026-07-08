/**
 * ONE-OFF MIGRATION — merge `conversion` transactions into `transfer`.
 *
 * Run AFTER deploying the app+functions changes that remove the `conversion`
 * type. For every transactions doc with type === 'conversion', sets type to
 * 'transfer'. Leaves ledgerLines and conversionDetails side-docs untouched
 * (they remain valid).
 *
 * Usage (from repo root):
 *   DRY RUN (counts only):
 *     npx tsx functions/src/scripts/migrateConversionToTransfer.ts
 *   WRITE:
 *     npx tsx functions/src/scripts/migrateConversionToTransfer.ts --write
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or `firebase login` for Admin SDK.
 */
import admin from 'firebase-admin';

const db = admin.initializeApp().firestore();
const WRITE = process.argv.includes('--write');

async function migrate() {
  const snapshot = await db.collectionGroup('transactions').where('type', '==', 'conversion').get();
  console.log(`Found ${snapshot.size} conversion transaction(s).`);

  if (snapshot.size === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  if (!WRITE) {
    console.log('DRY RUN — re-run with --write to apply.');
    return;
  }

  let batch = db.batch();
  let inBatch = 0;
  let total = 0;
  for (const doc of snapshot.docs) {
    batch.update(doc.ref, { type: 'transfer' });
    inBatch++;
    total++;
    if (inBatch === 400) {
      await batch.commit();
      console.log(`Migrated ${total}/${snapshot.size}...`);
      batch = db.batch();
      inBatch = 0;
    }
  }
  if (inBatch > 0) {
    await batch.commit();
  }
  console.log(`Done. Migrated ${total} transaction(s) to type='transfer'.`);
}

migrate().then(() => process.exit(0)).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
