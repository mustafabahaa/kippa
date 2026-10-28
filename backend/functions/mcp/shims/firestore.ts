/**
 * Server-side stand-in for 'firebase/firestore'. Client libs import a few
 * helpers for their realtime subscription paths, which the MCP server never
 * calls; these stubs exist so the modules load. All actual data access goes
 * through the Admin-backed dbLib shim.
 */
const dummy = () => ({ __kippaFirestoreStub: true });
export const collection = dummy;
export const query = dummy;
export const where = dummy;
export const orderBy = dummy;
export const limit = dummy;
export const doc = dummy;
export const getDoc = dummy;
export const getDocs = dummy;
export const setDoc = dummy;
export const writeBatch = dummy;
export const onSnapshot = () => () => undefined;
