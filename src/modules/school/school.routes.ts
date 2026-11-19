/** The routes this module owns (docs/ROUTES.md "Idea modules"). */
export interface SchoolRoute {
  id: 'school' | 'schoolGrades' | 'schoolClassList' | 'schoolStudentCard';
  path: string;
  guard: 'auth';
  flag: 'school';
  layout: 'app-shell';
}

export const schoolRoutes: readonly SchoolRoute[] = [
  { id: 'school', path: '/school', guard: 'auth', flag: 'school', layout: 'app-shell' },
  { id: 'schoolGrades', path: '/school/grades', guard: 'auth', flag: 'school', layout: 'app-shell' },
  {
    id: 'schoolClassList',
    path: '/school/class-list',
    guard: 'auth',
    flag: 'school',
    layout: 'app-shell',
  },
  {
    id: 'schoolStudentCard',
    path: '/school/student-card',
    guard: 'auth',
    flag: 'school',
    layout: 'app-shell',
  },
] as const;
