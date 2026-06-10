import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCookie } from '../tracking/cookies';
import { AUTH_COOKIE } from '../services/api';

/**
 * Subscribes to /topic/notifications/{userId} over STOMP/SockJS.
 * Calls onMessage whenever a push notification arrives (e.g. NEW_OFFER).
 * Automatically connects on mount and disconnects on unmount.
 */
export function useNotificationSocket(onMessage: (type: string, payload: string) => void) {
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const raw = getCookie(AUTH_COOKIE);
        if (!raw) return;

        let userId: string;
        let token: string;
        try {
            const user = JSON.parse(raw);
            userId = user.id;
            token  = user.token;
            if (!userId || !token) return;
        } catch {
            return;
        }

        const client = new Client({
            // SockJS factory — proxied by Vite to https://localhost:8080
            webSocketFactory: () => new SockJS('/ws-smiling-wallet'),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            onConnect: () => {
                client.subscribe(`/topic/notifications/${userId}`, (frame) => {
                    try {
                        const body = JSON.parse(frame.body) as { type: string; payload: string };
                        onMessage(body.type, body.payload);
                    } catch {
                        // malformed frame — ignore
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP error', frame);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // only on mount — onMessage is captured via closure
}
