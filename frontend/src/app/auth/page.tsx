"use client";

import AuthWidget from "@/widgets/auth/AuthWidget";

export default function AuthPage() {
  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-white font-sans">
      <style>{`
        @keyframes flood {
          0% { transform: translateY(100%) scaleY(1); opacity: 0.4; }
          50% { transform: translateY(50%) scaleY(1.2); opacity: 0.7; }
          100% { transform: translateY(-10%) scaleY(1.5); opacity: 0.9; }
        }
        @keyframes topo {
          0% { background-position: 0% 0%; }
          100% { background-position: 100% 100%; }
        }
        .bg-topo {
          background-image: repeating-radial-gradient(circle at 0 0, transparent 0, rgba(255,255,255,0.05) 20px, transparent 21px, transparent 40px);
          background-size: 200% 200%;
          animation: topo 40s linear infinite alternate;
        }
        .animate-flood {
          animation: flood 10s ease-in-out infinite alternate;
        }
      `}</style>

      <div className="relative hidden w-full overflow-hidden bg-[#0A73F0] md:flex flex-col justify-center items-center">
        <div className="absolute inset-0 bg-topo"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[120%] bg-gradient-to-t from-[#003B99] via-[#497ab3]/80 to-transparent animate-flood pointer-events-none"></div>
      </div>

      <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-8 sm:px-6">
        <AuthWidget />
      </div>
    </div>
  );
}
