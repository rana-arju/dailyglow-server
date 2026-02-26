import admin from 'firebase-admin';
import config from '.';
import { serviceAccount } from './serviceAccount';

const envProjectId = config.firebase.projectId ? config.firebase.projectId.trim().replace(/,$/, '') : undefined;
const envClientEmail = config.firebase.clientEmail ? config.firebase.clientEmail.trim().replace(/,$/, '') : undefined;
const envPrivateKey = config.firebase.privateKey ? config.firebase.privateKey.replace(/\\n/g, '\n') : undefined;


const firebaseCredentials: admin.ServiceAccount =
  envProjectId && envClientEmail && envPrivateKey
    ? {
        projectId: envProjectId,
        clientEmail: envClientEmail,
        privateKey: envPrivateKey,
      }
    : (serviceAccount as admin.ServiceAccount);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
  });
}

const firebaseAuth = admin.auth();

export { firebaseAuth };
export default admin;
