import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";
import "./LoginPage.css";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const wallShades = [
  { start: "#B06A2C", end: "#7B461D" },
  { start: "#D9A75A", end: "#A87635" },
  { start: "#A05C2E", end: "#6D3919" },
  { start: "#B06A2C", end: "#7E4B1E" },
  { start: "#2B2723", end: "#171412" },
  { start: "#C08A54", end: "#865830" },
  { start: "#B06A2C", end: "#7B461D" },
  { start: "#8C4A2B", end: "#5D2D18" },
  { start: "#D9A75A", end: "#9F7031" },
  { start: "#A05C2E", end: "#6E3919" },
  { start: "#B06A2C", end: "#7C471E" },
  { start: "#2B2723", end: "#171412" },
  { start: "#C08A54", end: "#875931" },
  { start: "#B06A2C", end: "#7D481E" },
  { start: "#D9A75A", end: "#A87735" },
  { start: "#A05C2E", end: "#6E391A" },
  { start: "#B06A2C", end: "#7B461D" },
  { start: "#8C4A2B", end: "#5C2D18" },
  { start: "#D9A75A", end: "#A57333" },
  { start: "#B06A2C", end: "#7B461D" },
];

const swatches = [
  { name: "Autumn Red", color: "#8C4A2B" },
  { name: "Amber Grove", color: "#B06A2C" },
  { name: "Golden Caramel", color: "#D9A75A" },
  { name: "Silver", color: "#AEB7BA" },
  { name: "Slate", color: "#565A5B" },
  { name: "Charcoal", color: "#2B2723" },
];

const sessionChips = ["JWT token auth", "Auto refresh on 401", "Core + GRN services"];
const certifications = ["ISO 9001", "ISO 14001", "ISO 45001"];

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimerRef = useRef<number | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [isAuthenticated, isBootstrapping, navigate]);

  useEffect(
    () => () => {
      if (shakeTimerRef.current) {
        window.clearTimeout(shakeTimerRef.current);
      }
    },
    [],
  );

  const triggerShake = () => {
    if (shakeTimerRef.current) {
      window.clearTimeout(shakeTimerRef.current);
    }

    setIsShaking(false);

    window.requestAnimationFrame(() => {
      setIsShaking(true);
      shakeTimerRef.current = window.setTimeout(() => setIsShaking(false), 450);
    });
  };

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await signIn(values.username, values.password);
      toast.success(`Welcome back${values.username ? `, ${values.username}` : ""}.`);
      navigate("/app/dashboard", { replace: true });
    } catch (error) {
      triggerShake();
      toast.error(error instanceof Error ? error.message : "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="wpe-login-page flex items-center justify-center">
      <main className="wpe-login-shell" role="main">
        <section className="wpe-login-form-side">
          <div className="wpe-login-brand">
            <span className="wpe-login-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 4C10 4 4 10 4 20c8 0 16-4 16-16Z" fill="#fff" />
                <path d="M6 18C10 12 14 9 18 7" stroke="#4C7A2B" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <span className="wpe-login-brand-name">
              WPE ERP
              <strong>UNICEIL · POWERED BY ZIGMA</strong>
            </span>
          </div>

          <h1 className="wpe-login-title">Sign in</h1>
          <p className="wpe-login-subtitle">
            Use your backend credentials to access the live operations admin for Core, GRN, and QCR workflows.
          </p>

          <Form {...form}>
            <form className="wpe-login-form" noValidate onSubmit={form.handleSubmit(onSubmit, triggerShake)}>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="wpe-login-field wpe-login-field-stagger" style={{ animationDelay: "0.1s" }}>
                    <FormLabel className="wpe-login-label">Username</FormLabel>
                    <FormControl>
                      <div className="wpe-login-input-wrap">
                        <input
                          {...field}
                          className="wpe-login-input"
                          autoComplete="username"
                          placeholder="you@zigma"
                          spellCheck={false}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="wpe-login-message" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="wpe-login-field wpe-login-field-stagger" style={{ animationDelay: "0.18s" }}>
                    <FormLabel className="wpe-login-label">Password</FormLabel>
                    <FormControl>
                      <div className="wpe-login-input-wrap">
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          className="wpe-login-input"
                          autoComplete="current-password"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          className="wpe-login-peek"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="wpe-login-message" />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={[
                  "wpe-login-cta",
                  form.formState.isSubmitting ? "wpe-login-cta-busy" : "",
                  isShaking ? "wpe-login-cta-shake" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ animationDelay: "0.26s" }}
              >
                <span className="wpe-login-cta-label">{form.formState.isSubmitting ? "Signing in" : "Sign in"}</span>
                <ArrowRight className="wpe-login-cta-arrow" strokeWidth={2.2} />
                <span className="wpe-login-cta-spinner" aria-hidden="true" />
              </button>
            </form>
          </Form>

          <div className="wpe-login-chips" aria-label="Session details">
            {sessionChips.map((chip, index) => (
              <span key={chip} className="wpe-login-chip" style={{ animationDelay: `${0.34 + index * 0.06}s` }}>
                <span className="wpe-login-chip-dot" />
                {chip}
              </span>
            ))}
          </div>

          <div className="wpe-login-foot">
            <small>theuniceil.com</small>
            <div className="wpe-login-iso" aria-label="Certifications">
              {certifications.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <aside className="wpe-login-wall" aria-hidden="true">
          <div className="wpe-login-slats">
            {wallShades.map((shade, index) => (
              <div
                key={`${shade.start}-${index}`}
                className="wpe-login-slat"
                style={{
                  background: `linear-gradient(180deg, ${shade.start}, ${shade.end})`,
                  animationDelay: `${index * 0.18}s`,
                }}
              />
            ))}
          </div>
          <div className="wpe-login-sweep" />
          <div className="wpe-login-vignette" />

          <div className="wpe-login-wall-top">
            <span className="wpe-login-live">
              <span className="wpe-login-live-dot" />
              LIVE BACKEND
            </span>
            <span className="wpe-login-shield">
              <ShieldCheck strokeWidth={1.6} />
            </span>
          </div>

          <div className="wpe-login-wall-caption">
            <strong>WPE</strong>
            <span>Co-extruded · Exterior Solutions</span>
          </div>

          <div className="wpe-login-swatches">
            {swatches.map((swatch, index) => (
              <span
                key={swatch.name}
                className="wpe-login-swatch"
                style={{ animationDelay: `${0.4 + index * 0.08}s, ${index * 0.6}s` }}
              >
                <span className="wpe-login-swatch-dot" style={{ background: swatch.color }} />
                {swatch.name}
              </span>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default LoginPage;
