'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Zap } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MousePos { x: number; y: number }

// ─── Custom cursor ────────────────────────────────────────────────────────────

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

// ─── 3D tilt card ────────────────────────────────────────────────────────────

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
    cardRef.current.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)'
    cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
    setTimeout(() => {
      if (cardRef.current) cardRef.current.style.transition = 'transform 0.1s ease'
    }, 500)
  }, [])

  return (
    <div
      ref={wrapRef}
      className="lp-card-3d-wrapper"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ width: '100%', maxWidth: 420 }}
    >
      <div ref={cardRef} className="lp-card-3d" style={{ transition: 'transform 0.1s ease' }}>
        {/* Mock CRM card */}
        <div style={{
          background: 'rgba(17,17,24,0.9)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '1.75rem',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,77,28,0.06)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.85rem', color: 'rgba(245,243,238,0.8)' }}>Pipeline Overview</span>
            <span style={{ fontSize: '0.6rem', color: '#ff4d1c', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-dm)', background: 'rgba(255,77,28,0.1)', padding: '0.2rem 0.5rem', borderRadius: 100 }}>● Live</span>
          </div>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {[
              { val: '142', label: 'Leads' },
              { val: '$84k', label: 'Value' },
              { val: '38%', label: 'Close rate' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(245,243,238,0.03)', border: '1px solid rgba(245,243,238,0.05)', borderRadius: 10, padding: '0.75rem 0.6rem' }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.3rem', color: '#f5f3ee', letterSpacing: '-0.03em' }}>{m.val}</div>
                <div style={{ fontSize: '0.6rem', color: 'rgba(245,243,238,0.35)', marginTop: '0.15rem', fontFamily: 'var(--font-dm)' }}>{m.label}</div>
              </div>
            ))}
          </div>
          {/* Bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { name: 'Facebook', pct: 72 },
              { name: 'Google', pct: 58 },
              { name: 'Referral', pct: 43 },
              { name: 'Cold email', pct: 28 },
            ].map(b => (
              <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,243,238,0.35)', width: 62, flexShrink: 0, fontFamily: 'var(--font-dm)' }}>{b.name}</span>
                <div style={{ flex: 1, height: 3, background: 'rgba(245,243,238,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${b.pct}%`, height: '100%', background: 'linear-gradient(to right,#ff4d1c,rgba(255,77,28,0.5))', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: '0.6rem', color: 'rgba(245,243,238,0.3)', width: 26, textAlign: 'right', fontFamily: 'var(--font-dm)' }}>{b.pct}%</span>
              </div>
            ))}
          </div>
          {/* Stages */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.4rem' }}>
            {[
              { label: 'New', count: 34, color: 'rgba(245,243,238,0.3)' },
              { label: 'Qualified', count: 22, color: '#0057ff' },
              { label: 'Proposal', count: 15, color: '#c8a84b' },
              { label: 'Closed', count: 11, color: '#ff4d1c' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(245,243,238,0.03)', border: '1px solid rgba(245,243,238,0.05)', borderRadius: 8, padding: '0.5rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, marginBottom: '0.35rem' }} />
                <div style={{ fontSize: '0.55rem', color: 'rgba(245,243,238,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem', fontFamily: 'var(--font-dm)' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1rem', color: '#f5f3ee' }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Scroll reveal hook ───────────────────────────────────────────────────────

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return
    const els = ref.current.querySelectorAll<HTMLElement>('.lp-reveal')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible')
          obs.unobserve(e.target)
        }
      }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [ref])
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1.1rem 2.5rem',
      background: scrolled ? 'rgba(10,10,15,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: '#ff4d1c',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-syne)', fontWeight: 800, color: '#fff', fontSize: '0.85rem',
        }}>L</div>
        <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: '#f5f3ee', fontSize: '0.95rem' }}>LeadFlow</span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <a href="#features" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.85rem', color: 'rgba(245,243,238,0.5)', textDecoration: 'none' }}>Features</a>
        <a href="#pricing" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.85rem', color: 'rgba(245,243,238,0.5)', textDecoration: 'none' }}>Pricing</a>
        <Link href="/login" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.85rem', color: 'rgba(245,243,238,0.5)', textDecoration: 'none' }}>Sign in</Link>
        <Link href="/register" style={{
          fontFamily: 'var(--font-dm)', fontSize: '0.85rem', fontWeight: 600,
          color: '#fff', background: '#ff4d1c',
          borderRadius: 100, padding: '0.45rem 1.1rem', textDecoration: 'none',
        }}>Get started</Link>
      </div>
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!orbRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 30
      const y = (e.clientY / window.innerHeight - 0.5) * 30
      orbRef.current.style.transform = `translate(${x}px,${y}px)`
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '6rem 2rem 4rem',
    }}>
      {/* Ambient orbs */}
      <div ref={orbRef} style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        transition: 'transform 0.1s ease-out',
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,77,28,0.10) 0%, transparent 70%)', filter: 'blur(10px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-8%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,87,255,0.08) 0%, transparent 70%)', filter: 'blur(10px)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,168,75,0.06) 0%, transparent 70%)', filter: 'blur(10px)' }} />
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {/* Left — copy */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#c8a84b', marginBottom: '1.75rem',
            padding: '0.3rem 0.9rem',
            border: '1px solid rgba(200,168,75,0.25)', borderRadius: 100,
            fontFamily: 'var(--font-dm)',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#c8a84b', display: 'inline-block', animation: 'lp-pulse 2s ease-in-out infinite' }} />
            Now in public beta
          </div>

          <h1 style={{
            fontFamily: 'var(--font-syne)',
            fontWeight: 800,
            fontSize: 'clamp(3rem, 5.5vw, 5.5rem)',
            lineHeight: 0.9,
            letterSpacing: '-0.04em',
            color: '#f5f3ee',
            marginBottom: '1.5rem',
          }}>
            Close deals<br />
            <em style={{ fontStyle: 'italic', fontFamily: 'var(--font-dm)', fontWeight: 300, color: '#ff4d1c' }}>smarter,</em><br />
            faster.
          </h1>

          <p style={{
            fontFamily: 'var(--font-dm)', fontWeight: 300,
            fontSize: '1.05rem', lineHeight: 1.75,
            color: 'rgba(245,243,238,0.5)',
            maxWidth: 420, marginBottom: '2.5rem',
          }}>
            The CRM built for digital marketing agencies — AI follow-ups, visual pipelines, and automation that actually runs.
          </p>

          <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
            <Link href="/register" style={{
              padding: '0.85rem 2rem', background: '#ff4d1c', color: '#fff',
              borderRadius: 100, fontSize: '0.9rem', fontWeight: 600,
              textDecoration: 'none', fontFamily: 'var(--font-dm)',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            }}>
              Start free <ArrowRight size={15} />
            </Link>
            <a href="#features" style={{
              padding: '0.85rem 2rem',
              border: '1px solid rgba(245,243,238,0.15)',
              borderRadius: 100, color: 'rgba(245,243,238,0.55)',
              fontSize: '0.9rem', textDecoration: 'none',
              fontFamily: 'var(--font-dm)', display: 'inline-block',
            }}>
              See how it works
            </a>
          </div>

          {/* Social proof strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex' }}>
              {['M', 'D', 'T', 'A'].map((l, i) => (
                <div key={l} style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i % 2 === 0 ? '#ff4d1c' : '#0057ff',
                  border: '2px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.65rem', color: '#fff',
                  marginLeft: i > 0 ? -8 : 0,
                }}>
                  {l}
                </div>
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-dm)', fontSize: '0.78rem', color: 'rgba(245,243,238,0.4)', margin: 0 }}>
              Trusted by <strong style={{ color: 'rgba(245,243,238,0.7)' }}>200+</strong> agency teams
            </p>
          </div>
        </div>

        {/* Right — tilt card */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <TiltCard />
        </div>
      </div>
    </section>
  )
}

