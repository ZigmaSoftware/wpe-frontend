import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/providers/AuthProvider";
import "./LoginPage.css";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type FeatureBadge = {
  label: [string, string];
  icon: JSX.Element;
};

const featureBadges: FeatureBadge[] = [
  {
    label: ["100%", "Recyclable"],
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M7 3l2.5 4.3-1.7 1-2.5-4.3L3 6.4 4 2h4.4L7 3Zm12 6-2.5 4.3 1.7 1 2.5-4.3L21 17.6 22 22h-4.4L19 21l-2.5-4.3-1.7 1L17.3 22H9l3-5.2-1.7-1L7.8 21H5l4-7 5-8.6 5 8.6-2.6-4.5-1.7 1L16.2 12 19 9Z" />
        <path d="M4 14l4 7H4l-1-4 1-3Zm9-11 4 7-3.5-1L10 3h3Zm7 11-2.6 4.5H21l1-4-2-.5Z" />
      </svg>
    ),
  },
  {
    label: ["Eco", "Friendly"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 20C7 20 4 17 4 12 4 6 10 4 20 4c0 10-3 16-9 16Z" />
        <path d="M9 15c2-3 5-5 8-6" />
      </svg>
    ),
  },
  {
    label: ["Weather", "Resistance"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 15a4 4 0 010-8 5 5 0 019.6-1.3A3.5 3.5 0 0117 15H7Z" />
        <path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2" />
      </svg>
    ),
  },
  {
    label: ["Highly", "Durable"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" />
        <path d="M9.5 12l2 2 3.5-4" />
      </svg>
    ),
  },
  {
    label: ["Termite", "Resistance"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse cx="12" cy="13" rx="4" ry="6" />
        <path d="M12 7V4M9 5L7 3M15 5l2-2M8 11H4M16 11h4M8 15H4M16 15h4M9 19l-2 2M15 19l2 2" />
      </svg>
    ),
  },
  {
    label: ["Anti-Slip", "Surface"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="14" cy="5" r="1.6" />
        <path d="M13 8l-3 2 2 3 1 5M13 10l4 1M10 10l-4 4M3 20h5" />
      </svg>
    ),
  },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isBootstrapping, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const shakeTimerRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopQuery = window.matchMedia("(min-width: 901px)");
    const cardElement = cardRef.current;

    if (reduceMotionQuery.matches || !desktopQuery.matches || !cardElement) {
      return undefined;
    }

    let rafId = 0;
    const handleMouseMove = (event: MouseEvent) => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        if (!cardRef.current) {
          return;
        }

        const x = event.clientX / window.innerWidth - 0.5;
        const y = event.clientY / window.innerHeight - 0.5;
        cardRef.current.style.transform = `rotateY(${-6 - x * 6}deg) rotateX(${3 + y * 6}deg) translateZ(0)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      cardElement.style.transform = "rotateY(-6deg) rotateX(3deg)";
    };
  }, []);

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

  const onInvalid = () => {
    triggerShake();
  };

  return (
    <div className="wpe-login-page">
      <div className="wpe-login-scene" aria-hidden="true">
        <div className="fence" />
        <div className="sweep" />
        <div className="deck" />
        <div className="scene-tint" />
      </div>

      <div className="leaf-fg tl" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M90 10C40 10 10 40 10 90c50 0 80-30 80-80Z" />
        </svg>
      </div>
      <div className="leaf-fg bl" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M10 90C60 90 90 60 90 10 40 10 10 40 10 90Z" />
        </svg>
      </div>
      <div className="leaf-fg rr" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="currentColor">
          <path d="M90 10C40 10 10 40 10 90c50 0 80-30 80-80Z" />
        </svg>
      </div>

      <main className="stage">
        <section className="hero">
          <div className="brand">
            <span className="logo">WPE</span>
            <span className="bt">
              Exterior
              <span>Solutions</span>
            </span>
          </div>

          <h1>
            <span className="w1">Building a</span>
            <br />
            <span className="w2 g">Sustainable</span> <span className="w3">Future</span>
          </h1>
          <div className="accent" />
          <p className="lead">
            <b>Innovative. Durable. Eco-Friendly.</b>
            <br />
            Together for a cleaner tomorrow.
          </p>

          <div className="badges">
            <svg className="connector" viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true">
              <path d="M15 20 C 120 70, 200 70, 300 30 S 480 -5, 585 40" />
              <path className="pulse" d="M15 20 C 120 70, 200 70, 300 30 S 480 -5, 585 40" />
            </svg>

            {featureBadges.map((badge) => (
              <div key={badge.label.join("-")} className="badge">
                <span className="disc">{badge.icon}</span>
                <span className="lbl">
                  {badge.label[0]}
                  <br />
                  {badge.label[1]}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="card-wrap">
          <div ref={cardRef} className="card">
            <svg className="card-leaf" viewBox="0 0 100 120" fill="none" aria-hidden="true">
              <path d="M50 10C20 30 20 80 50 110 55 70 55 45 50 10Z" fill="#8a5c34" />
              <path d="M50 20C70 40 70 85 50 110 46 75 46 50 50 20Z" fill="#5aa62f" />
              <path d="M50 110V30" stroke="#3c6b20" strokeWidth="1.5" />
            </svg>

            <div className="clogo">WPE</div>
            <div className="welcome">Welcome Back!</div>
            <h2>Login to Your Account</h2>
            <div className="cdiv" />

            <form noValidate onSubmit={handleSubmit(onSubmit, onInvalid)}>
              <div className="field">
                <span className="ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                </span>
                <input
                  {...register("username")}
                  type="text"
                  autoComplete="username"
                  placeholder="Username or Email"
                  spellCheck={false}
                  aria-label="Username or Email"
                  aria-invalid={errors.username ? "true" : "false"}
                />
              </div>

              <div className="field">
                <span className="ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path d="M8 11V8a4 4 0 018 0v3" />
                  </svg>
                </span>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
                  aria-label="Password"
                  aria-invalid={errors.password ? "true" : "false"}
                />
                <button
                  type="button"
                  className="peek"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
                </button>
              </div>

              <div className="row">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span className="box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5L20 6" />
                    </svg>
                  </span>
                  Remember me
                </label>
                <button type="button" className="forgot">
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                className={["login", isSubmitting ? "busy" : "", isShaking ? "shake" : ""].filter(Boolean).join(" ")}
                disabled={isSubmitting}
              >
                <span className="lbl">{isSubmitting ? "Logging in" : "Login"}</span>
                <span className="arw" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h13M12 6l6 6-6 6" />
                  </svg>
                </span>
                <span className="spin" aria-hidden="true" />
              </button>
            </form>

            <div className="cfoot">
              <div className="t1">WPE Exterior Solutions</div>
              <div className="t2">Sustainable Today, Better Tomorrow</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
