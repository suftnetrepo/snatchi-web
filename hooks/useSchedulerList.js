'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { zat } from '@/utils/api';
import { VERBS } from '@/config';
import { SCHEDULER } from '@/utils/apiUrl';
import {
  SCHEDULER_STATUS,
  normalizeSchedulerStatus,
  isSchedulerAwaitingPayment,
  isSchedulerInProgress
} from '@/app/api/constants/statuses';

export const useSchedulerList = () => {
  const { data: session } = useSession();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUserId = session?.user?.id || null;
  const currentIntegratorId = session?.user?.integrator || session?.user?.integrator_id || null;

  const isReceivingIntegratorSchedule = (schedule) =>
    (schedule.receivingIntegratorId?._id || schedule.receivingIntegratorId) === currentIntegratorId;

  const isPayingIntegratorSchedule = (schedule) =>
    (schedule.payingIntegrator?._id || schedule.payingIntegrator || schedule.integrator) ===
    currentIntegratorId;

  const hasVerifiedReceivingIntegrator = (schedule) => {
    const receivingIntegrator = schedule.receivingIntegratorId;

    if (!receivingIntegrator || typeof receivingIntegrator !== 'object') {
      return false;
    }

    return (
      receivingIntegrator.connectAccountStatus === 'verified' &&
      receivingIntegrator.chargesEnabled &&
      receivingIntegrator.payoutsEnabled &&
      !!receivingIntegrator.stripeConnectAccountId
    );
  };

  const isSelfPaymentSchedule = (schedule) =>
    isPayingIntegratorSchedule(schedule) && isReceivingIntegratorSchedule(schedule);

  const isReadyToStart = (schedule) =>
    normalizeSchedulerStatus(schedule.status) === SCHEDULER_STATUS.READY_TO_START;

  const isAwaitingApproval = (schedule) =>
    normalizeSchedulerStatus(schedule.status) === SCHEDULER_STATUS.ACCEPTED &&
    isReceivingIntegratorSchedule(schedule);

  const fetchSchedules = async (filter = 'all') => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        action: 'getAllSchedules'
      });
      const response = await zat(SCHEDULER.getByEngineer, null, VERBS.GET, params);

      if (response.success && response.data) {
        let filtered = response.data;

        // Apply filtering based on query parameter
        if (filter === 'accepted') {
          filtered = filtered.filter(s => normalizeSchedulerStatus(s.status) === SCHEDULER_STATUS.ACCEPTED);
        } else if (filter === 'approval') {
          filtered = filtered.filter(s => normalizeSchedulerStatus(s.status) === SCHEDULER_STATUS.APPROVED);
        } else if (filter === 'awaiting-payment') {
          filtered = filtered.filter(s => isSchedulerAwaitingPayment(s));
        } else if (filter === 'pending') {
          filtered = filtered.filter(s => normalizeSchedulerStatus(s.status) === SCHEDULER_STATUS.PENDING);
        } else if (filter === 'awaiting-approval') {
          filtered = filtered.filter(isAwaitingApproval);
        } else if (filter === 'in-progress') {
          filtered = filtered.filter(isSchedulerInProgress);
        } else if (filter === 'ready-to-start') {
          filtered = filtered.filter(isReadyToStart);
        }

        setSchedules(filtered);
      }
    } catch (err) {
      setError('Failed to fetch schedules');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      const params = new URLSearchParams({
        id: scheduleId
      });
      const response = await zat(SCHEDULER.removeOne, null, VERBS.DELETE, params);
      if (response.success) {
        setSchedules(schedules.filter(s => s._id !== scheduleId));
      }
    } catch (err) {
      setError('Failed to delete schedule');
    }
  };

  const handleStatusChange = async (scheduleId, newStatus) => {
    try {

        const response = await zat(SCHEDULER.updatestatus, { status: newStatus }, VERBS.PUT, {
          id : scheduleId,
          action: 'status'
        });

       if (response.success) {
        setSchedules(
          schedules.map(s =>
            s._id === scheduleId ? response.data : s
          )
        );
      }
    } catch (err) {
      setError(err.message || 'Failed to update schedule status');
    }
  };

  const clearError = () => setError('');

  return {
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
  };
};
