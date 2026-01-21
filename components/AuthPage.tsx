import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface AuthPageProps {
  onSuccess?: () => void;
}

// 浮动粒子组件
const FloatingParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.3;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        const canvasWidth = canvas?.width || window.innerWidth;
        const canvasHeight = canvas?.height || window.innerHeight;

        if (this.x > canvasWidth) this.x = 0;
        if (this.x < 0) this.x = canvasWidth;
        if (this.y > canvasHeight) this.y = 0;
        if (this.y < 0) this.y = canvasHeight;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(34, 197, 94, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
};

// 动画表单字段组件
interface AnimatedFormFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: string;
  showToggle?: boolean;
  onToggle?: () => void;
  showPassword?: boolean;
  disabled?: boolean;
}

const AnimatedFormField: React.FC<AnimatedFormFieldProps> = ({
  type,
  placeholder,
  value,
  onChange,
  icon,
  showToggle,
  onToggle,
  showPassword,
  disabled
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="relative group mb-6">
      <div
        className="relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm transition-all duration-300 ease-in-out hover:border-white/30"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 transition-colors duration-200 group-focus-within:text-white">
          <span className="material-icons text-lg">{icon}</span>
        </div>

        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          className="w-full bg-transparent pl-12 pr-12 py-4 text-white placeholder:text-white/40 focus:outline-none text-base disabled:opacity-50"
          placeholder=""
        />

        <label className={`absolute left-12 transition-all duration-300 ease-in-out pointer-events-none ${
          isFocused || value
            ? 'top-2 text-xs text-green-300 font-medium'
            : 'top-1/2 -translate-y-1/2 text-sm text-white/60'
        }`}>
          {placeholder}
        </label>

        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-icons text-lg">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}

        {isHovering && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 197, 94, 0.1) 0%, transparent 70%)`
            }}
          />
        )}
      </div>
    </div>
  );
};

const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // 暂时隐藏注册功能
  const showRegister = false;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, register } = useAuth();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!email || !password) {
      setError(mode === 'login' ? '请填写用户名/邮箱和密码' : '请填写邮箱和密码');
      return;
    }
    
    // Only validate email format in register mode
    if (mode === 'register' && !validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    
    if (mode === 'register') {
      if (!name.trim()) {
        setError('请输入用户名');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      let result;
      if (mode === 'login') {
        result = await login(email, password);
      } else {
        result = await register(email, password, name);
      }
      
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || '操作失败');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingParticles />

      {/* Disclaimer Dialog for Login Page */}
      {showDisclaimer && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-fade-in" />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-scale-in">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full p-8 sm:p-10 border border-white/20">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <span className="material-icons text-white text-4xl">info</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-3">重要使用声明</h3>
                <p className="text-xl text-white/80 font-medium">本网站仅供个人使用</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
                <h4 className="font-bold text-white mb-4 text-xl">使用条款</h4>
                <ul className="text-white/90 space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="material-icons text-green-400 mt-0.5 text-xl flex-shrink-0">check_circle</span>
                    <span className="text-lg">本平台仅供个人学习和使用</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-icons text-red-400 mt-0.5 text-xl flex-shrink-0">warning</span>
                    <span className="font-semibold text-red-300 text-lg">本平台不开放给他人使用</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-icons text-green-400 mt-0.5 text-xl flex-shrink-0">check_circle</span>
                    <span className="text-lg">严禁用于商业用途或非法活动</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-icons text-green-400 mt-0.5 text-xl flex-shrink-0">check_circle</span>
                    <span className="text-lg">请遵守相关法律法规和平台规则</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-icons text-green-400 mt-0.5 text-xl flex-shrink-0">check_circle</span>
                    <span className="text-lg">使用过程中产生的任何责任由使用者自行承担</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 mb-8 text-center border border-white/10">
                <p className="text-xl font-semibold text-white mb-2">备案号：京ICP备2026002161号</p>
                <p className="text-white/70">WeChat AI Publisher v1.3.0</p>
              </div>

              <button
                onClick={() => setShowDisclaimer(false)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-green-400 hover:to-green-500 transition-all duration-300 shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/50 text-xl transform hover:scale-105"
              >
                我已阅读并同意
              </button>
            </div>
          </div>
        </>
      )}

      <div className="relative z-10 w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl shadow-2xl mb-6 transform transition-all duration-300 hover:scale-110 hover:rotate-3">
            <span className="material-icons text-white text-4xl">article</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wide">
            WeChat <span className="text-green-400">AI Publisher</span>
          </h1>
          <p className="text-xl text-white/70">
            登录您的账户
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 animate-slide-in-up">
          <form onSubmit={handleSubmit} className="space-y-2">
            {/* Email/Username Field */}
            <AnimatedFormField
              type="text"
              placeholder="用户名或邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon="person"
              disabled={isLoading}
            />

            {/* Password Field */}
            <AnimatedFormField
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon="lock"
              showToggle
              onToggle={() => setShowPassword(!showPassword)}
              showPassword={showPassword}
              disabled={isLoading}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 text-green-400 bg-white/10 border-white/30 rounded focus:ring-green-400 focus:ring-2 transition-all"
                />
                <span className="text-white/80 group-hover:text-white transition-colors text-sm">记住我</span>
              </label>

              <button
                type="button"
                className="text-sm text-green-400 hover:text-green-300 hover:underline transition-colors"
              >
                忘记密码？
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-300 px-6 py-4 rounded-xl text-sm flex items-center gap-3 animate-slide-in-up mb-6">
                <span className="material-icons text-lg">error_outline</span>
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-bold transition-all duration-300 hover:from-green-400 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transform hover:scale-105 active:scale-95 shadow-xl shadow-green-500/30"
            >
              <span className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                <span className="flex items-center justify-center gap-3">
                  <span className="material-icons text-xl">login</span>
                  <span className="text-lg">登录</span>
                </span>
              </span>

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            </button>
          </form>

          {/* Social Login Options */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-900/50 text-white/60 backdrop-blur-sm rounded-full">或使用以下方式</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <button className="flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group">
                <span className="material-icons text-white/80 group-hover:text-white text-2xl">login</span>
              </button>
              <button className="flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group">
                <span className="material-icons text-white/80 group-hover:text-white text-2xl">phone</span>
              </button>
              <button className="flex items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 group">
                <span className="material-icons text-white/80 group-hover:text-white text-2xl">email</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-white/50 space-y-2">
            <p className="text-sm">WeChat AI Publisher v1.3.0</p>
            <p className="text-xs">本网站仅供个人使用 • 备案号：京ICP备2026002161号</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
