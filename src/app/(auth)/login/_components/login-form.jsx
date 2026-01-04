// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import { useState } from "react";
// import { Loader2, Eye, EyeOff } from "lucide-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/contexts/AuthContext";

// const formSchema = z.object({
//   email: z.string().email("Please enter a valid email address."),
//   password: z.string().min(1, "Password is required."),
// });

// export function LoginForm() {
//   const [loading, setLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const { toast } = useToast();
//   const router = useRouter();
//   const { refresh } = useAuth(); // Get refresh from context

//   const form = useForm({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   async function onSubmit(values) {
//     setLoading(true);
//     try {
//       const res = await fetch("/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           email: values.email,
//           password: values.password,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         throw new Error(data.error || "Login failed");
//       }

//       // Success: refresh auth state (sets user + csrfToken from cookies)
//       await refresh();

//       toast({
//         title: "Logged in successfully",
//         description: "Welcome back! Redirecting you to the dashboard.",
//         className: "font-headline bg-white",
//       });

//       router.push("/dashboard");
//     } catch (error) {
//       toast({
//         variant: "destructive",
//         title: "Login Failed",
//         className: "bg-white",
//         description:
//           error.message === "Email not verified"
//             ? "Please verify your email before logging in."
//             : error.message || "Invalid email or password.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         <FormField
//           control={form.control}
//           name="email"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel>Email</FormLabel>
//               <FormControl>
//                 <Input
//                   type="email"
//                   placeholder="raniem57@gmail.com"
//                   {...field}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <FormField
//           control={form.control}
//           name="password"
//           render={({ field }) => (
//             <FormItem>
//               <div className="flex items-center justify-between">
//                 <FormLabel>Password</FormLabel>
//                 <Link
//                   href="/reset-password"
//                   className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>
//               <div className="relative">
//                 <FormControl>
//                   <Input
//                     type={showPassword ? "text" : "password"}
//                     placeholder="••••••••"
//                     {...field}
//                   />
//                 </FormControl>
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute inset-y-0 right-0 flex items-center pr-3"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? (
//                     <EyeOff className="h-5 w-5" />
//                   ) : (
//                     <Eye className="h-5 w-5" />
//                   )}
//                 </button>
//               </div>
//               <FormMessage />
//             </FormItem>
//           )}
//         />
//         <Button
//           type="submit"
//           className="w-full bg-orange-500 text-white hover:bg-highlight-blue transition-colors hover:text-white"
//           disabled={loading}
//         >
//           {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//           Log In
//         </Button>
//       </form>
//     </Form>
//   );
// }

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // UPDATE: Use 'login' instead of 'refresh' to set the session flag
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // UPDATE: Call login() here.
      // This sets the sessionStorage flag AND fetches the user.
      await login();

      toast({
        title: "Logged in successfully",
        description: "Welcome back! Redirecting you to the dashboard.",
        className: "font-headline bg-white",
      });

      router.push("/dashboard");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        className: "bg-white",
        description:
          error.message === "Email not verified"
            ? "Please verify your email before logging in."
            : error.message || "Invalid email or password.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="raniem57@gmail.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Password</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-medium text-red-500 hover:text-red-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <FormControl>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full bg-orange-500 text-white hover:bg-highlight-blue transition-colors hover:text-white"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Log In
        </Button>
      </form>
    </Form>
  );
}