// ─── Marquee ──────────────────────────────────────────────────────────────────

function Marquee() {
  const items = ['Lead intake', 'AI follow-ups', 'Kanban pipeline', 'Automation rules', 'Team workspaces', 'Webhook forms', 'Activity logs', 'Stage tracking']

  return (
    <div style={{ background: 'rgba(255,77,28,0.06)', borderTop: '1px solid rgba(255,77,28,0.12)', borderBottom: '1px solid rgba(255,77,28,0.12)', padding: '0.9rem 0', overflow: 'hidden' }}>
      <div className="lp-marquee-track" style={{ display: 'flex', gap: '3rem', userSelect: 'none' }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-dm)', fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(245,243,238,0.45)' }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff4d1c', display: 'inline-block', flexShrink: 0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES_LIST = [
  {
    icon: '✦',
    title: 'AI Follow-ups',
    desc: 'Groq AI summarizes leads and suggests next actions based on notes and deal stage.',
    details: ['One-click lead summary', 'Next-step task suggestions', 'Token usage tracked per plan'],
  },
  {
    icon: '◈',
    title: 'Visual Pipeline',
    desc: 'Drag-and-drop Kanban with custom stages. Every lead always in the right column.',
    details: ['Unlimited boards', 'Custom stage order', 'Inline lead detail view'],
  },
  {
    icon: '⚡',
    title: 'Automation Rules',
    desc: 'Set a trigger, define an action — the engine runs it every time without you.',
    details: ['3 trigger types', '4 action types', '5-min debounce anti-loop'],
  },
  {
    icon: '◉',
    title: 'Lead Intake Forms',
    desc: 'Hosted forms, webhook API, and Google Forms script — leads flow in automatically.',
    details: ['Webhook + hosted form', 'Google Forms script', 'Bearer token auth'],
  },
  {
    icon: '◫',
    title: 'Team Workspaces',
    desc: 'Invite unlimited teammates. Owner, admin, and member roles with full RLS isolation.',
    details: ['Unlimited team members', '3 roles enforced at DB level', 'Per-workspace data isolation'],
  },
  {
    icon: '◬',
    title: 'Activity Logs',
    desc: 'Every stage change, note, and task recorded. Full lead history always visible.',
    details: ['Automatic event capture', 'Notes + tasks on leads', 'Notification bell for assignments'],
  },
]

