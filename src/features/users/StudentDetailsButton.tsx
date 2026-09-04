import { useState } from 'react';
import { apiErrorMessage } from '../../api/apiErrorMessage';
import { Modal } from '../../components/Modal';
import { adminApplicationApi } from '../adminApplications/adminApplicationApi';
import { adminUserApi, type AdminUser } from './adminUserApi';
import { AdminUserDetails } from './AdminUsersPage';

export function StudentDetailsButton({
  name,
  userId,
  applicationId,
}: {
  name: string;
  userId?: string;
  applicationId?: string;
}) {
  const [student, setStudent] = useState<AdminUser | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    setError('');
    try {
      const id =
        userId ??
        (await adminApplicationApi.detail(String(applicationId))).application.studentUserId;
      setStudent(await adminUserApi.get(id));
    } catch (reason) {
      setError(apiErrorMessage(reason, 'Öğrenci bilgileri yüklenemedi.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        className="student-name-button"
        type="button"
        disabled={loading}
        onClick={() => void open()}
      >
        {loading ? 'Yükleniyor…' : name}
      </button>
      {error && <small className="inline-error">{error}</small>}
      {student && (
        <Modal title={`${student.firstName} ${student.lastName}`} onClose={() => setStudent(null)}>
          <AdminUserDetails user={student} student />
        </Modal>
      )}
    </>
  );
}
