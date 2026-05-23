"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, User, Mail, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";

// ── Password strength ─────────────────────────────────────────
type StrengthLevel = "empty" | "weak" | "medium" | "strong";

function getStrength(pw: string): { level: StrengthLevel; score: number; label: string } {
  if (!pw) return { level: "empty", score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8)           score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^a-zA-Z0-9]/.test(pw))  score++;
  if (score === 1) return { level: "weak",   score: 1, label: "Weak" };
  if (score === 2) return { level: "medium", score: 2, label: "Fair" };
  return                { level: "strong", score: 3, label: "Strong" };
}

const STRENGTH_COLORS: Record<string, string> = {
  weak:   "#ef4444",
  medium: "#f59e0b",
  strong: "#22c55e",
  empty:  "transparent",
};

export function RegisterForm() {
  const router = useRouter();

  const [showPassword,  setShowPassword]  = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [pwValue,       setPwValue]       = useState("");

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
    mode: "onBlur",
  });

  const usernameLen = form.watch("username").length;
  const strength    = getStrength(pwValue);

  async function onSubmit(values: RegisterInput) {
    setIsSubmitting(true);
    try {
      const result = await authClient.signUp.email({
        name:     values.username,
        email:    values.email,
        password: values.password,
        username: values.username,
      });

      if (result.error) {
        const { status, message = "" } = result.error;

        if (status === 409 || message.toLowerCase().includes("already exists")) {
          await Swal.fire({
            icon:              "warning",
            title:             "Already taken",
            text:              "An account with this email or username already exists.",
            confirmButtonColor:"#7c3aed",
            showClass: { popup: "animate__animated animate__headShake animate__faster" },
          });
          if (message.toLowerCase().includes("username")) {
            form.setError("username", { message: "This username is taken" });
          } else {
            form.setError("email", { message: "This email is already registered" });
          }
          return;
        }

        if (status === 429) {
          toast.error("Too many attempts. Please wait and try again.");
          return;
        }

        toast.error(message || "Registration failed. Please try again.");
        return;
      }

      // Auto sign in
      await authClient.signIn.email({ email: values.email, password: values.password });

      await Swal.fire({
        icon:              "success",
        title:             `Welcome, ${values.username}! 🎉`,
        html:              "Your account has been created.<br/>Taking you to your chats...",
        confirmButtonColor:"#7c3aed",
        timer:             2000,
        timerProgressBar:  true,
        showConfirmButton: false,
        showClass: { popup: "animate__animated animate__bounceIn animate__faster" },
        hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
      });

      router.push("/rooms");
      router.refresh();

    } catch {
      toast.error("Could not connect. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">

      {/* Header */}
      <div className="mb-6">
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "hsl(var(--foreground))", marginBottom: "6px" }}>
          Create your account
        </h2>
        <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))" }}>
          Join thousands of teams on ChatApp
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Username */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="reg-username" className="text-sm font-medium">
                    Username
                  </FormLabel>
                  <span style={{
                    fontSize: "11px",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    background: usernameLen > 40
                      ? "rgba(239,68,68,0.1)"
                      : "rgba(124,58,237,0.1)",
                    color: usernameLen > 40 ? "#ef4444" : "#7c3aed",
                    fontWeight: "500",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {usernameLen} / 50
                  </span>
                </div>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="reg-username"
                      type="text"
                      placeholder="your_username"
                      autoComplete="username"
                      disabled={isSubmitting}
                      maxLength={50}
                      className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="reg-email" className="text-sm font-medium">
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="pl-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="reg-password" className="text-sm font-medium">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="pl-10 pr-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setPwValue(e.target.value);
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Hide" : "Show"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>

                {/* Strength bar */}
                {pwValue && (
                  <div className="mt-2 space-y-1.5" aria-live="polite">
                    <div className="flex gap-1.5">
                      {[1, 2, 3].map(bar => (
                        <div
                          key={bar}
                          style={{
                            height: "4px",
                            flex: 1,
                            borderRadius: "999px",
                            background: bar <= strength.score
                              ? STRENGTH_COLORS[strength.level]
                              : "hsl(var(--border))",
                            transition: "background 0.3s ease",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck
                        className="h-3.5 w-3.5"
                        style={{ color: STRENGTH_COLORS[strength.level] }}
                      />
                      <span style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: STRENGTH_COLORS[strength.level],
                      }}>
                        {strength.label} password
                      </span>
                    </div>
                  </div>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="reg-confirm" className="text-sm font-medium">
                  Confirm password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat your password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="pl-10 pr-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowConfirm(v => !v)}
                      aria-label={showConfirm ? "Hide" : "Show"}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl font-semibold text-sm mt-2"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              color: "#fff",
              boxShadow: "0 4px 15px rgba(102,126,234,0.4)",
            }}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Login link */}
      <p className="text-sm text-center text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline underline-offset-4 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}