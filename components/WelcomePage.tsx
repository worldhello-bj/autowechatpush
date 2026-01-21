import React, { useState, useEffect } from 'react';

interface WelcomePageProps {
  onEnter: () => void;
}

// 现代化粒子背景组件
const ParticleBackground: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

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
      color: string;

      constructor() {
        this.x = Math.random() * (canvas?.width || window.innerWidth);
        this.y = Math.random() * (canvas?.height || window.innerHeight);
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.2;

        // 绿色系渐变色
        const colors = [
          'rgba(34, 197, 94, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(5, 150, 105, 0.6)',
          'rgba(20, 83, 45, 0.4)'
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
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
        ctx.fillStyle = this.color.replace('0.6', this.opacity.toString()).replace('0.4', (this.opacity * 0.8).toString());
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
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

// 打字机效果组件
const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  return (
    <span className="inline-block">
      {displayText}
      <span className="animate-pulse text-green-400">|</span>
    </span>
  );
};

// 功能卡片组件
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  delay: number;
}> = ({ icon, title, description, delay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`transform transition-all duration-700 ease-out ${
        isVisible
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-8 opacity-0 scale-95'
      }`}
    >
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="material-icons text-white text-2xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-white/80 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: 'smart_toy',
      title: 'AI 智能写作',
      description: '深度整合 DeepSeek、通义千问等AI模型，一键生成高质量公众号文章'
    },
    {
      icon: 'edit_note',
      title: '可视化编辑器',
      description: '所见即所得的富文本编辑器，支持20+种内容区块，实时预览效果'
    },
    {
      icon: 'publish',
      title: '一键发布',
      description: '无缝对接微信公众号，直接发布到草稿箱或正式发布'
    },
    {
      icon: 'analytics',
      title: '数据分析',
      description: '实时查看阅读量、点赞、分享等数据，优化内容策略'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative overflow-hidden">
      <ParticleBackground />

      {/* 主内容区域 */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-6xl mx-auto">
          {/* 头部标题区域 */}
          <div className={`text-center mb-12 transition-all duration-1000 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-3xl shadow-2xl mb-8 transform transition-all duration-500 hover:scale-110 hover:rotate-3">
              <span className="material-icons text-white text-5xl">article</span>
            </div>

            {/* 主标题 */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
              WeChat{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                AI Publisher
              </span>
            </h1>

            {/* 副标题 */}
            <div className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
              <TypewriterText
                text="智能微信公众号文章生成与发布工具，让创作更高效，让发布更简单"
                delay={80}
              />
            </div>

            {/* 版本信息 */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 mb-8">
              <span className="text-white/80 text-sm">v1.3.0</span>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/80 text-sm">正式版</span>
            </div>
          </div>

          {/* 功能特性网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={1000 + index * 200}
              />
            ))}
          </div>

          {/* 行动按钮 */}
          <div className={`text-center transition-all duration-1000 delay-1500 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <button
              onClick={onEnter}
              className="group relative inline-flex items-center justify-center px-12 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white text-xl font-bold rounded-2xl shadow-2xl shadow-green-500/30 hover:shadow-3xl hover:shadow-green-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                <span>开始使用</span>
                <span className="material-icons text-2xl group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
              </span>

              {/* 按钮动画效果 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

              {/* 脉冲效果 */}
              <div className="absolute inset-0 rounded-2xl border-2 border-green-400/50 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <p className="text-white/60 text-sm mt-4">
              免费使用 • 无需注册 • 仅供个人学习使用
            </p>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="relative z-10 p-6 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-white/50 text-sm">
          <span>© 2024 WeChat AI Publisher</span>
          <span className="hidden md:block">•</span>
          <span>备案号：京ICP备2026002161号</span>
          <span className="hidden md:block">•</span>
          <span>本网站仅供个人使用</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
