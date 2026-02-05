import React, { useState } from 'react';
import { api, setAuthSession, setSchoolPrivateKey } from '../lib/api';

export default function Login() {
  const [mode, setMode] = useState('SCHOOL');
  const [firstLogin, setFirstLogin] = useState(false);
  const [flow, setFlow] = useState('LOGIN');
  const [step, setStep] = useState('CREDENTIALS');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [fpStep, setFpStep] = useState('CREDENTIALS');
  const [fpOtpSessionId, setFpOtpSessionId] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [form, setForm] = useState({
    email: '',
    password: '',
    schoolId: '',
    secretId: '',
    privateKey: '',
  });
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetLoginOtp = () => {
    setStep('CREDENTIALS');
    setOtpSessionId('');
    setOtp('');
  };

  const resetForgot = () => {
    setFpStep('CREDENTIALS');
    setFpOtpSessionId('');
    setFpOtp('');
    setFpNewPassword('');
  };

  const resetAll = () => {
    setStatus('');
    setFlow('LOGIN');
    resetLoginOtp();
    resetForgot();
  };

  const requestOtp = async () => {
    setStatus('');
    setIsLoading(true);
    try {
      if (mode === 'SUPER_ADMIN') {
        const res = await api.post('/api/auth/superadmin/request-otp', {
          email: form.email,
          password: form.password,
        });
        setOtpSessionId(res.data.otpSessionId);
        setStep('OTP');
        setStatus('✓ OTP sent to your email');
        return;
      }

      if (mode === 'STAFF') {
        const res = await api.post('/api/auth/staff/request-otp', {
          email: form.email,
          password: form.password,
        });
        setOtpSessionId(res.data.otpSessionId);
        setStep('OTP');
        setStatus('✓ OTP sent to your email');
        return;
      }

      if (firstLogin) {
        const res = await api.post('/api/auth/school/first-login/request-otp', {
          email: form.email,
          password: form.password,
          schoolId: form.schoolId,
          secretId: form.secretId,
          privateKey: form.privateKey,
        });
        setOtpSessionId(res.data.otpSessionId);
        setStep('OTP');
        setStatus('✓ OTP sent to your email');
        return;
      }

      const res = await api.post('/api/auth/school/request-otp', {
        email: form.email,
        password: form.password,
      });
      setOtpSessionId(res.data.otpSessionId);
      setStep('OTP');
      setStatus('✓ OTP sent to your email');
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const requestForgotOtp = async () => {
    setStatus('');
    setIsLoading(true);
    try {
      const email = String(form.email || '').trim();
      if (!email) {
        setStatus('✗ Please enter your email');
        setIsLoading(false);
        return;
      }

      let path = '';
      if (mode === 'SCHOOL') path = '/api/auth/school/forgot-password/request-otp';
      if (mode === 'STAFF') path = '/api/auth/staff/forgot-password/request-otp';
      if (!path) {
        setStatus('✗ Forgot password is available for School and Staff only');
        setIsLoading(false);
        return;
      }

      const res = await api.post(path, { email });
      if (res.data?.otpSessionId) {
        setFpOtpSessionId(res.data.otpSessionId);
        setFpStep('OTP');
        setStatus('✓ OTP sent to your email');
      } else {
        setStatus('✓ If the account exists, an OTP has been sent to your email');
      }
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    setStatus('');
    setIsLoading(true);
    try {
      if (!fpOtpSessionId || !fpOtp) {
        setStatus('✗ Enter the OTP you received');
        setIsLoading(false);
        return;
      }
      if (String(fpNewPassword || '').length < 8) {
        setStatus('✗ New password must be at least 8 characters');
        setIsLoading(false);
        return;
      }

      let path = '';
      if (mode === 'SCHOOL') path = '/api/auth/school/forgot-password/verify-otp';
      if (mode === 'STAFF') path = '/api/auth/staff/forgot-password/verify-otp';
      if (!path) {
        setStatus('✗ Forgot password is available for School and Staff only');
        setIsLoading(false);
        return;
      }

      await api.post(path, { otpSessionId: fpOtpSessionId, otp: fpOtp, newPassword: fpNewPassword });
      setStatus('✓ Password updated. You can login now');
      setFlow('LOGIN');
      resetForgot();
      resetLoginOtp();
      setForm((prev) => ({ ...prev, password: '' }));
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    setStatus('');
    setIsLoading(true);
    try {
      if (mode === 'SUPER_ADMIN') {
        const res = await api.post('/api/auth/superadmin/verify-otp', { otpSessionId, otp });
        setAuthSession({ token: res.data.token, role: res.data.role });
        setStatus('✓ Welcome back!');
        setTimeout(() => window.location.href = '/superadmin', 500);
        return;
      }

      if (mode === 'STAFF') {
        const res = await api.post('/api/auth/staff/verify-otp', { otpSessionId, otp });
        setAuthSession({ token: res.data.token, role: res.data.role });
        setStatus('✓ Welcome back!');
        setTimeout(() => {
          if (res.data.role === 'JADELC_STAFF') {
            window.location.href = '/staff';
          } else {
            window.location.href = '/school/certificates';
          }
        }, 500);
        return;
      }

      if (firstLogin) {
        const res = await api.post('/api/auth/school/first-login/verify-otp', { otpSessionId, otp });
        setAuthSession({ token: res.data.token, role: res.data.role, schoolName: res.data.schoolName });
        setSchoolPrivateKey(form.privateKey);
        setStatus('✓ First login complete!');
        setTimeout(() => window.location.href = '/school/generate', 500);
        return;
      }

      const res = await api.post('/api/auth/school/verify-otp', { otpSessionId, otp });
      setAuthSession({ token: res.data.token, role: res.data.role, schoolName: res.data.schoolName });
      setStatus('✓ Welcome back!');
      setTimeout(() => window.location.href = '/school/generate', 500);
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #003A5C 0%, #004B78 100%)',
        color: 'white',
        padding: '48px 28px',
        textAlign: 'center',
        borderBottom: '3px solid #4EC464'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '12px' }}>
            JadeLC
          </div>
          <p style={{ fontSize: '18px', margin: '0 0 6px 0', fontWeight: '500', color: 'rgba(255,255,255,0.95)' }}>
            Smart Certificates • On-chain Verification
          </p>
          <p style={{ fontSize: '14px', margin: '0', color: 'rgba(255,255,255,0.7)' }}>
            Secure, tamper-proof certificate generation and blockchain verification
          </p>
        </div>
      </div>

      {/* Login Form Area */}
      <div style={{ flex: 1, padding: '40px 28px', background: '#F8FAFC', display: 'flex', alignItems: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '28px' }}>
            {/* Form Column */}
            <div style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 25px rgba(0, 58, 92, 0.12)'
            }}>
              {/* Role Selector */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Select Your Role
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[
                    { key: 'SCHOOL', label: 'School', icon: '🏫' },
                    { key: 'STAFF', label: 'Staff', icon: '👤' },
                    { key: 'SUPER_ADMIN', label: 'Admin', icon: '⚙️' },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => {
                        setMode(btn.key);
                        if (btn.key !== 'SCHOOL') setFirstLogin(false);
                        resetAll();
                      }}
                      style={{
                        padding: '10px',
                        border: mode === btn.key ? '2px solid #003A5C' : '2px solid #E5E7EB',
                        background: mode === btn.key ? 'linear-gradient(135deg, #003A5C 0%, #004B78 100%)' : 'white',
                        color: mode === btn.key ? 'white' : '#4B5563',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '13px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '20px' }}>{btn.icon}</span>
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB', marginBottom: '24px' }} />

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1A202C', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Email Address
                </label>
                <input
                  className="ui-input"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="your@email.com"
                  type="email"
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              {flow === 'LOGIN' ? (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1A202C', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Password
                  </label>
                  <input
                    className="ui-input"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1A202C', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    New Password
                  </label>
                  <input
                    className="ui-input"
                    type="password"
                    value={fpNewPassword}
                    onChange={(e) => setFpNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* First Login Alert */}
              {flow === 'LOGIN' && mode === 'SCHOOL' && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
                  border: '2px solid #FEF3C7',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={firstLogin}
                      onChange={(e) => {
                        setFirstLogin(e.target.checked);
                        resetLoginOtp();
                      }}
                      style={{ marginTop: '4px', cursor: 'pointer' }}
                      disabled={isLoading}
                    />
                    <span>
                      <strong style={{ color: '#F59E0B' }}>First time login?</strong>
                      <div style={{ fontSize: '12px', marginTop: '4px', color: '#92400E', fontWeight: '500' }}>
                        You'll need School ID, Secret ID, and Private Key
                      </div>
                    </span>
                  </label>

                  {firstLogin && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #FEF3C7' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1A202C', marginBottom: '6px' }}>School ID</label>
                        <input className="ui-input" name="schoolId" value={form.schoolId} onChange={onChange} disabled={isLoading} />
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1A202C', marginBottom: '6px' }}>Secret ID</label>
                        <input className="ui-input" name="secretId" value={form.secretId} onChange={onChange} disabled={isLoading} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1A202C', marginBottom: '6px' }}>Private Key</label>
                        <input className="ui-input" name="privateKey" value={form.privateKey} onChange={onChange} placeholder="0x..." disabled={isLoading} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OTP Input */}
              {flow === 'LOGIN' && step === 'OTP' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1A202C', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    One-Time Password
                  </label>
                  <input
                    className="ui-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Forgot Password OTP */}
              {flow === 'FORGOT' && fpStep === 'OTP' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#1A202C', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    One-Time Password
                  </label>
                  <input
                    className="ui-input"
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Status Message */}
              {status && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '2px solid',
                  borderColor: status.includes('✗') ? '#FEE2E2' : '#D1FAE5',
                  background: status.includes('✗') ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)' : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)',
                  color: status.includes('✗') ? '#EF4444' : '#10B981',
                  fontSize: '13px',
                  fontWeight: '600'
                }}>
                  {status}
                </div>
              )}

              {/* Action Buttons */}
              {(mode === 'SCHOOL' || mode === 'STAFF') && (
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {flow === 'LOGIN' ? (
                    <button
                      onClick={() => {
                        setFlow('FORGOT');
                        setStatus('');
                        resetLoginOtp();
                        resetForgot();
                        setFirstLogin(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#003A5C',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setFlow('LOGIN');
                        setStatus('');
                        resetForgot();
                        resetLoginOtp();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#003A5C',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                      disabled={isLoading}
                    >
                      Back to login
                    </button>
                  )}
                </div>
              )}

              {/* Main CTA Button */}
              <div style={{ marginBottom: '12px' }}>
                {flow === 'LOGIN' ? (
                  step === 'CREDENTIALS' ? (
                    <button
                      onClick={requestOtp}
                      className="ui-btn ui-btn-primary"
                      type="button"
                      style={{ width: '100%', padding: '12px' }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending OTP...' : 'Continue with OTP'}
                    </button>
                  ) : (
                    <button
                      onClick={verifyOtp}
                      className="ui-btn ui-btn-primary"
                      type="button"
                      style={{ width: '100%', padding: '12px' }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Verify OTP & Login'}
                    </button>
                  )
                ) : fpStep === 'CREDENTIALS' ? (
                  <button
                    onClick={requestForgotOtp}
                    className="ui-btn ui-btn-primary"
                    type="button"
                    style={{ width: '100%', padding: '12px' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                  </button>
                ) : (
                  <button
                    onClick={verifyForgotOtp}
                    className="ui-btn ui-btn-primary"
                    type="button"
                    style={{ width: '100%', padding: '12px' }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : 'Verify & Update Password'}
                  </button>
                )}
              </div>

              {/* Resend/Change Actions */}
              {flow === 'LOGIN' && step === 'OTP' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={requestOtp}
                    className="ui-btn"
                    type="button"
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                  <button
                    onClick={resetLoginOtp}
                    className="ui-btn"
                    type="button"
                    disabled={isLoading}
                  >
                    Change Credentials
                  </button>
                </div>
              )}

              {flow === 'FORGOT' && fpStep === 'OTP' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    onClick={requestForgotOtp}
                    className="ui-btn"
                    type="button"
                    disabled={isLoading}
                  >
                    Resend OTP
                  </button>
                  <button
                    onClick={() => {
                      resetForgot();
                      setStatus('');
                    }}
                    className="ui-btn"
                    type="button"
                    disabled={isLoading}
                  >
                    Change Email
                  </button>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div style={{
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 10px 25px rgba(0, 58, 92, 0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>Step 1</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>Generate</div>
                <p style={{ margin: '0', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                  Create blank certificates with embedded QR codes containing only the certificate ID
                </p>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB' }} />

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>Step 2</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>Register</div>
                <p style={{ margin: '0', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                  OCR scan documents and compute cryptographic hashes (keccak256) for tamper-proofing
                </p>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB' }} />

              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>Step 3</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>Anchor</div>
                <p style={{ margin: '0', fontSize: '14px', color: '#4B5563', fontWeight: '500' }}>
                  Store certificate hashes on-chain via smart contracts on Polygon Amoy
                </p>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB' }} />

              <div style={{
                background: 'linear-gradient(135deg, rgba(0, 58, 92, 0.05) 0%, rgba(78, 196, 100, 0.05) 100%)',
                border: '2px solid rgba(0, 58, 92, 0.1)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>SECURITY FIRST</div>
                <p style={{ margin: '0', fontSize: '13px', color: '#4B5563', fontWeight: '600', lineHeight: '1.5' }}>
                  Every certificate is cryptographically verified and immutably stored on the blockchain. Tampering detection is built-in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
