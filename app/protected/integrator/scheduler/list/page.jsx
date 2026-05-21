'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import { MdDelete, MdPayment } from 'react-icons/md';
import { TiEdit } from 'react-icons/ti';
import DeleteConfirmation from '@/components/elements/ConfirmDialogue';
import ErrorDialogue from '@/components/elements/errorDialogue';
import { dateFormatted, getStatusColorCode } from '@/utils/helpers';
import Tooltip from '@mui/material/Tooltip';
import { useSession } from 'next-auth/react';
import { useSchedulerList } from '@/hooks/useSchedulerList';

const SchedulerList = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const filter = searchParams.get('filter') || 'all';

  const { schedules, loading, error, fetchSchedules, handleDelete, handleStatusChange } = useSchedulerList();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    fetchSchedules(filter);
  }, [filter]);

  const handlePayment = (schedule) => {
    setSelectedSchedule(schedule);
    setShowPaymentModal(true);
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Title',
        accessor: 'title',
        sortType: 'basic',
        Cell: ({ value }) => <div className="d-flex align-items-center">{value}</div>
      },
      {
        Header: 'Engineer',
        accessor: row => `${row.engineer?.first_name || ''} ${row.engineer?.last_name || ''}`,
        Cell: ({ value }) => <div className="d-flex align-items-center">{value}</div>
      },
      {
        Header: 'Start Date',
        accessor: 'startDate',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'End Date',
        accessor: 'endDate',
        Cell: ({ value }) => <div className="d-flex align-items-center">{dateFormatted(value)}</div>
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value, row }) => (
          <div className="d-flex justify-content-start align-items-center">
            <span className={`badge ${getStatusColorCode(value)}`}>{value}</span>
          </div>
        )
      },
      {
        Header: 'Amount',
        accessor: 'estimatedAmount',
        Cell: ({ value }) => <div>£{value?.toFixed(2) || '0.00'}</div>
      },
      {
        Header: 'Payment Status',
        accessor: 'paymentStatus',
        Cell: ({ value }) => (
          <small className="d-flex align-items-center">
            <span className={`badge ${value === 'succeeded' ? 'bg-success' : value === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
              {value || 'pending'}
            </span>
          </small>
        )
      },
      {
        Header: 'Actions',
        accessor: 'actions',
        disableSortBy: true,
        headerClassName: 'text-center actions-header',
        className: 'text-center actions-cell',
        Cell: ({ row }) => (
          <div className="d-flex justify-content-center align-items-center gap-2">
            {/* Pay for Service button - show for awaiting payment */}
            {row.original.status === 'Accepted' &&
              (!row.original.paymentStatus || row.original.paymentStatus === 'pending') &&
              row.original.estimatedAmount > 0 && (
                <Tooltip title="Pay for Service" arrow>
                  <span className="p-0">
                    <MdPayment
                      size={24}
                      className="pointer"
                      data-testid="scheduler-pay-service-button"
                      onClick={() => handlePayment(row.original)}
                      style={{ color: '#28a745' }}
                    />
                  </span>
                </Tooltip>
              )}

            {/* Status change - allow Progress for Accepted, Completed for Progress */}
            {(row.original.status === 'Accepted' || row.original.status === 'Progress') && (
              <Tooltip title="Change Status" arrow>
                <select
                  className="form-select form-select-sm"
                  style={{ width: '120px' }}
                  value={row.original.status}
                  onChange={(e) => handleStatusChange(row.original._id, e.target.value)}
                  data-testid="scheduler-status-action"
                >
                  <option value={row.original.status}>{row.original.status}</option>
                  {row.original.status === 'Accepted' && (
                    <option value="Progress">Move to Progress</option>
                  )}
                  {(row.original.status === 'Progress' || row.original.status === 'In Progress') && (
                    <option value="Completed">Mark Completed</option>
                  )}
                </select>
              </Tooltip>
            )}

            {/* Delete button */}
            <Tooltip title="Delete Schedule" arrow>
              <span className="p-0">
                <DeleteConfirmation
                  onConfirm={async () => {
                    handleDelete(row.original._id);
                  }}
                  onCancel={() => {}}
                  itemId={row.original._id}
                >
                  <MdDelete size={24} className="pointer" />
                </DeleteConfirmation>
              </span>
            </Tooltip>
          </div>
        )
      }
    ],
    [schedules]
  );

  return (
    <>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <h3 className="card-title ms-2 mb-2">
            {filter === 'accepted' && 'Accepted Schedules'}
            {filter === 'in-progress' && 'In Progress Schedules'}
            {filter === 'awaiting-payment' && 'Schedules Awaiting Payment'}
            {!filter || filter === 'all' ? 'All Schedules' : ''}
          </h3>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-2">
              <Button
                variant={!filter || filter === 'all' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list')}
                data-testid="scheduler-filter-all"
              >
                All
              </Button>
              <Button
                variant={filter === 'accepted' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=accepted')}
                data-testid="scheduler-filter-accepted"
              >
                Accepted
              </Button>
              <Button
                variant={filter === 'in-progress' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=in-progress')}
                data-testid="scheduler-filter-in-progress"
              >
                In Progress
              </Button>
              <Button
                variant={filter === 'awaiting-payment' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=awaiting-payment')}
                data-testid="scheduler-filter-awaiting-payment"
              >
                Awaiting Payment
              </Button>
            </div>
          </div>

          {schedules.length === 0 && !loading && (
            <div className="alert alert-info">
              No schedules found for this filter.
            </div>
          )}

          {schedules.length > 0 && (
            <Table
              data={schedules}
              columns={columns}
              pageCount={1}
              loading={loading}
              fetchData={() => {}}
            />
          )}
        </div>
      </div>
      {!loading && <span className="overlay__block" />}
      {error && <ErrorDialogue showError={error} onClose={() => setError('')} />}

      {/* Payment Modal - placeholder for future implementation */}
      {showPaymentModal && selectedSchedule && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Pay for Service</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Service:</strong> {selectedSchedule.title}
                </p>
                <p>
                  <strong>Amount:</strong> £{selectedSchedule.estimatedAmount?.toFixed(2)}
                </p>
                <p>
                  <strong>Receiving Integrator:</strong>{' '}
                  {selectedSchedule.receivingIntegratorId?.name || 'Unknown'}
                </p>
                <button className="btn btn-primary w-100">Proceed to Payment</button>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SchedulerList;
