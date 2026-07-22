import {Button} from '@astryxdesign/core/Button';
import styles from './login.module.css';

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <p className={styles.eyebrow}>RECOIL RIVER</p>
        <h1 id="login-title">Enter your river</h1>
        <p className={styles.intro}>Choose how you want to continue. Authentication connects here next.</p>
        <nav className={styles.actions} aria-label="Account access">
          <Button label="Log in" size="lg" variant="primary" type="button" />
          <Button label="Register" size="lg" variant="secondary" type="button" />
        </nav>
      </section>
    </main>
  );
}
