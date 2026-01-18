/**
 * Supabase Storage Service
 * Uploads audio files to Supabase Storage
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client
 */
function getSupabaseClient(): SupabaseClient {
    if (supabaseClient) {
        return supabaseClient;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    supabaseClient = createClient(url, serviceKey, {
        auth: {
            persistSession: false,
        },
    });

    console.log('✅ Supabase client initialized');
    return supabaseClient;
}

/**
 * Upload audio to Supabase Storage
 */
export async function uploadAudioToSupabase(
    audioBuffer: Buffer,
    podcastId: string
): Promise<string> {
    const client = getSupabaseClient();
    const bucketName = 'podcasts';
    const filename = `${podcastId}/${uuidv4()}.mp3`;

    console.log(`☁️ Uploading to Supabase: ${filename}`);

    const { data, error } = await client.storage
        .from(bucketName)
        .upload(filename, audioBuffer, {
            contentType: 'audio/mpeg',
            cacheControl: '31536000', // 1 year
            upsert: false,
        });

    if (error) {
        console.error('❌ Supabase upload error:', error);
        throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = client.storage
        .from(bucketName)
        .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;
    console.log(`✅ Uploaded to Supabase: ${publicUrl}`);

    return publicUrl;
}

/**
 * Delete audio from Supabase Storage
 */
export async function deleteAudioFromSupabase(podcastId: string): Promise<void> {
    try {
        const client = getSupabaseClient();
        const bucketName = 'podcasts';

        const { data: files, error: listError } = await client.storage
            .from(bucketName)
            .list(podcastId);

        if (listError) {
            console.error(`Failed to list files for ${podcastId}:`, listError);
            return;
        }

        if (files && files.length > 0) {
            const filePaths = files.map(f => `${podcastId}/${f.name}`);
            const { error: deleteError } = await client.storage
                .from(bucketName)
                .remove(filePaths);

            if (deleteError) {
                console.error(`Failed to delete files:`, deleteError);
            } else {
                console.log(`🗑️ Deleted ${files.length} files for podcast: ${podcastId}`);
            }
        }
    } catch (error) {
        console.error(`Failed to delete files for podcast ${podcastId}:`, error);
    }
}