function Features() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  return (
    <section id="features" ref={ref} style={{ background: 'var(--ink)', padding: '7rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#ff4d1c', textAlign: 'center', marginBottom: '0.75rem' }}>
          Everything you need
        </p>
        <h2 className="lp-reveal" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.03em', color: '#f5f3ee', textAlign: 'center', marginBottom: '1rem' }}>
          Built for agencies.<br />Not generic SaaS.
        </h2>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.95rem', color: 'rgba(245,243,238,0.45)', textAlign: 'center', maxWidth: 500, margin: '0 auto 4rem' }}>
          Every feature is designed around how agencies actually work — multiple clients, fast follow-up, zero missed leads.
        </p>

        <div className="lp-reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden' }}>
          {FEATURES_LIST.map((f, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.02)',
              padding: '2rem',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,28,0.05)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#ff4d1c' }}>{f.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '1.15rem', color: '#f5f3ee', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontFamily: 'var(--font-dm)', fontSize: '0.85rem', color: 'rgba(245,243,238,0.45)', lineHeight: 1.65, marginBottom: '1.25rem' }}>{f.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {f.details.map((d, di) => (
                  <div key={di} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={11} style={{ color: '#ff4d1c', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-dm)', fontSize: '0.75rem', color: 'rgba(245,243,238,0.4)' }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  const steps = [
    { num: '01', title: 'Create a workspace', desc: 'One workspace per client or team. Set up in under a minute.' },
    { num: '02', title: 'Build your pipeline', desc: 'Add a board, define your stages, connect an intake form.' },
    { num: '03', title: 'Let leads flow in', desc: 'Forms, webhooks, or Google Forms — leads arrive automatically.' },
    { num: '04', title: 'Automate follow-up', desc: 'Set rules. AI drafts messages. Your pipeline moves itself.' },
  ]

  return (
    <section ref={ref} style={{ background: '#0d0d12', padding: '7rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#ff4d1c', textAlign: 'center', marginBottom: '0.75rem' }}>
          How it works
        </p>
        <h2 className="lp-reveal" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.03em', color: '#f5f3ee', textAlign: 'center', marginBottom: '4rem' }}>
          Live in 4 steps.
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0' }}>
          {steps.map((s, i) => (
            <div key={i} className="lp-reveal" style={{
              transitionDelay: `${i * 80}ms`,
              padding: '2rem 1.75rem',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              position: 'relative',
            }}>
              <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '3rem', color: 'rgba(255,77,28,0.12)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1rem' }}>{s.num}</div>
              <h3 style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '1.05rem', color: '#f5f3ee', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontFamily: 'var(--font-dm)', fontSize: '0.82rem', color: 'rgba(245,243,238,0.4)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

function Testimonials() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  const testimonials = [
    { quote: 'We replaced GoHighLevel and HubSpot with LeadFlow. The AI follow-up alone recovered three deals we had written off.', name: 'Mia Santos', role: 'Founder · SynthGrowth Agency', avatar: 'M' },
    { quote: 'The kanban pipeline is exactly what our sales team needed. No more spreadsheets, no more missed follow-ups.', name: 'Darius Park', role: 'Head of Sales · Apex Digital', avatar: 'D' },
    { quote: 'Setup took 20 minutes. We had our first lead intake form live before lunch and closed a deal the same week.', name: 'Tomás Rivera', role: 'CEO · RiverGrowth', avatar: 'T' },
  ]

  return (
    <section ref={ref} style={{ background: 'var(--ink)', padding: '7rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#ff4d1c', textAlign: 'center', marginBottom: '0.75rem' }}>What agencies say</p>
        <h2 className="lp-reveal" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.03em', color: '#f5f3ee', textAlign: 'center', marginBottom: '3.5rem' }}>
          Real teams, real results.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
          {testimonials.map((t, i) => (
            <div key={i} className="lp-reveal" style={{
              transitionDelay: `${i * 80}ms`,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: '2rem',
            }}>
              <p style={{ fontFamily: 'var(--font-dm)', fontSize: '0.95rem', fontWeight: 300, lineHeight: 1.75, color: '#f5f3ee', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ff4d1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.8rem', color: '#f5f3ee' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--font-dm)', fontSize: '0.7rem', color: 'rgba(245,243,238,0.4)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function Pricing() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  const plans = [
    {
      name: 'Free', price: '$0', period: 'forever',
      desc: 'For solo operators getting started.',
      features: ['3 workspaces', '50 leads / mo', '10k AI tokens / mo', 'Unlimited team members', 'Kanban pipelines', 'Lead intake forms'],
      cta: 'Start free', href: '/register', featured: false,
    },
    {
      name: 'Starter', price: '$29', period: '/ month',
      desc: 'For growing agencies with active lead flow.',
      features: ['10 workspaces', '500 leads / mo', '100k AI tokens / mo', 'Unlimited team members', 'Automation rules', 'Priority support'],
      cta: 'Start Starter', href: '/register', featured: false,
    },
    {
      name: 'Pro', price: '$79', period: '/ month',
      desc: 'For agencies scaling hard.',
      features: ['Unlimited workspaces', 'Unlimited leads', '500k AI tokens / mo', 'Unlimited team members', 'Advanced automations', 'Dedicated onboarding'],
      cta: 'Start Pro', href: '/register', featured: true,
    },
    {
      name: 'Agency', price: '$199', period: '/ month',
      desc: 'For multi-client enterprises.',
      features: ['Unlimited everything', '9M AI tokens / mo', 'White-label ready', 'Unlimited team members', 'SLA + priority support', 'Custom integrations'],
      cta: 'Contact us', href: '/register', featured: false,
    },
  ]

  return (
    <section id="pricing" ref={ref} style={{ background: '#0a0a0f', padding: '7rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#ff4d1c', textAlign: 'center', marginBottom: '0.75rem' }}>Pricing</p>
        <h2 className="lp-reveal" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.03em', color: '#f5f3ee', textAlign: 'center', marginBottom: '0.75rem' }}>
          Priced on workspaces,<br />not seats.
        </h2>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.95rem', color: 'rgba(245,243,238,0.45)', textAlign: 'center', marginBottom: '3.5rem' }}>
          Team members are unlimited on every plan.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: '1rem' }}>
          {plans.map((plan, i) => (
            <div key={plan.name} className="lp-reveal" style={{
              transitionDelay: `${i * 70}ms`,
              background: plan.featured ? 'rgba(255,77,28,0.06)' : 'rgba(255,255,255,0.04)',
              border: plan.featured ? '1px solid rgba(255,77,28,0.3)' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20, padding: '2rem 1.75rem',
              position: 'relative', display: 'flex', flexDirection: 'column',
            }}>
              {plan.featured && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: '#ff4d1c', borderRadius: 100, padding: '0.25rem 0.9rem',
                  fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: '#fff', fontFamily: 'var(--font-dm)', whiteSpace: 'nowrap',
                }}>Most popular</div>
              )}
              <p style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, fontSize: '0.95rem', color: '#f5f3ee', marginBottom: '0.5rem' }}>{plan.name}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: '2.5rem', color: '#f5f3ee', letterSpacing: '-0.04em' }}>{plan.price}</span>
                <span style={{ fontFamily: 'var(--font-dm)', fontSize: '0.8rem', color: 'rgba(245,243,238,0.4)' }}>{plan.period}</span>
              </div>
              <p style={{ fontFamily: 'var(--font-dm)', fontSize: '0.8rem', color: 'rgba(245,243,238,0.45)', marginBottom: '1.5rem', lineHeight: 1.5 }}>{plan.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-dm)', fontSize: '0.82rem', color: 'rgba(245,243,238,0.7)' }}>
                    <Check size={13} style={{ color: '#ff4d1c', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{
                display: 'block', textAlign: 'center', padding: '0.75rem',
                background: plan.featured ? '#ff4d1c' : 'rgba(255,255,255,0.07)',
                color: plan.featured ? '#fff' : '#f5f3ee',
                borderRadius: 100, fontSize: '0.85rem', fontWeight: 600,
                textDecoration: 'none', fontFamily: 'var(--font-dm)',
                border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.12)',
              }}>{plan.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  const ref = useRef<HTMLElement>(null)
  useReveal(ref)

  return (
    <section ref={ref} style={{ background: 'var(--ink)', padding: '7rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#ff4d1c', marginBottom: '1rem' }}>Get started today</p>
        <h2 className="lp-reveal" style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 'clamp(2.5rem,6vw,4.5rem)', letterSpacing: '-0.04em', color: '#f5f3ee', lineHeight: 0.92, marginBottom: '1.5rem' }}>
          Your pipeline.<br />
          <em style={{ fontStyle: 'italic', fontFamily: 'var(--font-dm)', fontWeight: 300, color: '#ff4d1c' }}>Fully alive.</em>
        </h2>
        <p className="lp-reveal" style={{ fontFamily: 'var(--font-dm)', fontSize: '1rem', color: 'rgba(245,243,238,0.45)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Free to start. No credit card. Live in under 5 minutes.
        </p>
        <div className="lp-reveal" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{
            padding: '0.9rem 2.25rem', background: '#ff4d1c', color: '#fff',
            borderRadius: 100, fontSize: '0.95rem', fontWeight: 600,
            textDecoration: 'none', fontFamily: 'var(--font-dm)',
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          }}>
            Create free account <ArrowRight size={15} />
          </Link>
          <Link href="/login" style={{
            padding: '0.9rem 2.25rem',
            border: '1px solid rgba(245,243,238,0.15)',
            borderRadius: 100, fontSize: '0.95rem',
            color: 'rgba(245,243,238,0.5)', textDecoration: 'none',
            fontFamily: 'var(--font-dm)',
          }}>Sign in</Link>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2.5rem 2rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#ff4d1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-syne)', fontWeight: 800, color: '#fff', fontSize: '0.75rem' }}>L</div>
          <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 700, color: '#f5f3ee', fontSize: '0.85rem' }}>LeadFlow</span>
        </div>
        <p style={{ fontFamily: 'var(--font-dm)', fontSize: '0.75rem', color: 'rgba(245,243,238,0.3)', margin: 0 }}>
          © {new Date().getFullYear()} LeadFlow. Built for agencies that move fast.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[['Features', '#features'], ['Pricing', '#pricing'], ['Sign in', '/login'], ['Register', '/register']].map(([label, href]) => (
            <Link key={label} href={href} style={{ fontFamily: 'var(--font-dm)', fontSize: '0.8rem', color: 'rgba(245,243,238,0.35)', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add('lp-active')
    return () => document.body.classList.remove('lp-active')
  }, [])

  return (
    <>
      <Cursor />
      <Nav />
      <Hero />
      <Marquee />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
      <style>{`
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .lp-cursor-dot, .lp-cursor-ring { display: none !important; }
          body.lp-active { cursor: auto !important; }
        }
      `}</style>
    </>
  )
}
