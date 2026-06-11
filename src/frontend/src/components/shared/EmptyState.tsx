import styles from './EmptyState.module.css';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>
        <Icon name={icon} size={48} strokeWidth={1.5} />
      </div>
      <p>{message}</p>
    </div>
  );
}
