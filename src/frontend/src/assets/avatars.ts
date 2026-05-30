// @ts-ignore
import pfp1 from '../../assets/pfp1.png';
// @ts-ignore
import pfp2 from '../../assets/pfp2.png';
// @ts-ignore
import pfp3 from '../../assets/pfp3.png';
// @ts-ignore
import defaultAvatar from '../../assets/default-avatar.png';

export const DENTIST_AVATARS: string[] = [pfp1, pfp2, pfp3];

export const PATIENT_AVATARS: string[] = Array.from({ length: 10 }, (_, i) => `/avatars/avatar-${i + 1}.svg`);

export const DEFAULT_AVATAR: string = defaultAvatar;
