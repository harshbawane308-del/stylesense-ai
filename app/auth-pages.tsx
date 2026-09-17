"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { getAuthErrorMessage } from "../lib/auth-errors";
import { useAuth } from "../lib/auth-context";

export function AuthLogo() { return <Link href="/" className="auth-logo"><span className="auth-logo-mark"><span /><span /></span><span>StyleSense <b>AI</b></span></Link>; }

export function GoogleButton({ onError, disabled }: { onError: (message: string) => void; disabled?: boolean }) {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const handleGoogle = async () => { setLoading(true); onError(""); try { await signInWithGoogle(); router.push("/dashboard"); } catch (error) { onError(getAuthErrorMessage(error)); } finally { setLoading(false); } };
  return <button type="button" className="google-button" onClick={handleGoogle} disabled={disabled || loading}><span className="google-g">G</span>{loading ? "Connecting..." : "Continue with Google"}</button>;
}

function PasswordField({ label, value, onChange, placeholder = "At least 8 characters" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="auth-field"><span>{label}</span><div className="auth-input-wrap"><LockKeyhole size={15} /><input type={visible ? "text" : "password"} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /><button type="button" aria-label={visible ? "Hide password" : "Show password"} onClick={() => setVisible(current => !current)}>{visible ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>;
}

function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <label className="auth-field"><span>Email</span><div className="auth-input-wrap"><Mail size={15} /><input type="email" value={value} onChange={event => onChange(event.target.value)} placeholder="you@company.com" autoComplete="email" /></div></label>; }

export function AuthFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <main className="auth-page"><div className="auth-visual"><AuthLogo /><div className="auth-visual-copy"><span>STYLESENSE / WORKSPACE ACCESS</span><h1>Bring your<br /><i>next garment</i><br />to life.</h1><p>One intelligent workflow from fashion idea to production-ready product.</p></div><div className="auth-visual-art"><div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" /><div className="auth-garment"><span /><i /></div><small>DESIGN / DEVELOPMENT<br />SYSTEM 01</small></div><span className="auth-visual-footer">AI-POWERED FASHION PRODUCT DEVELOPMENT</span></div><section className="auth-panel"><Link href="/" className="auth-mobile-logo"><AuthLogo /></Link><div className="auth-form-box"><span className="auth-eyebrow">{eyebrow}</span><h2>{title}</h2><p className="auth-description">{description}</p>{children}</div><span className="auth-panel-foot">Secure workspace access · StyleSense AI</span></section></main>;
}

export function SignInForm() {
  const { signIn } = useAuth(); const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); if (!email || !password) return setError("Enter your email and password to continue."); setLoading(true); try { await signIn(email, password); router.push("/dashboard"); } catch (authError) { setError(getAuthErrorMessage(authError)); } finally { setLoading(false); } };
  return <AuthFrame eyebrow="Welcome back" title="Sign in to your workspace." description="Continue developing your next product with StyleSense AI."><form className="auth-form" onSubmit={submit}><EmailField value={email} onChange={setEmail} /><PasswordField label="Password" value={password} onChange={setPassword} />{error && <p className="auth-error">{error}</p>}<button className="auth-submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}<ArrowRight size={16} /></button><Link className="forgot-link" href="/forgot-password">Forgot password?</Link><div className="auth-divider"><span />or<span /></div><GoogleButton onError={setError} disabled={loading} /></form><p className="auth-switch">New to StyleSense? <Link href="/sign-up">Create an account</Link></p></AuthFrame>;
}

export function SignUpForm() {
  const { signUp } = useAuth(); const router = useRouter(); const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); if (!fullName || !email || !password || !confirm) return setError("Complete all required fields."); if (password.length < 8) return setError("Password must be at least 8 characters."); if (password !== confirm) return setError("Password confirmation does not match."); setLoading(true); try { await signUp(fullName, email, password); router.push("/dashboard"); } catch (authError) { setError(getAuthErrorMessage(authError)); } finally { setLoading(false); } };
  return <AuthFrame eyebrow="Create your workspace" title="Make the next thing real." description="Set up your StyleSense workspace and start building with intention."><form className="auth-form" onSubmit={submit}><label className="auth-field"><span>Full name</span><div className="auth-input-wrap"><UserRound size={15} /><input value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Alex Rivera" autoComplete="name" /></div></label><EmailField value={email} onChange={setEmail} /><PasswordField label="Password" value={password} onChange={setPassword} /><PasswordField label="Confirm password" value={confirm} onChange={setConfirm} placeholder="Re-enter your password" />{error && <p className="auth-error">{error}</p>}<button className="auth-submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}<ArrowRight size={16} /></button><div className="auth-divider"><span />or<span /></div><GoogleButton onError={setError} disabled={loading} /></form><p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p></AuthFrame>;
}

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth(); const [email, setEmail] = useState(""); const [error, setError] = useState(""); const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(""); if (!email) return setError("Enter the email associated with your account."); setLoading(true); try { await resetPassword(email); setSent(true); } catch (authError) { setError(getAuthErrorMessage(authError)); } finally { setLoading(false); } };
  return <AuthFrame eyebrow="Account recovery" title="Reset your password." description="We’ll send a secure link to the email address associated with your workspace.">{sent ? <div className="auth-success"><span><Check size={18} /></span><strong>Check your inbox.</strong><p>If an account exists for {email}, a password reset link is on its way.</p><Link className="auth-submit" href="/sign-in">Return to sign in <ArrowRight size={16} /></Link></div> : <form className="auth-form" onSubmit={submit}><EmailField value={email} onChange={setEmail} />{error && <p className="auth-error">{error}</p>}<button className="auth-submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}<ArrowRight size={16} /></button></form>}<Link className="back-signin" href="/sign-in"><ArrowLeft size={14} /> Back to sign in</Link></AuthFrame>;
}
