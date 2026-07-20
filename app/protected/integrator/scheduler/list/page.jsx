'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { Table } from '@/components/elements/table/table';
import { Button } from 'react-bootstrap';
import { useRouter, useSearchParams } from 'next/navigation';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { MdDelete, MdPayment } from 'react-icons/md';
import { TiEdit } from 'react-icons/ti';
import DeleteConfirmation from '@/components/elements/ConfirmDialogue';
import ErrorDialogue from '@/components/elements/errorDialogue';
import { dateFormatted, getStatusColorCode } from '@/utils/helpers';
import Tooltip from '@mui/material/Tooltip';
import { useSession } from 'next-auth/react';
import { useSchedulerList } from '@/hooks/useSchedulerList';
import { PaymentModal } from '../../components/PaymentModal';
import { resolvePaymentAmount } from '@/src/constants/payment';
import {
  SCHEDULER_STATUS,
  normalizeSchedulerStatus,
  isSchedulerAwaitingPayment,
  isSchedulerInProgress,
  getStatusLabel
} from '@/app/api/constants/statuses';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function SchedulerListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const filter = searchParams.get('filter') || 'all';

  const {
    schedules,
    loading,
    error,
    fetchSchedules,
    handleDelete,
    handleStatusChange,
    clearError,
    currentUserId,
    currentIntegratorId,
    isReceivingIntegratorSchedule,
    isPayingIntegratorSchedule,
    hasVerifiedReceivingIntegrator,
    isSelfPaymentSchedule
  } = useSchedulerList();
  const [uiError, setUiError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  console.log('schedules:', schedules);

  useEffect(() => {
    fetchSchedules(filter);
  }, [filter, currentUserId, currentIntegratorId, session?.user?.role]);

  const handlePayment = (schedule) => {
    setSelectedSchedule(schedule);
    setShowPaymentModal(true);
  };

  // Resolve amount in pence: backend paymentAmount → estimatedAmount → MOCK_PAYMENT_AMOUNT
  const getPaymentAmount = (schedule) => resolvePaymentAmount(schedule);

  const isEngineerSchedule = (schedule) => schedule.engineer?._id === currentUserId;
  const isBookingIntegratorSchedule = (schedule) =>
    (schedule.integrator?._id || schedule.integrator) === currentIntegratorId;

  const canPay = (schedule) =>
    session?.user?.role === 'integrator' &&
    isBookingIntegratorSchedule(schedule) &&
    isSchedulerAwaitingPayment(schedule);

  const canApprove = (schedule) =>
    session?.user?.role === 'integrator' &&
    normalizeSchedulerStatus(schedule.status) === SCHEDULER_STATUS.ACCEPTED &&
    isReceivingIntegratorSchedule(schedule);

  const canStartSchedule = (schedule) => {
    const normalizedStatus = normalizeSchedulerStatus(schedule.status);
    return (
      normalizedStatus === SCHEDULER_STATUS.READY_TO_START &&
      (isEngineerSchedule(schedule) ||
        (session?.user?.role === 'integrator' &&
          [isReceivingIntegratorSchedule(schedule), isPayingIntegratorSchedule(schedule)].some(Boolean)))
    );
  };

  const canCompleteSchedule = (schedule) =>
    isSchedulerInProgress(schedule.status) &&
    (isEngineerSchedule(schedule) ||
      (session?.user?.role === 'integrator' &&
        [isReceivingIntegratorSchedule(schedule), isPayingIntegratorSchedule(schedule)].some(Boolean)));

  const getStatusDisplay = (schedule) => {
    const normalizedStatus = normalizeSchedulerStatus(schedule.status);

    if (normalizedStatus === SCHEDULER_STATUS.ACCEPTED) {
      return 'Awaiting Integrator Approval';
    }

    if (
      normalizedStatus === SCHEDULER_STATUS.APPROVED ||
      normalizedStatus === SCHEDULER_STATUS.AWAITING_PAYMENT
    ) {
      return 'Approved - Awaiting Payment';
    }

    if (normalizedStatus === SCHEDULER_STATUS.READY_TO_START) {
      return 'Paid - Ready to Start';
    }

    return getStatusLabel(normalizedStatus);
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
            <span className={`badge ${getStatusColorCode(value)}`}>{getStatusDisplay(row.original)}</span>
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
            {session?.user?.role === 'engineer' &&
              normalizeSchedulerStatus(row.original.status) === SCHEDULER_STATUS.PENDING &&
              isEngineerSchedule(row.original) && (
                <>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleStatusChange(row.original._id, SCHEDULER_STATUS.ACCEPTED)}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleStatusChange(row.original._id, SCHEDULER_STATUS.DECLINED)}
                  >
                    Decline
                  </Button>
                </>
              )}

            {canApprove(row.original) && (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => handleStatusChange(row.original._id, SCHEDULER_STATUS.APPROVED)}
                >
                  Approve Job
                </Button>
              )}

            {/* Pay for Service button - show only after approval */}
            {canPay(row.original) && (
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

            {canStartSchedule(row.original) && (
              <Button
                size="sm"
                variant="outline-success"
                data-testid="scheduler-status-action"
                onClick={() => handleStatusChange(row.original._id, SCHEDULER_STATUS.IN_PROGRESS)}
              >
                Start Job
              </Button>
            )}

            {canCompleteSchedule(row.original) && (
              <Button
                size="sm"
                variant="outline-secondary"
                data-testid="scheduler-status-action"
                onClick={() => handleStatusChange(row.original._id, SCHEDULER_STATUS.COMPLETED)}
              >
                Mark Completed
              </Button>
            )}

            {/* Delete button — hidden for awaiting-payment schedules */}
            {session?.user?.role === 'integrator' && isBookingIntegratorSchedule(row.original) && !isSchedulerAwaitingPayment(row.original) && (
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
            )}
          </div>
        )
      }
    ],
    [schedules, session, currentUserId, currentIntegratorId]
  );

  return (
    <>
      <div className={`ms-5 me-5 mt-2 ${!loading ? 'overlay__block' : null}`}>
        <div className="card-body">
          <h3 className="card-title ms-2 mb-2">
            {filter === 'accepted' && 'Accepted Schedules'}
            {filter === 'awaiting-approval' && 'Schedules Awaiting Integrator Approval'}
            {filter === 'in-progress' && 'In Progress Schedules'}
            {filter === 'awaiting-payment' && 'Schedules Awaiting Payment'}
            {filter === 'ready-to-start' && 'Schedules Ready to Start'}
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
                variant={filter === 'approval' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=approval')}
                data-testid="scheduler-filter-approval"
              >
                Approval
              </Button>
                <Button
                variant={filter === 'pending' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=pending')}
                data-testid="scheduler-filter-pending"
              >
                Pending Acceptance
              </Button> 
              <Button
                variant={filter === 'awaiting-approval' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=awaiting-approval')}
                data-testid="scheduler-filter-awaiting-approval"
              >
                Awaiting Approval
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
              <Button
                variant={filter === 'ready-to-start' ? 'primary' : 'outline-primary'}
                size="sm"
                onClick={() => router.push('/protected/integrator/scheduler/list?filter=ready-to-start')}
                data-testid="scheduler-filter-ready-to-start"
              >
                Ready To Start
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
      {(error || uiError) && <ErrorDialogue showError={error || uiError} onClose={() => {
        clearError();
        setUiError('');
      }} />}

      {showPaymentModal && selectedSchedule && (
        <Elements stripe={stripePromise}>
          <PaymentModal
            schedulerId={selectedSchedule._id}
            engineerId={selectedSchedule.engineer?._id}
            amount={getPaymentAmount(selectedSchedule)}
            receivingIntegratorId={selectedSchedule.receivingIntegratorId?._id || selectedSchedule.receivingIntegratorId}
            isOpen={showPaymentModal}
            schedule={selectedSchedule}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setShowPaymentModal(false);
              fetchSchedules(filter);
            }}
            onError={setUiError}
          />
        </Elements>
      )}
    </>
  );
}

export default function SchedulerList() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SchedulerListContent />
    </Suspense>
  );
}
