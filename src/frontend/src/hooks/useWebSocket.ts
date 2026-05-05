import { useEffect, useRef, useState, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

export interface ChatMessage {
    messageId: string;
    appointmentId: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    timestamp: string;
}

interface UseWebSocketOptions {
    appointmentId: string | null;
    onMessage: (msg: ChatMessage) => void;
}

export function useWebSocket({ appointmentId, onMessage }: UseWebSocketOptions) {
    const clientRef = useRef<Client | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!appointmentId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws-smiling-wallet'),
            reconnectDelay: 3000,
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/topic/chat/${appointmentId}`, (frame: IMessage) => {
                    try {
                        const msg: ChatMessage = JSON.parse(frame.body);
                        onMessage(msg);
                    } catch (_) {}
                });
            },
            onDisconnect: () => setConnected(false),
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
            setConnected(false);
        };
    }, [appointmentId]);

    const sendMessage = useCallback((dto: Omit<ChatMessage, 'messageId' | 'timestamp'>) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(dto),
            });
        }
    }, []);

    return { connected, sendMessage };
}