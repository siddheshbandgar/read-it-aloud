/**
 * Anonymous User ID Hook
 * Generates and persists a unique user ID in localStorage
 */

'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'read-it-aloud-user-id';

/**
 * Get or create an anonymous user ID
 * Persists in localStorage for returning users
 */
export function getAnonymousUserId(): string {
    if (typeof window === 'undefined') {
        return 'server-side';
    }

    let userId = localStorage.getItem(USER_ID_KEY);

    if (!userId) {
        userId = `anon-${uuidv4()}`;
        localStorage.setItem(USER_ID_KEY, userId);
        console.log('🆔 Created new anonymous user ID:', userId);
    }

    return userId;
}

/**
 * React hook to get anonymous user ID
 */
export function useAnonymousUserId(): string | null {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        setUserId(getAnonymousUserId());
    }, []);

    return userId;
}

/**
 * Clear the anonymous user ID (for testing/reset)
 */
export function clearAnonymousUserId(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_ID_KEY);
    }
}
