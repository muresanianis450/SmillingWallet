

const KEY = "app_activity";

export function saveActivity(data: any) {
    localStorage.setItem(KEY,JSON.stringify(data));
}

export function getActivity() {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
}

