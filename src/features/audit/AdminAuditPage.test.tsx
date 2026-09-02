import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { auditApi } from './auditApi';
import { AdminAuditPage } from './AdminAuditPage';

vi.mock('./auditApi', () => ({ auditApi: { list: vi.fn() } }));

describe('AdminAuditPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filters records and exposes JSON details with native disclosure', async () => {
    vi.mocked(auditApi.list).mockResolvedValue({
      content: [
        {
          id: 'log-1',
          actorId: 'actor-1',
          actorName: 'Ada Admin',
          actorEmail: 'ada@example.com',
          action: 'APPLICATION_STATUS_CHANGED',
          entityType: 'APPLICATION',
          entityId: 'application-1',
          oldValues: { status: 'SUBMITTED' },
          newValues: { status: 'APPROVED' },
          ipReference: '127.0.0.1',
          requestId: 'request-1',
          createdAt: '2026-09-02T08:00:00Z',
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
    });

    render(<AdminAuditPage />);

    expect(await screen.findByText('APPLICATION_STATUS_CHANGED')).toBeInTheDocument();
    expect(screen.getByText(/"APPROVED"/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('İşlem'), { target: { value: 'APPLICATION_CREATED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Filtrele' }));

    expect(auditApi.list).toHaveBeenLastCalledWith(expect.any(URLSearchParams));
    const params = vi.mocked(auditApi.list).mock.calls.at(-1)?.[0];
    expect(params?.get('action')).toBe('APPLICATION_CREATED');
  });
});
