export type NavIconName = 'home' | 'inbox' | 'document' | 'key' | 'cog';

export interface NavItem {
  label: string;
  path: string;
  icon: NavIconName;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Overview', path: '/', icon: 'home' },
  { label: 'Emails', path: '/emails', icon: 'inbox' },
  { label: 'Templates', path: '/templates', icon: 'document' },
  { label: 'API Keys', path: '/api-keys', icon: 'key' },
  { label: 'Settings', path: '/settings', icon: 'cog' },
];
