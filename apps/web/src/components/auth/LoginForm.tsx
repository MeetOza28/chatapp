"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await authClient.signIn.email({
        email:    values.email,
        password: values.password,
      });

      if (result.error) {
        if (result.error.status === 401) {
          setServerError("Invalid email or password");
          await Swal.fire({
            icon:              "error",
            title:             "Login failed",
            text:              "The email or password you entered is incorrect.",
            confirmButtonText: "Try again",
            confirmButtonColor: "#7c3aed",
            showClass: { popup: "animate__animated animate__shakeX animate__faster" },
            timer:             3000,
            timerProgressBar:  true,
          });
          return;
        }
        if (result.error.status === 429) {
          toast.error("Too many attempts. Please wait before trying again.", { duration: 5000 });
          return;
        }
        setServerError(result.error.message ?? "Something went wrong");
        return;
      }

      await Swal.fire({
        icon:              "success",
        title:             "Welcome back! 🎉",
        text:              "Taking you to your chats...",
        confirmButtonColor: "#7c3aed",
        timer:             1400,
        timerProgressBar:  true,
        showConfirmButton: false,
        showClass: { popup: "animate__animated animate__fadeInDown animate__faster" },
        hideClass: { popup: "animate__animated animate__fadeOutUp animate__faster" },
      });

      router.push("/rooms");
      router.refresh();

    } catch {
      setServerError("Could not connect. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 style={{ fontSize: "22px", fontWeight: "700", color: "hsl(var(--foreground))", marginBottom: "6px" }}>
          Welcome back
        </h2>
        <p style={{ fontSize: "14px", color: "hsl(var(--muted-foreground))" }}>
          Sign in to continue to ChatApp
        </p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-5 rounded-xl">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="login-email" className="text-sm font-medium">
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="login-email"
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
                <FormLabel htmlFor="login-password" className="text-sm font-medium">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      className="pl-10 pr-10 h-11 rounded-xl border-border/60 focus:border-primary transition-colors"
                      {...field}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
              transition: "all 0.2s ease",
            }}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</>
            ) : (
              "Sign in"
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

      {/* Register link */}
      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary hover:underline underline-offset-4 transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}