'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Zap } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface MousePos { x: number; y: number }

// ─── Custom cursor ───────────────────────────────────────────────────────────

function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<MousePos>({ x: -100, y: -100 })
  const ringPosRef = useRef<MousePos>({ x: -100, y: -100 })
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const loop = () => {
      const { x: mx, y: my } = mouseRef.current
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${mx}px,${my}px)`
      }
      // Lerp ring toward mouse
      const rp = ringPosRef.current
      rp.x += (mx - rp.x) * 0.12
      rp.y += (my - rp.y) * 0.12
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${rp.x}px,${rp.y}px)`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="lp-cursor-dot" />
      <div ref={ringRef} className="lp-cursor-ring" />
    </>
  )
}

// ─── 3D tilt card (CRM mockup) ───────────────────────────────────────────────

function TiltCard() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const rotX = ((e.clientY - cy) / (rect.height / 2)) * -10
    const rotY = ((e.clientX - cx) / (rect.width / 2)) * 10
    cardRef.current.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`
  }, [])

  const onLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
    cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)'
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = 'transform 0.1s ease'
    }, 500)
  }, [])

  const stages = [
    { label: 'New', count: 14, pct: 80 },
    { label: 'Qualified', count: 8, pct: 55 },
    { label: 'Proposal', count: 5, pct: 35 },
    { label: 'Closed', count: 3, pct: 20 },
  ]

  return (
    <div
      ref={wrapRef}
      className="lp-card-3d-wrapper w-full max-w-md mx-auto lg:mx-0"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        ref={cardRef}
        className="lp-card-3d rounded-2xl border p-5 sm:p-6"
        style={{ borderColor: 'var(--ink-border)', background: 'var(--ink-dim)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }} className="font-bold text-sm">
              Pipeline overview
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--lp-muted)' }}>Finch Studio · Q1 2026</div>
          </div>
          <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: 'rgba(255,77,28,0.15)', color: 'var(--lp-accent)' }}>
            Live
          </div>
        </div>

        {/* Metric row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Active leads', val: '30' },
            { label: 'Pipeline value', val: '$84k' },
            { label: 'Close rate', val: '21%' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}>{m.val}</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--lp-muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Stage bars */}
        <div className="space-y-2.5">
          {stages.map((s) => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--lp-muted)' }}>{s.label}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--lp-text)' }}>{s.count}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${s.pct}%`, background: 'var(--lp-accent)' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* AI note */}
        <div className="mt-4 rounded-xl p-3 text-xs" style={{ background: 'rgba(0,87,255,0.1)', color: 'rgba(245,243,238,0.7)', borderLeft: '2px solid var(--lp-accent2)' }}>
          AI: <span style={{ color: 'var(--lp-text)' }}>Proposal stage stalled 6 days. Recommend follow-up email for 3 leads.</span>
        </div>
      </div>
    </div>
  )
}

// ─── IntersectionObserver reveal hook ────────────────────────────────────────

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal')
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const delay = el.dataset.delay ?? '0'
            setTimeout(() => el.classList.add('is-visible'), Number(delay))
            obs.unobserve(el)
          }
        })
      },
      { threshold: 0.12 }
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

// ─── Sticky how-it-works section ─────────────────────────────────────────────

