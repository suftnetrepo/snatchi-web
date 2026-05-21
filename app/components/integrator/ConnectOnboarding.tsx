'use client';

import React, { useState, useEffect } from 'react';

interface ConnectStatus {
  status: string;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  bankAccountOnFile: boolean;
  requirementsStatus: string | null;
  onboardingStartedAt: string | null;
  onboardingCompletedAt: string | null;
}

export default function ConnectOnboardingComponent() {
  const [connectStatus, setConnectStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiatingOnboarding, setInitiatingOnboarding] = useState(false);

  useEffect(() => {
    fetchConnectStatus();
  }, []);

  const fetchConnectStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/integrator/connect-status');

      if (!response.ok) {
        throw new Error('Failed to fetch Connect status');
      }

      const data = await response.json();
      setConnectStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Connect status');
    } finally {
      setLoading(false);
    }
  };

  const handleStartOnboarding = async () => {
    try {
      setInitiatingOnboarding(true);
      const response = await fetch('/api/stripe/integrator/create-onboarding-link', {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start onboarding');
      }

      const data = await response.json();
      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start onboarding');
      setInitiatingOnboarding(false);
    }
  };

  const handleResumeOnboarding = async () => {
    try {
      setInitiatingOnboarding(true);
      const response = await fetch('/api/stripe/integrator/retrieve-onboarding-link', {
        method: 'POST'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to retrieve onboarding link');
      }

      const data = await response.json();
      // Redirect to Stripe onboarding
      window.location.href = data.onboardingUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume onboarding');
      setInitiatingOnboarding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'success';
      case 'onboarding_started':
        return 'warning';
      case 'requirements_pending':
        return 'warning';
      case 'verification_failed':
        return 'danger';
      case 'restricted':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'onboarding_started':
        return 'Onboarding in Progress';
      case 'verified':
        return 'Verified & Active';
      case 'requirements_pending':
        return 'Additional Info Needed';
      case 'verification_failed':
        return 'Verification Failed';
      case 'restricted':
        return 'Restricted';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div data-testid="connect-onboarding-loading" className="alert alert-info">
        Loading Stripe Connect status...
      </div>
    );
  }

  return (
    <div data-testid="connect-onboarding-component" className="card">
      <div className="card-header bg-light">
        <h5 className="card-title mb-0">Receive Payments - Stripe Connect Setup</h5>
      </div>

      <div className="card-body">
        {error && (
          <div data-testid="connect-error" className="alert alert-danger alert-dismissible fade show">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {connectStatus && (
          <>
            {/* Status Section */}
            <div className="mb-4">
              <h6 className="text-muted mb-3">Connection Status</h6>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-center mb-3">
                    <span 
                      data-testid="connect-status-badge"
                      className={`badge bg-${getStatusColor(connectStatus.status)} me-2`}
                    >
                      {getStatusLabel(connectStatus.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            {connectStatus.accountId && (
              <div className="mb-4">
                <h6 className="text-muted mb-3">Account Information</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-borderless mb-0">
                    <tbody>
                      <tr>
                        <td className="text-muted">Account ID:</td>
                        <td>
                          <code data-testid="connect-account-id">{connectStatus.accountId}</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Charges Enabled:</td>
                        <td>
                          <span 
                            data-testid="connect-charges-enabled"
                            className={connectStatus.chargesEnabled ? 'text-success' : 'text-danger'}
                          >
                            {connectStatus.chargesEnabled ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Payouts Enabled:</td>
                        <td>
                          <span 
                            data-testid="connect-payouts-enabled"
                            className={connectStatus.payoutsEnabled ? 'text-success' : 'text-danger'}
                          >
                            {connectStatus.payoutsEnabled ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="text-muted">Bank Account on File:</td>
                        <td>
                          <span 
                            data-testid="connect-bank-account"
                            className={connectStatus.bankAccountOnFile ? 'text-success' : 'text-warning'}
                          >
                            {connectStatus.bankAccountOnFile ? '✓ Yes' : '✗ No'}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline */}
            {(connectStatus.onboardingStartedAt || connectStatus.onboardingCompletedAt) && (
              <div className="mb-4">
                <h6 className="text-muted mb-3">Timeline</h6>
                {connectStatus.onboardingStartedAt && (
                  <p className="mb-2">
                    <small className="text-muted">Onboarding Started:</small>
                    <br />
                    <small data-testid="connect-started-at">
                      {new Date(connectStatus.onboardingStartedAt).toLocaleDateString()}
                    </small>
                  </p>
                )}
                {connectStatus.onboardingCompletedAt && (
                  <p className="mb-2">
                    <small className="text-muted">Onboarding Completed:</small>
                    <br />
                    <small className="text-success" data-testid="connect-completed-at">
                      {new Date(connectStatus.onboardingCompletedAt).toLocaleDateString()}
                    </small>
                  </p>
                )}
              </div>
            )}

            {/* Instructions & Actions */}
            <div className="mb-0">
              {connectStatus.status === 'not_started' && (
                <>
                  <p className="text-muted mb-3">
                    To receive payments from other companies for engineer services, you need to set up Stripe Connect.
                    This allows other integrators to pay you directly through Snatchi.
                  </p>
                  <button
                    data-testid="connect-start-button"
                    className="btn btn-primary"
                    onClick={handleStartOnboarding}
                    disabled={initiatingOnboarding}
                  >
                    {initiatingOnboarding ? 'Setting up...' : 'Start Stripe Connect Setup'}
                  </button>
                </>
              )}

              {connectStatus.status === 'onboarding_started' && (
                <>
                  <div className="alert alert-info mb-3">
                    <small>
                      Your Stripe Connect onboarding is in progress. Complete the setup to verify your account
                      and start receiving payments.
                    </small>
                  </div>
                  <button
                    data-testid="connect-resume-button"
                    className="btn btn-warning"
                    onClick={handleResumeOnboarding}
                    disabled={initiatingOnboarding}
                  >
                    {initiatingOnboarding ? 'Resuming...' : 'Resume Onboarding'}
                  </button>
                </>
              )}

              {connectStatus.status === 'requirements_pending' && (
                <>
                  <div className="alert alert-warning mb-3">
                    <small>
                      Your Stripe Connect account needs additional information to complete verification.
                      Please provide the required details to activate your account.
                    </small>
                  </div>
                  <button
                    data-testid="connect-complete-button"
                    className="btn btn-warning"
                    onClick={handleResumeOnboarding}
                    disabled={initiatingOnboarding}
                  >
                    {initiatingOnboarding ? 'Updating...' : 'Complete Verification'}
                  </button>
                </>
              )}

              {connectStatus.status === 'verified' && (
                <div className="alert alert-success mb-0">
                  <strong>✓ Ready to Receive Payments</strong>
                  <br />
                  <small>Your Stripe Connect account is verified and active. Other companies can now pay you for engineer services.</small>
                </div>
              )}

              {connectStatus.status === 'verification_failed' && (
                <>
                  <div className="alert alert-danger mb-3">
                    <strong>✗ Verification Failed</strong>
                    <br />
                    <small>Your Stripe Connect verification failed. Please review the requirements and try again.</small>
                  </div>
                  <button
                    data-testid="connect-retry-button"
                    className="btn btn-danger"
                    onClick={handleStartOnboarding}
                    disabled={initiatingOnboarding}
                  >
                    {initiatingOnboarding ? 'Retrying...' : 'Retry Verification'}
                  </button>
                </>
              )}

              {connectStatus.status === 'restricted' && (
                <div className="alert alert-danger mb-0">
                  <strong>✗ Account Restricted</strong>
                  <br />
                  <small>Your account has been restricted. Please contact Stripe support for assistance.</small>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
