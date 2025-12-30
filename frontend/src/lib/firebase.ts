/**
 * Firebase Storage Service
 * Uploads audio files to Firebase Storage
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
function getFirebaseApp(): admin.app.App {
    if (firebaseApp) {
        return firebaseApp;
    }

    // Check if already initialized
    if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0]!;
        return firebaseApp;
    }

    const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;

    if (!credentialsPath) {
        throw new Error('FIREBASE_CREDENTIALS_PATH is not configured');
    }

    if (!bucket) {
        throw new Error('FIREBASE_STORAGE_BUCKET is not configured');
    }

    // Read credentials file
    let serviceAccount;
    try {
        const fileContent = readFileSync(credentialsPath, 'utf-8');
        serviceAccount = JSON.parse(fileContent);
    } catch (err) {
        throw new Error(`Failed to read Firebase credentials from ${credentialsPath}: ${err}`);
    }

    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: bucket,
    });

    console.log('✅ Firebase initialized');

    return firebaseApp;
}

/**
 * Upload audio to Firebase Storage
 */
export async function uploadAudio(
    audioBuffer: Buffer,
    podcastId: string
): Promise<string> {
    const app = getFirebaseApp();
    const bucket = app.storage().bucket();

    const filename = `podcasts/${podcastId}/${uuidv4()}.mp3`;
    const file = bucket.file(filename);

    console.log(`☁️ Uploading to Firebase: ${filename}`);

    await file.save(audioBuffer, {
        metadata: {
            contentType: 'audio/mpeg',
            cacheControl: 'public, max-age=31536000',
        },
    });

    // Make the file public
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    console.log(`✅ Uploaded: ${publicUrl}`);

    return publicUrl;
}

/**
 * Delete audio from Firebase Storage
 */
export async function deleteAudio(podcastId: string): Promise<void> {
    try {
        const app = getFirebaseApp();
        const bucket = app.storage().bucket();

        await bucket.deleteFiles({
            prefix: `podcasts/${podcastId}/`,
        });
        console.log(`🗑️ Deleted files for podcast: ${podcastId}`);
    } catch (error) {
        console.error(`Failed to delete files for podcast ${podcastId}:`, error);
    }
}
