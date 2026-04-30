import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Activity, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginThunk, googleLoginThunk, clearError } from '@/store/slices/authSlice';
import AuthLayout from './AuthLayout';

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

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, initializing } = useAppSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
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
  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email address';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await dispatch(loginThunk({ email, password }));
  }

  if (initializing) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }}
        />
      </div>
    );
  }

  return (
    <AuthLayout>
      <div
        style={{ width: '100%', maxWidth: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', position: 'relative', overflow: 'hidden' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background orbs */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 6, repeat: Infinity }}
          style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: '#6366f1', top: '10%', right: '-10%', filter: 'blur(80px)', pointerEvents: 'none' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, delay: 3 }}
          style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#22d3ee', bottom: '5%', left: '-5%', filter: 'blur(70px)', pointerEvents: 'none' }}
        />

        <motion.div
          ref={formRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, perspective: 1000 }}
        >
          <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
              <motion.div
                animate={{ boxShadow: ['0 0 16px rgba(99,102,241,0.3)', '0 0 32px rgba(99,102,241,0.55)', '0 0 16px rgba(99,102,241,0.3)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Activity size={20} color="white" />
              </motion.div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9' }}>MediCore</div>
                <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Healthcare Platform</div>
              </div>
            </div>

            {/* Heading */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: 8 }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: '#64748b' }}>Sign in to your clinical dashboard</p>
            </motion.div>

            {/* Google sign-in */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ fontSize: 11, color: '#475569', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', borderRadius: 12,
                      background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.22)',
                      color: '#fb7185', fontSize: 13,
                    }}
                  >
                    <AlertCircle size={15} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.02em' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <motion.div
                    animate={{ color: focused === 'email' ? '#6366f1' : '#475569' }}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  >
                    <Mail size={15} />
                  </motion.div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setValidationErrors(v => ({ ...v, email: undefined })); }}
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
                      style={{ fontSize: 11.5, color: '#f43f5e', marginTop: 6 }}>{validationErrors.email}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Password */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.42 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#94a3b8', marginBottom: 8, letterSpacing: '0.02em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <motion.div
                    animate={{ color: focused === 'password' ? '#6366f1' : '#475569' }}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                  >
                    <Lock size={15} />
                  </motion.div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setValidationErrors(v => ({ ...v, password: undefined })); }}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className={`input-field ${validationErrors.password ? 'error' : ''}`}
                    style={{ paddingLeft: 40, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(s => !s)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 4 }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <AnimatePresence>
                  {validationErrors.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ fontSize: 11.5, color: '#f43f5e', marginTop: 6 }}>{validationErrors.password}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{ width: '100%', height: 50, marginTop: 6, fontSize: 14.5 }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
                        style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.25)', borderTopColor: 'white', borderRadius: '50%' }}
                      />
                      Authenticating...
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      Sign In <ArrowRight size={16} />
                    </span>
                  )}
                </motion.button>
              </motion.div>
            </form>

            {/* Sign up link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ textAlign: 'center', fontSize: 13.5, color: '#475569', marginTop: 28 }}
            >
              Don't have an account?{' '}
              <Link
                to="/Signup"
                style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
                onMouseLeave={e => (e.currentTarget.style.color = '#818cf8')}
              >
                Create account
              </Link>
            </motion.p>


          </motion.div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
