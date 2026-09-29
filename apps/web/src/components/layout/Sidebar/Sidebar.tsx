'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './Sidebar.module.scss';

export function Sidebar() {
  const pathname = usePathname();

  const organizationMatch = pathname.match(
    /^\/organizations\/([^/]+)/,
  );

  const organizationId = organizationMatch?.[1];

  const navigation = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: '⌂',
    },
    {
      label: 'Organizations',
      href: '/organizations',
      icon: '▣',
    },
  ];

  const organizationNavigation = organizationId
    ? [
        {
          label: 'Overview',
          href: `/organizations/${organizationId}`,
          icon: '⌂',
        },
        {
          label: 'Projects',
          href: `/organizations/${organizationId}/projects`,
          icon: '▤',
        },
        {
          label: 'Customers',
          href: `/organizations/${organizationId}/customers`,
          icon: '♙',
        },
        {
          label: 'Tickets',
          href: `/organizations/${organizationId}/tickets`,
          icon: '▱',
        },
        {
          label: 'Audit Logs',
          href: `/organizations/${organizationId}/audit-logs`,
          icon: '☷',
        },
        {
          label: 'Settings',
          href: `/organizations/${organizationId}/settings`,
          icon: '⚙',
        },
      ]
    : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoMark}>O</span>

        <span>OpsFlow</span>
      </div>

      <nav className={styles.navigation}>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${
                isActive ? styles.active : ''
              }`}
            >
              <span className={styles.icon}>
                {item.icon}
              </span>

              <span>{item.label}</span>
            </Link>
          );
        })}

        {organizationNavigation.length > 0 && (
          <>
            <div className={styles.sectionTitle}>
              Organization
            </div>

            {organizationNavigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.link} ${
                    isActive ? styles.active : ''
                  }`}
                >
                  <span className={styles.icon}>
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}