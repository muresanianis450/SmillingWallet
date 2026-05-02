import { api } from './api'; // Add this import

export const offerService = {
    // SAVE: Try server, fallback to LocalStorage
    async saveOffer(offer: any, isOnline: boolean) {
        if (isOnline) {
            try {
                const response = await api.post('/offers', offer);
                return response.data;
            } catch (err) {
                // Server might be down even if browser says "online"
                return this.queueForSync(offer);
            }
        } else {
            return this.queueForSync(offer);
        }
    },

    queueForSync(offer: any) {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        const newOffer = { ...offer, syncId: Date.now(), status: 'pending' };
        queue.push(newOffer);
        localStorage.setItem('sync_queue', JSON.stringify(queue));
        return newOffer;
    },

    // SYNC: push local data to server
    async syncOfflineData() {
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        if (queue.length === 0) return;

        console.log(`Syncing ${queue.length} items...`);

        const updatedQueue = [];

        for (const item of queue) {
            try {
                // Remove the temporary syncId before sending to server
                const { syncId, status, ...serverData } = item;
                await api.post('/offers', serverData);
            } catch (err) {
                // If it fails again, keep it in the queue
                updatedQueue.push(item);
            }
        }

        localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));
        if (updatedQueue.length === 0) {
            console.log("All data synchronized successfully!");
        }
    }
};