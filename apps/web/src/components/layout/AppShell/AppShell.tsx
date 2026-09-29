import { Sidebar } from '../Sidebar/Sidebar';
import { Topbar } from '../Topbar/Topbar';

import styles from './AppShell.module.scss';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <Sidebar />

      <div className={styles.content}>
        <Topbar />

        <main className={styles.main}>
          {children}
        </main>
      </div>
    </div>
  );
}