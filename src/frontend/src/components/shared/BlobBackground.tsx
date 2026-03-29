// @ts-ignore
import styles from './BlobBackground.module.css';

export function BlobBackground() {
    return (
        <div className={styles.blobWrap}>
            <div className={`${styles.blob} ${styles.blob1}`} />
            <div className={`${styles.blob} ${styles.blob2}`} />
            <div className={`${styles.blob} ${styles.blob3}`} />
            <div className={`${styles.blob} ${styles.blob4}`} />
            <div className={`${styles.blob} ${styles.blob5}`} />
            <div className={`${styles.blob} ${styles.blob6}`} />
        </div>
    );
}