'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Package, 
  Factory, 
  Brain, 
  ArrowRight, 
  Sparkles,
  BarChart3,
  Zap,
  Shield,
  ChevronRight
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    }
  },
};

const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

const features = [
  {
    icon: Package,
    title: "จัดการคลังสินค้า",
    description: "ติดตามสต๊อกเสื้อ หมึก และวัตถุดิบแบบเรียลไทม์ พร้อมแจ้งเตือนอัตโนมัติ",
    color: "from-sky-500 to-cyan-600",
    bgColor: "bg-sky-50",
    iconColor: "text-sky-600",
    href: "/stock",
  },
  {
    icon: Factory,
    title: "ติดตามการผลิต",
    description: "ดูสถานะงานผลิตตั้งแต่รับออเดอร์จนถึงส่งมอบ แบบ Real-time",
    color: "from-orange-500 to-amber-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    href: "/production",
  },
  {
    icon: Brain,
    title: "ศูนย์ความรู้ AI",
    description: "ถามคำถาม รับคำตอบทันทีจากฐานความรู้โรงงานของคุณ",
    color: "from-teal-500 to-emerald-600",
    bgColor: "bg-teal-50",
    iconColor: "text-teal-600",
    href: "/crm",
  },
];

const stats = [
  { value: "99.9%", label: "ความเสถียร", icon: Shield },
  { value: "50%", label: "ทำงานเร็วขึ้น", icon: Zap },
  { value: "เรียลไทม์", label: "อัปเดตสต๊อก", icon: BarChart3 },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-mesh relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-sky-200/30 via-transparent to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-cyan-200/20 via-transparent to-transparent blur-3xl" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-sky-500/30">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">อนาจักร</h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Superapp</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link 
            href="/login" 
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            เข้าสู่ระบบ
          </Link>
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5"
          >
            แดชบอร์ด
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-24">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 border border-sky-100 mb-8">
            <Sparkles className="w-4 h-4 text-sky-500" />
            <span className="text-sm font-medium text-sky-700">ระบบปฏิบัติการโรงงานยุคใหม่</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={item}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6"
          >
            บริหารโรงงาน{" "}
            <span className="text-gradient">อย่างชาญฉลาด</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={item}
            className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            แพลตฟอร์มกลางสำหรับบริหารจัดการสต๊อก การผลิต และลูกค้าสัมพันธ์ 
            ทุกอย่างอยู่ในที่เดียว ทำงานได้ทุกที่ ทุกเวลา
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            variants={item}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-600 text-white text-base font-semibold hover:from-sky-600 hover:to-cyan-700 transition-all shadow-xl shadow-sky-500/30 hover:shadow-2xl hover:shadow-sky-500/40 hover:-translate-y-1"
            >
              เริ่มต้นใช้งาน
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 text-base font-semibold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              ลงชื่อเข้าใช้
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-20"
        >
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              animate={floatAnimation}
              style={{ animationDelay: `${index * 0.2}s` }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm mb-3">
                <stat.icon className="w-5 h-5 text-sky-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-display">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Feature Cards */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={item}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <Link href={feature.href}>
                <div className="relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 h-full">
                  {/* Gradient Overlay on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300`} />
                  
                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-xl font-bold text-slate-900 mb-3 font-display">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">{feature.description}</p>
                  
                  {/* Link */}
                  <div className={`inline-flex items-center gap-2 text-sm font-semibold ${feature.iconColor} group-hover:gap-3 transition-all duration-300`}>
                    เข้าสู่โมดูล
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Decoration */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-3 mt-20 text-slate-400"
        >
          <div className="h-px w-12 bg-slate-300" />
          <span className="text-xs font-mono uppercase tracking-widest">โรงงานเสื้อยืดอนาจักร</span>
          <div className="h-px w-12 bg-slate-300" />
        </motion.div>
      </main>
    </div>
  );
}
