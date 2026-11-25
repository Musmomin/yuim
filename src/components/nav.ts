import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  Inbox,
  ClipboardCheck,
  FilePlus2,
  FileSignature,
  FileText,
  Info,
  LayoutDashboard,
  LineChart,
  PieChart,
  ScrollText,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '../data/types';

const STAFF: Role[] = ['admin', 'menejer', 'komplayens', 'investitsiya', 'yuridik', 'audit'];

export const NAV: { to: string; label: string; icon: LucideIcon; roles: Role[] }[] = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, roles: [...STAFF, 'investor', 'biznes'] },
  { to: '/vazifalar', label: 'Mening vazifalarim', icon: ClipboardCheck, roles: ['admin', 'menejer', 'komplayens', 'investitsiya', 'yuridik'] },
  { to: '/hujjatlar', label: 'Hujjat aylanishi', icon: Inbox, roles: ['admin', 'menejer', 'komplayens', 'investitsiya', 'yuridik'] },
  { to: '/arizalar', label: 'Arizalar', icon: FileText, roles: STAFF },
  { to: '/arizalar/yangi', label: 'Yangi ariza', icon: FilePlus2, roles: ['admin', 'menejer', 'biznes'] },
  { to: '/shartnomalar', label: 'Shartnomalar', icon: FileSignature, roles: [...STAFF, 'investor'] },
  { to: '/monitoring', label: 'Monitoring', icon: LineChart, roles: [...STAFF, 'investor'] },
  { to: '/taqsimot', label: 'Foyda taqsimoti', icon: PieChart, roles: [...STAFF, 'investor'] },
  { to: '/kalendar', label: 'Kalendar', icon: CalendarDays, roles: [...STAFF, 'investor', 'biznes'] },
  { to: '/statistika', label: 'Ijro statistikasi', icon: BarChart3, roles: STAFF },
  { to: '/investorlar', label: 'Investorlar', icon: Users, roles: ['admin', 'menejer', 'investitsiya', 'audit'] },
  { to: '/siyosat', label: 'Investitsiya siyosati', icon: BookOpen, roles: [...STAFF, 'investor', 'biznes'] },
  { to: '/loyiha', label: 'Loyiha haqida', icon: Info, roles: [...STAFF, 'investor', 'biznes'] },
  { to: '/audit', label: 'Audit jurnali', icon: ScrollText, roles: ['admin', 'audit'] },
];

export const BrandIcon = Briefcase;
