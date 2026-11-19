/** `/school/student-card` — SC4 "Tələbə kartı". Guard `auth` + flag `school`. */
import { assertSchoolEnabled, StudentCardView } from '@/modules/school';

export const dynamic = 'force-dynamic';

export default function SchoolStudentCardPage() {
  assertSchoolEnabled();
  return <StudentCardView />;
}
