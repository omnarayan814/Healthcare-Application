import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Activity, ArrowRight, AlertCircle, User as UserIcon, CheckCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { signupThunk, googleLoginThunk, clearError } from '@/store/slices/authSlice';
import AuthLayout from './AuthLayout';
import './styles/LoginPage.css';
import './styles/SignUpPage.css';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.3-11.3-8L6.2 33C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.1 35.3 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

type Field = 'name' | 'email' | 'password' | 'confirm';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 6 characters', pass: password.length >= 6 },
    { label: 'Contains a number', pass: /\d/.test(password) },
    { label: 'Contains a letter', pass: /[a-zA-Z]/.test(password) },
  ];
  const strength = checks.filter(c => c.pass).length;
  const colors = ['#ef4444', '#f97316', '#10b981'];
  const labels = ['Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ marginTop: 8 }}
    >
      <div className="pw-strength-bars">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="pw-strength-bar"
            style={{ background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <div className="pw-strength-footer">
        <span style={{ fontSize: 11, color: strength > 0 ? colors[strength - 1] : '#475569', fontWeight: 600 }}>
          {strength > 0 ? labels[strength - 1] : ''}
        </span>
        <div className="pw-strength-checks">
          {checks.map(c => (
            <span key={c.label} className="pw-strength-check" style={{ color: c.pass ? '#10b981' : '#334155' }}>
              <CheckCircle size={10} color={c.pass ? '#10b981' : '#334155'} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function SignUpPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, initializing } = useAppSelector(s => s.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState<Field | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<Field, string>>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-200, 200], [4, -4]);
  const rotateY = useTransform(mouseX, [-200, 200], [-4, 4]);

  useEffect(() => {
    if (isAuthenticated) navigate('/Dashboard');
  }, [isAuthenticated, navigate]);

  useEffect(() => { return () => { dispatch(clearError()); }; }, [dispatch]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = formRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  }
  function handleMouseLeave() { mouseX.set(0); mouseY.set(0); }

  function validate(): boolean {
    const errs: Partial<Record<Field, string>> = {};
    if (!name.trim()) errs.name = 'Full name is required';
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!confirm) errs.confirm = 'Please confirm your password';
    else if (confirm !== password) errs.confirm = 'Passwords do not match';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await dispatch(signupThunk({ email, password, displayName: name.trim() }));
  }

  function clearFieldError(field: Field) {
    setValidationErrors(v => { const next = { ...v }; delete next[field]; return next; });
  }

  if (initializing) {
    return (
      <div className="auth-loading-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          className="auth-spinner"
        />
      </div>
    );
  }

  return (
    <AuthLayout>
      <div
        className="auth-form-panel"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="auth-orb-1"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, delay: 3 }}
          className="auth-orb-2"
        />

        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="auth-form-wrapper"
        >
          <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>

            {/* Logo */}
            <div className="auth-logo signup-logo">
              <motion.div
                animate={{ boxShadow: ['0 0 16px rgba(99,102,241,0.3)', '0 0 32px rgba(99,102,241,0.55)', '0 0 16px rgba(99,102,241,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="auth-logo-mark"
              >
                <Activity size={20} color="white" />
              </motion.div>
              <div>
                <div className="auth-logo-name">MediCore</div>
                <div className="auth-logo-tag">Healthcare Platform</div>
              </div>
            </div>

            {/* Heading */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="auth-heading signup-heading">
              <h2 className="auth-title">
                Create account
              </h2>
              <p className="auth-subtitle">Join the MediCore clinical platform</p>
            </motion.div>

            {/* Google sign-up */}
            <motion.button
              type="button"
              onClick={() => dispatch(googleLoginThunk())}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="google-btn"
              style={{
                width: '100%', height: 46, marginBottom: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer',
              }}
            >
              <GoogleIcon />
              Continue with Google
            </motion.button>

            {/* "or" Divider */}
            <div className="auth-divider signup-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form signup-form">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    className="auth-error-alert"
                  >
                    <AlertCircle size={15} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Full Name */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }}>
                <label className="auth-label">
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <motion.div animate={{ color: focused === 'name' ? '#6366f1' : '#475569' }}
                    className="auth-input-icon">
                    <UserIcon size={15} />
                  </motion.div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); clearFieldError('name'); }}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    placeholder="Dr. Jane Smith"
                    className={`input-field ${validationErrors.name ? 'error' : ''}`}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
                <AnimatePresence>
                  {validationErrors.name && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="auth-field-error">{validationErrors.name}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Email */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.34 }}>
                <label className="auth-label">
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <motion.div animate={{ color: focused === 'email' ? '#6366f1' : '#475569' }}
                    className="auth-input-icon">
                    <Mail size={15} />
                  </motion.div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); clearFieldError('email'); }}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@hospital.com"
                    className={`input-field ${validationErrors.email ? 'error' : ''}`}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
                <AnimatePresence>
                  {validationErrors.email && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="auth-field-error">{validationErrors.email}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <label className="auth-label">
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <motion.div animate={{ color: focused === 'password' ? '#6366f1' : '#475569' }}
                    className="auth-input-icon">
                    <Lock size={15} />
                  </motion.div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearFieldError('password'); }}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className={`input-field ${validationErrors.password ? 'error' : ''}`}
                    style={{ paddingLeft: 40, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="auth-pass-toggle">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
                <AnimatePresence>
                  {validationErrors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="auth-field-error">{validationErrors.password}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm Password */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.46 }}>
                <label className="auth-label">
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <motion.div animate={{ color: focused === 'confirm' ? '#6366f1' : '#475569' }}
                    className="auth-input-icon">
                    <Lock size={15} />
                  </motion.div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); clearFieldError('confirm'); }}
                    onFocus={() => setFocused('confirm')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className={`input-field ${validationErrors.confirm ? 'error' : ''}`}
                    style={{ paddingLeft: 40, paddingRight: 44 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(s => !s)}
                    className="auth-pass-toggle">
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {confirm && confirm === password && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ position: 'absolute', right: 38, top: '50%', transform: 'translateY(-50%)' }}>
                      <CheckCircle size={15} color="#10b981" />
                    </motion.div>
                  )}
                </div>
                <AnimatePresence>
                  {validationErrors.confirm && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="auth-field-error">{validationErrors.confirm}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{ width: '100%', height: 50, marginTop: 4, fontSize: 14.5 }}
                >
                  {loading ? (
                    <span className="auth-btn-content">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                        className="auth-btn-spinner"
                      />
                      Creating account...
                    </span>
                  ) : (
                    <span className="auth-btn-content">
                      Create Account <ArrowRight size={16} />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Sign in link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="auth-footer-text signup-footer-text"
            >
              Already have an account?{' '}
              <Link to="/Login" className="auth-link">
                Sign in
              </Link>
            </motion.p>


          </motion.div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
