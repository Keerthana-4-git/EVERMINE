import { useMemo, useState, type FormEvent } from 'react'
import { ArrowRight, CircleHelp, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../components/useToast'

const faqEntries = [
  { category: 'Getting started', question: 'Where are my memories saved?', answer: 'EVERMINE is a local-first prototype. Your photographs and memory records are stored in this browser on this device using IndexedDB. They are not uploaded to a cloud account and will not automatically appear on another device.' },
  { category: 'Getting started', question: 'Can I use EVERMINE on another device?', answer: 'Not yet. There is no synchronization service or backend in this prototype. Keep your browser data safe, and do not clear site data unless you intend to remove the local archive.' },
  { category: 'Uploading photographs', question: 'How do I add photographs?', answer: 'Choose Upload photographs from My Memories or My Sanctuary, select image files, and add any title, date, place, or caption details you would like to keep.' },
  { category: 'Uploading photographs', question: 'Are my photographs sent to an AI service?', answer: 'No. The Memory Curator uses a deterministic local suggestion engine that reads saved metadata. It does not upload photographs or metadata to an external AI service.' },
  { category: 'Managing albums', question: 'If I delete an album, are its photographs deleted?', answer: 'No. Removing an album removes the collection only. Original photographs remain in My Memories.' },
  { category: 'Managing albums', question: 'Do Shared Albums really invite other people?', answer: 'No. Shared Albums is a local demonstration. Invitations are not emailed and collaborators cannot access or synchronize the album without a future backend.' },
  { category: 'Editing and deleting photographs', question: 'What happens when I delete a photograph?', answer: 'It moves to Recently Deleted first. You can restore it, or permanently delete it. Permanent deletion removes its stored image and safely clears references in albums, stories, books, reels, capsules, and family records.' },
  { category: 'Editing and deleting photographs', question: 'What happens to album links if I restore a photograph?', answer: 'Album and story references remain while a photograph is in Recently Deleted. Restoring it makes those saved references visible again.' },
  { category: 'Memory Stories', question: 'Can I attach photographs to a story?', answer: 'Yes. Choose photographs already saved in My Memories from the story editor. Stories keep references to the original records instead of creating duplicate image files.' },
  { category: 'Time Capsules', question: 'Can a capsule open before its unlock date?', answer: 'No. The app checks eligibility when you open a capsule, not just when it renders the button. Capsules are stored locally, so this prototype cannot deliver them to someone in the future or synchronize their unlock state across devices.' },
  { category: 'Shared Albums', question: 'Are collaboration actions real-time?', answer: 'No. Invitation, acceptance, permission, comment, and reaction workflows are local simulations. No email is sent and no other user can see changes.' },
  { category: 'Privacy and local storage', question: 'Who can see my local archive?', answer: 'The current demo keeps records in this browser profile. Anyone with access to this browser profile may be able to use the signed-in demo session or inspect local site data. Use a private device and clear site data only after backing up anything you need.' },
  { category: 'Privacy and local storage', question: 'Does EVERMINE have cloud backup?', answer: 'No. There is no cloud backup or cross-device recovery in this prototype. Browser storage can be removed by browser settings, device cleanup, or profile changes.' },
  { category: 'Account settings', question: 'Is my account a real online account?', answer: 'No. Sign-up and sign-in use a local demo account on this device. Profile changes update that local demo identity only; no remote account or support system is contacted.' },
  { category: 'Account settings', question: 'How do I clear my saved data?', answer: 'Open Settings and use Clear application data. You will be asked to confirm because the action removes local photographs, stories, arrangements, and preferences and cannot be undone. Signing out alone does not delete your archive.' },
] as const

const categories = [
  'Getting started',
  'Uploading photographs',
  'Managing albums',
  'Editing and deleting photographs',
  'Memory Stories',
  'Time Capsules',
  'Shared Albums',
  'Privacy and local storage',
  'Account settings',
] as const

export function HelpFAQPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  const entries = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase()
    return faqEntries.filter((entry) =>
      (!category || entry.category === category) &&
      (!needle || `${entry.category} ${entry.question} ${entry.answer}`.toLocaleLowerCase().includes(needle)),
    )
  }, [category, query])

  function submitDemoRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!subject.trim() || !message.trim()) {
      showToast('Add a subject and a message to prepare your demo request.', 'error')
      return
    }
    setSubject('')
    setMessage('')
    showToast('This is a demo contact form. Your message was not sent or stored.')
  }

  return (
    <div className="mx-auto max-w-[82rem]">
      <header className="mb-8 grid gap-6 border-b border-[#302d29]/12 pb-7 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <p className="eyebrow mb-2">A little guidance for keeping things close</p>
          <h1 className="serif text-[2.9rem] leading-none sm:text-5xl">Help &amp; FAQ</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#82796e]">Find answers about your archive, local storage, and the boundaries of this early prototype.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="auth-secondary min-h-9" to="/memories">My Memories <ArrowRight size={14} /></Link>
          <Link className="auth-secondary min-h-9" to="/settings">Privacy settings <ArrowRight size={14} /></Link>
        </div>
      </header>

      <div className="mb-7 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8175]" />
          <input aria-label="Search help articles" value={query} onChange={(event) => setQuery(event.target.value)} className="auth-input min-h-10 py-2 pl-9 text-xs" placeholder="Search questions and answers…" />
        </label>
        <label className="flex items-center gap-2 border border-[#302d29]/12 px-3 text-xs text-[#5d554b]">
          Category
          <select aria-label="Filter help by category" value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-10 max-w-52 bg-transparent text-xs outline-none">
            <option value="">All topics</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
        <section aria-label="Frequently asked questions" className="divide-y divide-[#302d29]/10 border-y border-[#302d29]/10">
          {entries.length ? entries.map((entry) => (
            <details key={entry.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left [&::-webkit-details-marker]:hidden">
                <span>
                  <span className="eyebrow block text-[0.55rem]">{entry.category}</span>
                  <span className="mt-1 block text-sm font-semibold text-[#403b34]">{entry.question}</span>
                </span>
                <span className="mt-1 text-[#8b7861] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 max-w-3xl pr-8 text-xs leading-6 text-[#71685d]">{entry.answer}</p>
            </details>
          )) : (
            <div className="px-5 py-14 text-center">
              <CircleHelp size={25} className="mx-auto text-[#a68c70]" />
              <p className="serif mt-3 text-3xl">No answer found.</p>
              <p className="mt-2 text-sm text-[#82796e]">Try different words or clear the category filter.</p>
              <button type="button" className="auth-secondary mt-4" onClick={() => { setQuery(''); setCategory('') }}>Clear search</button>
            </div>
          )}
        </section>

        <aside className="h-fit bg-[#eee8df] p-5 sm:p-6">
          <p className="eyebrow mb-2">A note on support</p>
          <h2 className="serif text-3xl leading-tight">This contact form is a demo.</h2>
          <p className="mt-2 text-xs leading-5 text-[#71685d]">There is no support backend. Submitting will not send or save a message; the form only demonstrates the intended interface.</p>
          <form onSubmit={submitDemoRequest} className="mt-5 space-y-3">
            <label className="block text-[0.67rem] font-semibold text-[#574f45]">
              Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="auth-input mt-1.5 min-h-9 py-2 text-xs" maxLength={100} required />
            </label>
            <label className="block text-[0.67rem] font-semibold text-[#574f45]">
              How can we help?
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="auth-input mt-1.5 min-h-28 resize-y py-2 text-xs" maxLength={1000} required />
            </label>
            <button type="submit" className="auth-primary min-h-10 w-full">Preview demo request</button>
          </form>
        </aside>
      </div>
    </div>
  )
}
