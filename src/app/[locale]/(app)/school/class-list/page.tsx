/** `/school/class-list` — SC3 "Sinif siyahısı". Guard `auth` + flag `school`. */
import { assertSchoolEnabled, ClassListView } from '@/modules/school';

export const dynamic = 'force-dynamic';

export default function SchoolClassListPage() {
  assertSchoolEnabled();
  return <ClassListView />;
}
