import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft, Phone, Mail } from "lucide-react";

type SignupMethod = "email" | "whatsapp";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>("whatsapp");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, signUpWithPhone, signInWithPhone } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Login: detect if input is phone or email
      const isPhoneLogin = !email.includes("@");
      const { error } = isPhoneLogin
        ? await signInWithPhone(email, password)
        : await signIn(email, password);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Welcome back!");
        navigate("/");
      }
    } else {
      // Signup
      if (signupMethod === "whatsapp") {
        if (!phone || phone.length < 10) {
          toast.error("Please enter a valid WhatsApp number");
          setLoading(false);
          return;
        }
        const { error } = await signUpWithPhone(phone, password, fullName);
        if (error) {
          if (error.message?.includes("rate") || error.message?.includes("limit")) {
            toast.error("Too many attempts. Please wait a moment and try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Welcome!");
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Account created! You can now sign in.");
          setIsLogin(true);
        }
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-card/95 backdrop-blur-lg rounded-2xl p-8 shadow-luxury border border-border">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} /> Back to home
          </button>

          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl font-bold text-primary mb-2">GORILLA TREKKING<span className="block text-sm tracking-[0.15em]">GUEST HOUSE</span></h1>
            <p className="text-muted-foreground font-sans text-sm">
              {isLogin ? "Welcome back. Sign in to continue." : "Create your account to get started."}
            </p>
          </div>

          {/* Signup method toggle - only on signup */}
          {!isLogin && (
            <div className="flex rounded-xl bg-muted p-1 mb-6 gap-1">
              <button
                type="button"
                onClick={() => setSignupMethod("whatsapp")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-sans font-medium transition-all ${
                  signupMethod === "whatsapp"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Phone size={16} /> WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setSignupMethod("email")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-sans font-medium transition-all ${
                  signupMethod === "email"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Mail size={16} /> Email
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="font-sans text-sm">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  className="mt-1.5 font-sans"
                />
              </div>
            )}

            {/* Login: single field for email or phone */}
            {isLogin ? (
              <div>
                <Label className="font-sans text-sm">Email or WhatsApp Number</Label>
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com or +250788..."
                  required
                  className="mt-1.5 font-sans"
                />
              </div>
            ) : signupMethod === "whatsapp" ? (
              <div>
                <Label className="font-sans text-sm">WhatsApp Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  required
                  className="mt-1.5 font-sans"
                />
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Enter your WhatsApp number with country code
                </p>
              </div>
            ) : (
              <div>
                <Label className="font-sans text-sm">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5 font-sans"
                />
              </div>
            )}

            <div>
              <Label className="font-sans text-sm">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pr-10 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-xs text-primary hover:underline font-sans"
              >
                Forgot password?
              </button>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-sans tracking-wide py-5"
            >
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6 font-sans">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
