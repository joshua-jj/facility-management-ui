import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/reducers';
import { authActions } from '@/actions';
import { UnknownAction } from 'redux';
import { AppEmitter } from '@/controllers/EventEmitter';
import { authConstants } from '@/constants';
import { useRouter } from 'next/router';
import Link from 'next/link';
import EyeIcon from '../../public/assets/icons/Eye.svg';
import HideIcon from '../../public/assets/icons/Hide.svg';
import Head from 'next/head';
import Image from 'next/image';
import { useTheme } from '@/hooks/useTheme';
import ThemeToggle from '@/components/ThemeToggle';

const Login: FC = () => {
  const router = useRouter();
  const query = router?.query;
  const decodedFrom = decodeURIComponent(
    Array.isArray(query?.from) ? query.from[0] : (query?.from ?? '')
  );
  const dispatch = useDispatch();
  const { IsLoggingIn } = useSelector((s: RootState) => s.auth);
  const { theme, mounted } = useTheme();

  const [passwordShow, setPasswordShow] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isDark = theme === 'dark';

  const togglePasswordVisibility = () => {
    setPasswordShow((prev) => !prev);
  };

  const validateEmail = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError('');
  };

  const validatePassword = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!email) { setEmailError('Email is required'); hasError = true; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Please enter a valid email'); hasError = true; }
    if (!password) { setPasswordError('Password is required'); hasError = true; }
    if (hasError) return;

    dispatch(authActions.login({ email, password }) as unknown as UnknownAction);
  };

  useEffect(() => {
    const listener = AppEmitter.addListener(
      authConstants.LOGIN_SUCCESS,
      (evt: Event) => {
        const customEvent = evt as CustomEvent;
        const data = customEvent.detail?.data;

        if (data && decodedFrom?.length) {
          router.push({ pathname: decodedFrom });
          return;
        }

        if (data?.user?.hasDefaultPassword) {
          router.push({
            pathname: '/change-password',
            query: { email: data.user.email, accessToken: data.accessToken },
          });
        } else {
          router.push('/admin/dashboard');
        }
      }
    );

    return () => listener.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Head>
        <title>Login | EGFM - Facility Management System</title>
        <meta charSet="UTF-8" />
        <meta name="description" content="EGFM - Facility Management System" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0e0e1a]' : 'bg-[#fafafa]'}`}>
        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute rounded-full"
            style={{
              top: '-25%',
              right: '-15%',
              width: '60vw',
              height: '60vw',
              background: `radial-gradient(circle, rgba(15,37,82,${isDark ? '0.12' : '0.04'}) 0%, transparent 65%)`,
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              bottom: '-30%',
              left: '-20%',
              width: '70vw',
              height: '70vw',
              background: `radial-gradient(circle, rgba(178,131,9,${isDark ? '0.08' : '0.04'}) 0%, transparent 60%)`,
              filter: 'blur(40px)',
            }}
          />
        </div>

        {/* Theme toggle */}
        <ThemeToggle className="fixed top-6 right-6 z-20" />

        {/* Logo */}
        <div className="animate-fade-in-scale mb-8 flex flex-col items-center z-10">
          <Image
            src="/assets/images/egfm-logo.png"
            alt="EGFM Logo"
            width={72}
            height={72}
            unoptimized
            className={isDark ? 'brightness-125 saturate-[0.9]' : ''}
          />
          <span className={`mt-2 text-sm font-semibold tracking-[0.12em] uppercase transition-colors ${isDark ? 'text-white/80' : 'text-[#0F2552]'}`}>
            Logistics
          </span>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[420px] mx-auto px-4 z-10"
        >
          <div className="animate-fade-up">
            <h1 className={`font-extrabold text-2xl tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F2552]'}`}>
              Welcome back!
            </h1>
            <p className={`text-sm mt-1 mb-8 transition-colors ${isDark ? 'text-white/40' : 'text-[#0F2552]/60'}`}>
              Log in to your facility management portal
            </p>
          </div>

          {/* Email field */}
          <div className="animate-fade-up-delay-1 mb-4">
            <label className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}>
              Email
            </label>
            <div className={`auth-field ${emailError ? 'has-error' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#E1E1E6' : '#0F2552'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <input
                type="email"
                name="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => validateEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {emailError && (
              <p className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>

          {/* Password field */}
          <div className="animate-fade-up-delay-2 mb-2">
            <label className={`block text-xs font-semibold mb-1.5 transition-colors ${isDark ? 'text-white/50' : 'text-[#0F2552]/70'}`}>
              Password
            </label>
            <div className={`auth-field ${passwordError ? 'has-error' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#E1E1E6' : '#0F2552'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type={passwordShow ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password..."
                value={password}
                onChange={(e) => validatePassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className={`shrink-0 cursor-pointer transition-opacity ${isDark ? 'opacity-40 hover:opacity-70' : 'opacity-50 hover:opacity-80'}`}
                aria-label={passwordShow ? 'Hide password' : 'Show password'}
              >
                {passwordShow ? <EyeIcon /> : <HideIcon />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-500 text-xs mt-1">{passwordError}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="animate-fade-up-delay-3 mb-8 text-right">
            <Link
              href="/forgot-password"
              className={`text-xs font-semibold hover:underline transition-colors ${isDark ? 'text-[#D4A84B] hover:text-[#e8bc5f]' : 'text-[#0F2552] hover:text-[#B28309]'}`}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit button */}
          <div className="animate-fade-up-delay-4">
            <button
              disabled={IsLoggingIn}
              type="submit"
              className="w-full py-3.5 rounded-[10px] font-bold text-[0.9375rem] transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              style={{
                backgroundImage: !IsLoggingIn && email && password
                  ? isDark
                    ? 'linear-gradient(135deg, #1a3a7a 0%, #2a4f9a 50%, #D4A84B 100%)'
                    : 'linear-gradient(135deg, #0F2552 0%, #1a3a7a 50%, #B28309 100%)'
                  : 'none',
                backgroundColor: !IsLoggingIn && email && password
                  ? undefined
                  : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(15, 37, 82, 0.12)',
                backgroundSize: '200% 200%',
                backgroundPosition: '0% 50%',
                color: !IsLoggingIn && email && password
                  ? '#fff'
                  : isDark
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(15, 37, 82, 0.35)',
              }}
              onMouseEnter={(e) => {
                if (!IsLoggingIn && email && password) {
                  e.currentTarget.style.backgroundPosition = '100% 50%';
                  e.currentTarget.style.boxShadow = isDark
                    ? '0 4px 16px rgba(212, 168, 75, 0.25)'
                    : '0 4px 16px rgba(15, 37, 82, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundPosition = '0% 50%';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {IsLoggingIn ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                'Log in'
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p className={`animate-fade-up-delay-5 mt-10 text-xs z-10 transition-colors ${isDark ? 'text-white/20' : 'text-[#0F2552]/30'}`}>
          &copy; {new Date().getFullYear()} EGFM Logistics. All rights reserved.
        </p>
      </div>
    </>
  );
};

export default Login;
