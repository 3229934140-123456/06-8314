import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, User, Lock } from "lucide-react";
import { useStore } from "@/store";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(username, password);
    if (success) {
      navigate("/surveys");
    } else {
      setError("用户名或密码错误，请重试");
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 px-8 py-10"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <ShieldCheck size={36} color="#f0a500" />
            <h1 className="text-3xl font-bold text-white">匿名之声</h1>
          </div>
          <p className="text-sm text-gray-400">内部匿名意见收集平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <User size={18} className="shrink-0 text-gray-500" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <Lock size={18} className="shrink-0 text-gray-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #f0a500, #d4940a)",
            }}
          >
            登 录
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          测试账号: admin / employee1
        </p>
      </motion.div>
    </div>
  );
}