function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const total = sectionRef.current.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const pct = Math.min(1, scrolled / total)
      setStep(pct < 0.33 ? 0 : pct < 0.66 ? 1 : 2)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const steps = [
    {
      num: '01',
      title: 'Capture & qualify leads',
      body: 'Embed a form on any page. Leads flow in automatically with full context — source, timestamp, and intake data attached.',
      visual: (
        <div className="space-y-3">
          {['Revamp sprint · Finch Studio', 'New website · Apex Media', 'SEO retainer · Reach Digital'].map((name, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: i === 0 ? 'var(--lp-accent)' : 'rgba(255,255,255,0.2)' }} />
              <span className="text-sm" style={{ color: i === 0 ? 'var(--lp-text)' : 'var(--lp-muted)' }}>{name}</span>
              <span className="ml-auto text-[11px] rounded-full px-2 py-0.5" style={{ background: 'rgba(255,77,28,0.15)', color: 'var(--lp-accent)' }}>New</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: '02',
      title: 'AI drafts your follow-up',
      body: 'Groq reads the lead profile, deal stage, and past notes — then writes a personalized email ready to send in one click.',
      visual: (
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(0,87,255,0.08)', border: '1px solid rgba(0,87,255,0.2)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--lp-accent2)' }}>
            <Zap className="h-3 w-3" /> AI-drafted follow-up
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--lp-text)' }}>
            "Hi Jordan, following up on the website redesign proposal — wanted to check if you had a chance to review the scope doc I sent Thursday. Happy to jump on a quick call to walk through the timeline."
          </p>
          <div className="flex gap-2">
            <button className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: 'var(--lp-accent2)', color: '#fff' }}>Send now</button>
            <button className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--lp-muted)' }}>Edit first</button>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'Close with full context',
      body: 'Every touchpoint, note, and task lives in one record. Move the deal to Closed — Won, and automation handles the rest.',
      visual: (
        <div className="space-y-2">
          {[
            { event: 'Form submitted', time: '8 days ago', color: 'var(--lp-muted)' },
            { event: 'AI follow-up sent', time: '6 days ago', color: 'var(--lp-accent2)' },
            { event: 'Call scheduled', time: '5 days ago', color: 'var(--lp-muted)' },
            { event: 'Proposal sent', time: '3 days ago', color: 'var(--lp-gold)' },
            { event: 'Deal closed · Won', time: 'Today', color: '#4ade80' },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
              <span style={{ color: 'var(--lp-text)' }}>{e.event}</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--lp-muted)' }}>{e.time}</span>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div ref={sectionRef} style={{ height: '300vh', background: 'var(--ink)' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh' }} className="flex items-center">
        <div className="w-full max-w-6xl mx-auto px-6 lg:px-8 grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Steps sidebar */}
          <div className="space-y-8">
            <div className="lp-reveal" data-delay="0">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lp-accent)' }}>How it works</span>
              <h2 className="mt-3 text-4xl sm:text-5xl font-bold leading-[0.95] tracking-[-0.03em]" style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}>
                Three steps.<br />Zero chaos.
              </h2>
            </div>
            <div className="space-y-6">
              {steps.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setStep(i)}
                  className="flex gap-4 cursor-pointer transition-opacity duration-300"
                  style={{ opacity: step === i ? 1 : 0.35 }}
                >
                  <div className="text-2xl font-bold flex-shrink-0 tabular-nums" style={{ fontFamily: 'var(--font-syne)', color: step === i ? 'var(--lp-accent)' : 'var(--lp-muted)' }}>
                    {s.num}
                  </div>
                  <div>
                    <div className="font-semibold text-base" style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}>{s.title}</div>
                    {step === i && (
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>{s.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual pane */}
          <div className="rounded-2xl p-6 transition-all duration-500" style={{ background: 'var(--ink-dim)', border: '1px solid var(--ink-border)' }}>
            <div className="text-xs font-semibold mb-4 uppercase tracking-[0.15em]" style={{ color: 'var(--lp-muted)' }}>
              Step {steps[step].num}
            </div>
            <div key={step} style={{ animation: 'fadeIn 0.4s var(--lp-ease)' }}>
              {steps[step].visual}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Hero parallax scroll ─────────────────────────────────────────────────────

function HeroParallax({ children }: { children: React.ReactNode }) {
  const heroRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<MousePos>({ x: 0, y: 0 })
  const orb1Ref = useRef<HTMLDivElement>(null)
  const orb2Ref = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current || !innerRef.current || !textRef.current) return
      const scrollY = window.scrollY
      const heroH = heroRef.current.offsetHeight / 2
      const pct = Math.min(1, scrollY / heroH)
      textRef.current.style.opacity = String(1 - pct * 1.4)
      textRef.current.style.transform = `translateY(${scrollY * 0.3}px)`
    }
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    const loop = () => {
      const { x, y } = mouseRef.current
      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate(${x * 30}px, ${y * 20}px)`
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate(${x * -20}px, ${y * -15}px)`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div ref={heroRef} style={{ background: 'var(--ink)', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* Ambient orbs */}
      <div ref={orb1Ref} className="pointer-events-none absolute rounded-full" style={{ width: 600, height: 600, top: '-10%', right: '-10%', background: 'radial-gradient(circle, rgba(255,77,28,0.12) 0%, transparent 70%)', transition: 'transform 0.1s ease', willChange: 'transform' }} />
      <div ref={orb2Ref} className="pointer-events-none absolute rounded-full" style={{ width: 500, height: 500, bottom: '0%', left: '-5%', background: 'radial-gradient(circle, rgba(0,87,255,0.10) 0%, transparent 70%)', transition: 'transform 0.1s ease', willChange: 'transform' }} />

      {/* Content */}
      <div ref={innerRef} className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-8">
        <div ref={textRef} style={{ willChange: 'transform, opacity' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useReveal()

  // Add body class for cursor: none
  useEffect(() => {
    document.body.classList.add('lp-active')
    return () => document.body.classList.remove('lp-active')
  }, [])

  const features = [
    { title: 'AI-powered follow-ups', body: 'Groq AI drafts personalized emails based on lead behavior and deal stage.', icon: '⚡' },
    { title: 'Visual pipeline', body: 'Drag-and-drop Kanban with custom stages per client account.', icon: '📊' },
    { title: 'Automation workflows', body: 'Triggers, task assignment, and stage moves that run themselves.', icon: '🔁' },
    { title: 'Multi-tenant ready', body: 'Manage unlimited client sub-accounts from one dashboard.', icon: '🏢' },
    { title: 'Lead capture forms', body: 'Embeddable forms that push directly into your pipeline.', icon: '📥' },
    { title: 'Full activity history', body: 'Every touchpoint, note, and task in one unified lead record.', icon: '📋' },
  ]

  const testimonials = [
    { name: 'Mia Santos', role: 'Founder · SynthGrowth Agency', quote: '"We replaced GoHighLevel and HubSpot with LeadFlow. The AI follow-up alone recovered three deals we had written off."' },
    { name: 'Carlos Reyes', role: 'Head of Ops · Reach Digital', quote: '"Finally a CRM that feels built for agencies. The multi-tenant setup took 20 minutes."' },
    { name: 'Priya Nair', role: 'Director · Apex Media Co.', quote: '"My team went from 4 hours of CRM admin per day to under 30 minutes."' },
  ]

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/mo',
      sub: 'Try it, no card needed',
      features: [
        '1 workspace',
        '50 leads / month',
        'Kanban pipeline',
        'Lead intake forms',
        'No automations',
        'No AI assist',
      ],
      featured: false,
      cta: 'Get started free',
      note: null,
    },
    {
      name: 'Starter',
      price: '$29',
      period: '/mo',
      sub: 'Solo operators & small teams',
      features: [
        '1 workspace',
        '500 leads / month',
        '10 automation rules',
        'AI lead summaries',
        'Google Forms integration',
        'Email support',
      ],
      featured: false,
      cta: 'Start free trial',
      note: null,
    },
    {
      name: 'Pro',
      price: '$79',
      period: '/mo',
      sub: 'Growing agencies',
      features: [
        '3 workspaces',
        '5,000 leads / month',
        'Unlimited automations',
        'AI follow-ups & tasks',
        'Webhook intake',
        'Priority support',
      ],
      featured: true,
      cta: 'Start free trial',
      note: '2 months free with annual billing',
    },
    {
      name: 'Agency',
      price: '$199',
      period: '/mo',
      sub: 'High-volume client operations',
      features: [
        '10 workspaces',
        'Unlimited leads',
        'Unlimited automations',
        'White-label forms',
        'API access',
        'Dedicated onboarding',
      ],
      featured: false,
      cta: 'Start free trial',
      note: null,
    },
  ]

  const marqueeItems = ['Lead Capture', 'AI Follow-up', 'Pipeline Automation', 'Multi-tenant CRM', 'Email Sequences', 'Analytics Dashboard', 'Agency Ready']

  return (
    <>
      <Cursor />

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 lg:px-10" style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: 'var(--lp-accent)', fontFamily: 'var(--font-syne)', color: '#fff' }}>L</div>
          <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}>LeadFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm px-4 py-2 rounded-full transition-colors" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
            Sign in
          </Link>
          <Link href="/register" className="text-sm px-4 py-2 rounded-full font-semibold transition-colors" style={{ background: 'var(--lp-accent)', color: '#fff', fontFamily: 'var(--font-dm)' }}>
            Start free →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <HeroParallax>
        <div className="min-h-screen flex flex-col justify-center pt-24 pb-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
            {/* Left */}
            <div className="space-y-7">
              <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-dm)' }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--lp-accent)' }} />
                <span className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: 'var(--lp-accent)' }}>Now in public beta</span>
              </div>
              <h1
                className="text-5xl sm:text-6xl xl:text-7xl font-extrabold leading-[0.92] tracking-[-0.04em]"
                style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}
              >
                Close deals<br />
                <em className="not-italic" style={{ color: 'var(--lp-accent)' }}>smarter,</em><br />
                faster.
              </h1>
              <p
                className="text-base sm:text-lg leading-relaxed max-w-md"
                style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}
              >
                LeadFlow is the CRM built for digital marketing agencies — AI-powered follow-ups, visual pipelines, and automation that actually works.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                  style={{ background: 'var(--lp-accent)', color: '#fff', fontFamily: 'var(--font-dm)' }}
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all hover:opacity-80"
                  style={{ border: '1px solid rgba(255,255,255,0.15)', color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}
                >
                  See how it works
                </a>
              </div>
            </div>

            {/* Right — 3D card */}
            <TiltCard />
          </div>
        </div>
      </HeroParallax>

      {/* ── Marquee ─────────────────────────────────────────────────────── */}
      <div className="overflow-hidden py-4" style={{ background: 'var(--lp-accent)' }}>
        <div className="lp-marquee-track">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-6 text-sm font-semibold uppercase tracking-[0.15em] whitespace-nowrap" style={{ color: '#fff', fontFamily: 'var(--font-dm)' }}>
              {item} <span className="mx-4 opacity-40">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8" style={{ background: 'var(--lp-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="lp-reveal text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}>Features</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-syne)', color: 'var(--ink)' }}>
              Everything your pipeline needs.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="lp-reveal rounded-2xl p-6 transition-shadow hover:shadow-lg"
                data-delay={String(i * 80)}
                style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <div className="text-2xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-syne)', color: 'var(--ink)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(10,10,15,0.6)', fontFamily: 'var(--font-dm)' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <div id="how-it-works">
        <HowItWorks />
      </div>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8" style={{ background: 'var(--lp-surface-warm)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="lp-reveal text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}>What agencies say</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-syne)', color: 'var(--ink)' }}>
              Real teams. Real results.
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="lp-reveal rounded-2xl p-6"
                data-delay={String(i * 100)}
                style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}
              >
                <p className="text-base leading-relaxed mb-5" style={{ color: 'var(--ink)', fontFamily: 'var(--font-dm)', fontStyle: 'italic' }}>{t.quote}</p>
                <div>
                  <div className="font-bold text-sm" style={{ fontFamily: 'var(--font-syne)', color: 'var(--ink)' }}>{t.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(10,10,15,0.5)', fontFamily: 'var(--font-dm)' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 lg:px-8" style={{ background: 'var(--ink)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="lp-reveal text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--lp-accent)', fontFamily: 'var(--font-dm)' }}>Pricing</span>
            <h2 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-[-0.03em]" style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}>
              Priced on workspaces,<br />not seats.
            </h2>
          </div>
          <div className="lp-reveal text-center mb-12" data-delay="100">
            <p className="text-sm" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
              Add more clients, not more teammates. Team members are unlimited on every plan.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p, i) => (
              <div
                key={p.name}
                className="lp-reveal rounded-2xl p-5 flex flex-col"
                data-delay={String(i * 80)}
                style={{
                  background: p.featured ? 'var(--lp-accent)' : 'var(--ink-dim)',
                  border: p.featured ? 'none' : '1px solid var(--ink-border)',
                  transform: p.featured ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                {p.featured && (
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm)' }}>Most popular</div>
                )}
                <div className="mb-0.5 font-bold text-base" style={{ fontFamily: 'var(--font-syne)', color: p.featured ? '#fff' : 'var(--lp-text)' }}>{p.name}</div>
                <div className="text-[11px] mb-4" style={{ color: p.featured ? 'rgba(255,255,255,0.6)' : 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>{p.sub}</div>
                <div className="flex items-end gap-1 mb-5">
                  <span className="text-3xl font-extrabold" style={{ fontFamily: 'var(--font-syne)', color: p.featured ? '#fff' : 'var(--lp-text)' }}>{p.price}</span>
                  {p.period && <span className="text-xs mb-1" style={{ color: p.featured ? 'rgba(255,255,255,0.65)' : 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>{p.period}</span>}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: p.featured ? 'rgba(255,255,255,0.85)' : 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
                      <Check className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: p.featured ? '#fff' : 'var(--lp-accent)' }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {p.note && (
                  <div className="text-[10px] mb-3 text-center" style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-dm)' }}>{p.note}</div>
                )}
                <Link
                  href="/register"
                  className="w-full text-center py-2.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-90"
                  style={{
                    background: p.featured ? '#fff' : 'rgba(255,77,28,0.15)',
                    color: p.featured ? 'var(--lp-accent)' : 'var(--lp-accent)',
                    border: p.featured ? 'none' : '1px solid rgba(255,77,28,0.3)',
                    fontFamily: 'var(--font-dm)',
                  }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="lp-reveal mt-8 text-center" data-delay="200">
            <p className="text-xs" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
              Annual billing saves 2 months · No credit card required to start · Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 lg:px-8 text-center" style={{ background: 'var(--lp-surface)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="lp-reveal">
            <h2
              className="text-5xl sm:text-6xl xl:text-7xl font-extrabold tracking-[-0.04em] leading-[0.9]"
              style={{ fontFamily: 'var(--font-syne)', color: 'var(--ink)' }}
            >
              Your pipeline,<br />
              <span style={{ color: 'var(--lp-accent)' }}>fully alive.</span>
            </h2>
            <p className="mt-6 text-base sm:text-lg" style={{ color: 'rgba(10,10,15,0.55)', fontFamily: 'var(--font-dm)', fontWeight: 300 }}>
              Join 600+ agencies on the waitlist. Free trial, no credit card required.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: 'var(--ink)', color: 'var(--lp-text)', fontFamily: 'var(--font-dm)' }}
              >
                Start your free trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 lg:px-8" style={{ background: 'var(--ink)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-xs" style={{ background: 'var(--lp-accent)', fontFamily: 'var(--font-syne)', color: '#fff' }}>L</div>
            <span className="font-bold text-sm" style={{ fontFamily: 'var(--font-syne)', color: 'var(--lp-text)' }}>LeadFlow</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>
            © {new Date().getFullYear()} LeadFlow. Built for agencies that move fast.
          </p>
          <div className="flex gap-5">
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <a key={l} href="#" className="text-xs transition-opacity hover:opacity-80" style={{ color: 'var(--lp-muted)', fontFamily: 'var(--font-dm)' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
