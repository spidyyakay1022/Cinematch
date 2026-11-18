import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Film, Sparkles } from "lucide-react";

export function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", agreeToTerms: false });
  const [message, setMessage] = useState("");

  function update(e) {
    const { name, value, checked, type } = e.target;
    setForm((old) => ({ ...old, [name]: type === "checkbox" ? checked : value }));
  }

  function submit(e) {
    e.preventDefault();
    setMessage("Your account form is ready. Connect the backend authentication endpoint to create a real account.");
  }

  return (
    <AuthFrame>
      <div className="auth-form-wrap">
        <Link className="auth-back" to="/"><ArrowLeft size={17} /> Back to CineMatch</Link>
        <div className="auth-heading">
          <span className="auth-kicker"><Sparkles size={14} /> YOUR NEXT MOVIE NIGHT STARTS HERE</span>
          <h1>Create your account</h1>
          <p>Save your favourites, build watchlists, and get recommendations made for you.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-name-row">
            <label>First name<input name="firstName" value={form.firstName} onChange={update} placeholder="John" autoComplete="given-name" required /></label>
            <label>Last name<input name="lastName" value={form.lastName} onChange={update} placeholder="Doe" autoComplete="family-name" required /></label>
          </div>
          <label>Email address<input type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com" autoComplete="email" required /></label>
          <label>Password
            <span className="auth-password">
              <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={update} placeholder="At least 8 characters" minLength={8} autoComplete="new-password" required />
              <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>
          <label className="auth-terms"><input type="checkbox" name="agreeToTerms" checked={form.agreeToTerms} onChange={update} required /><span>I agree to the <a href="#terms" onClick={(e) => e.preventDefault()}>Terms & Conditions</a>.</span></label>
          <button className="auth-submit" type="submit">Create account <span>↗</span></button>
          {message && <p className="auth-notice" role="status">{message}</p>}
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </AuthFrame>
  );
}

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  function submit(e) {
    e.preventDefault();
    setMessage("Login UI is ready. Connect the backend authentication endpoint to verify your credentials.");
  }
  return (
    <AuthFrame>
      <div className="auth-form-wrap auth-login-wrap">
        <Link className="auth-back" to="/"><ArrowLeft size={17} /> Back to CineMatch</Link>
        <div className="auth-heading">
          <span className="auth-kicker"><Sparkles size={14} /> WELCOME BACK, CINEPHILE</span>
          <h1>Welcome back</h1>
          <p>Log in to pick up right where your next great movie night begins.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <label>Email address<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" required /></label>
          <label>Password
            <span className="auth-password">
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" className="auth-eye" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </span>
          </label>
          <button className="auth-submit" type="submit">Log in <span>↗</span></button>
          {message && <p className="auth-notice" role="status">{message}</p>}
        </form>
        <p className="auth-switch">New to CineMatch? <Link to="/signup">Create an account</Link></p>
      </div>
    </AuthFrame>
  );
}

function AuthFrame({ children }) {
  return (
    <div className="auth-page">
      <section className="auth-art">
        <img src="https://cdn.21st.dev/assets/mirror/0d/0d205a1a31d40e927885b0ec5f603407caa10585b5bc6e8b08240402c7417e86.png" alt="Cinematic abstract artwork" />
        <div className="auth-art-shade" />
        <Link to="/" className="auth-brand"><span className="auth-brand-icon"><Film size={20} /></span>Cine<span>Match</span> AI</Link>
        <div className="auth-art-copy">
          <span className="auth-kicker"><Sparkles size={14} /> DISCOVER YOUR NEXT OBSESSION</span>
          <h2>Stories worth<br /><em>staying up for.</em></h2>
          <p>Your personal movie universe, powered by AI.</p>
        </div>
        <div className="auth-art-foot">FIND YOUR FILM. FEEL THE MOMENT.</div>
      </section>
      {children}
    </div>
  );
}
