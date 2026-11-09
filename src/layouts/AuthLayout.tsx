import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const coverImage =
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=85'

export function AuthLayout() {
  const { authMode } = useAuth()
  return (
    <main className="min-h-screen bg-[#f8f5ef]">
      <div className="grid min-h-screen lg:grid-cols-[1.04fr_0.96fr]">
        <section className="relative hidden min-h-screen overflow-hidden bg-[#403c35] lg:block">
          <img
            src={coverImage}
            alt="Quiet mountain lake at dusk"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1f201e]/75 via-[#292720]/20 to-[#292720]/15" />
          <div className="absolute inset-0 flex flex-col justify-between p-12 xl:p-16">
            <a
              className="relative z-10 inline-flex w-fit items-center gap-3 text-white"
              href="/login"
              aria-label="EVERMINE home"
            >
              <span className="serif text-[2rem] tracking-[0.12em]">EVERMINE</span>
              <span className="h-px w-9 bg-white/60" />
              <span className="text-[0.58rem] uppercase tracking-[0.21em] text-white/75">
                Memory, kept
              </span>
            </a>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              className="relative z-10 max-w-xl pb-5 text-white"
            >
              <p className="mb-5 text-[0.67rem] font-semibold uppercase tracking-[0.24em] text-[#eee1cc]">
                A home for the moments that made you
              </p>
              <h1 className="serif text-6xl leading-[0.96] tracking-[-0.025em] xl:text-7xl">
                Life moves.
                <br />
                <em className="font-normal">The meaning stays.</em>
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-7 text-white/78">
                Your photographs capture the moment. EVERMINE preserves the story.
              </p>
            </motion.div>
            <p className="relative z-10 text-[0.62rem] uppercase tracking-[0.16em] text-white/65">
              A personal memory sanctuary · {authMode === 'supabase' ? 'Supabase sign-in' : 'Local demo'}
            </p>
          </div>
        </section>
        <section className="flex min-h-screen flex-col px-6 pb-8 pt-6 sm:px-12 lg:px-14 xl:px-20">
          <a
            href="/login"
            className="mb-7 inline-flex w-fit items-center text-[#302d29] lg:hidden"
            aria-label="EVERMINE home"
          >
            <span className="serif text-2xl tracking-[0.12em]">EVERMINE</span>
          </a>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-[26rem]">
              <Outlet />
            </div>
          </div>
          <p className="pt-8 text-center text-[0.66rem] leading-5 text-[#8b8175]">
            {authMode === 'supabase'
              ? 'Secure sign-in is connected; memory records and photographs remain on this device until cloud migration is complete.'
              : 'Your memories stay on this device in this local demo. No cloud account or secure service is connected.'}
          </p>
        </section>
      </div>
    </main>
  )
}
