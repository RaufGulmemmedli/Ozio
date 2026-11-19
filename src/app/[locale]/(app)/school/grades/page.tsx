/** `/school/grades` — SC2 "Qiymətlər → xal". Guard `auth` + flag `school`. */
import { assertSchoolEnabled, GradesView } from '@/modules/school';

export const dynamic = 'force-dynamic';

export default function SchoolGradesPage() {
  assertSchoolEnabled();
  return <GradesView />;
}
