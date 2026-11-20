import {
  Bot,
  Activity,
  LayoutDashboard,
  Building2,
  Newspaper,
  Rocket,
  TrendingUp,
  Info,
  Landmark,
  Megaphone,
} from 'lucide-react';

export const navItems = [
  { id: 'agents', icon: Bot, label: 'Agents', path: '/' },
  { id: 'manage-campaigns', icon: Megaphone, label: 'Manage Campaigns', path: '/manage-campaigns' },
  { id: 'activity', icon: Activity, label: 'Activity', path: '/activity' },
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { id: 'crm', icon: Building2, label: 'CRM', path: '/crm' },
  { id: 'boost', icon: Rocket, label: 'Boost', path: '/boost' },
  { id: 'ranking', icon: TrendingUp, label: 'Ranking', path: '/ranking' },
  { id: 'blog', icon: Newspaper, label: 'Blog & Post', path: '/blog' },
  // { id: 'templates', icon: LayoutTemplate, label: 'Templates', path: '/templates' },
  { id: 'about', icon: Info, label: 'About', path: '/about' },
];

export const agencyNavItem = { id: 'agency', icon: Landmark, label: 'Agency', path: '/agency' };

export function filterNavItems({ isChildClient = false, isAgency = false } = {}) {
  let items = [...navItems];

  if (isChildClient) {
    items = items.filter((i) => !['agents', 'manage-campaigns', 'ranking', 'about'].includes(i.id));
  }

  if (isAgency) {
    items.push(agencyNavItem);
  }

  return items;
}

export function isNavItemActive(item, pathname) {
  if (item.id === 'agents') return pathname === '/';
  return pathname === item.path;
}
