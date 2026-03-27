

import {saveActivity, getActivity} from "./storage";
import { getCookie } from "./cookies"

export function trackEvent(event: string, data?: any) {
    const userId = getCookie("user_id");
    const lastEvent = localStorage.getItem('last_event');
    const activity = getActivity();

    activity.push({
        userId,
        event,
        data,
        timestamp: Date.now(),
    });


    if (lastEvent === JSON.stringify(activity)) {
        return;
    }
    saveActivity(activity);
}