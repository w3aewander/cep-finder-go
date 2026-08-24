import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronRight, CircleHelp, Copy, LoaderCircle, MapPin, Search, Sparkles, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

type Address = { cep: string; logradouro: string; complemento?: string; bairro: string; cidade: string; estado: string; ddd?: string }

const maskCEP = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export default function App() {
  const [cep, setCep] = useState('')
  const [address, setAddress] = useState<Address | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function search(event: FormEvent) {
    event.preventDefault()
    const rawCEP = cep.replace(/\D/g, '')
    setMessage(null)
    setAddress(null)
    if (rawCEP.length !== 8) { setMessage('Digite os 8 números do CEP para continuar.'); return }

    setLoading(true)
    try {
      const response = await fetch(`/api/cep/${rawCEP}`)
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível consultar este CEP.')
      setAddress(body)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.')
    } finally { setLoading(false) }
  }

  async function copyAddress() {
    if (!address) return
    const text = [address.logradouro, address.complemento, address.bairro, `${address.cidade} — ${address.estado}`, `CEP ${address.cep}`].filter(Boolean).join(', ')
    await navigator.clipboard.writeText(text)
    setMessage('Endereço copiado para sua área de transferência!')
  }

  return <main>
    <nav className="nav"><a className="brand" href="/" aria-label="CEP-FINDER — página inicial"><img src="/cep-finder-logo.png" alt="CEP-FINDER" /></a><button className="help" onClick={() => setHelpOpen(true)}><CircleHelp size={18} /> Como funciona?</button></nav>
    <section className="hero">
      <motion.div className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><Sparkles size={14} /> Consulta rápida e confiável</motion.div>
      <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .08 }}>Seu endereço,<br /><em>em poucos segundos.</em></motion.h1>
      <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .16 }}>Informe um CEP para encontrar endereço, bairro, cidade e estado.</motion.p>
      <motion.form onSubmit={search} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .24 }}>
        <label htmlFor="cep">Qual CEP você procura?</label>
        <div className={`input-row ${message && !address ? 'has-error' : ''}`}><MapPin size={21} /><input ref={inputRef} id="cep" inputMode="numeric" autoComplete="postal-code" aria-describedby="cep-hint" placeholder="99.999-999" value={cep} onChange={e => setCep(maskCEP(e.target.value))} /><button disabled={loading} aria-label="Buscar CEP">{loading ? <LoaderCircle className="spin" /> : <><span>Buscar</span><Search size={18} /></>}</button></div>
        <small id="cep-hint">Use o formato 99.999-999</small>
      </motion.form>
      <AnimatePresence>
        {message && <motion.div role="status" className={`notice ${address ? 'success' : 'error'}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><CheckCircle2 size={18} />{message}</motion.div>}
      </AnimatePresence>
      <AnimatePresence>
        {address && <motion.article className="result" initial={{ opacity: 0, y: 22, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}>
          <div className="result-head"><div><span className="found"><CheckCircle2 size={17} /> Endereço encontrado</span><h2>{address.logradouro || 'Endereço não especificado'}</h2></div><button className="copy" onClick={copyAddress}><Copy size={16} /> Copiar</button></div>
          <div className="details"><Detail label="Bairro" value={address.bairro || 'Não informado'} /><Detail label="Cidade" value={address.cidade} /><Detail label="Estado" value={address.estado} /><Detail label="CEP" value={address.cep} />{address.complemento && <Detail label="Complemento" value={address.complemento} />}</div>
        </motion.article>}
      </AnimatePresence>
    </section>
    <p className="source">Dados consultados em tempo real pela API ViaCEP.</p>
    <AnimatePresence>{helpOpen && <motion.div className="backdrop" onMouseDown={() => setHelpOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={e => e.stopPropagation()} initial={{ opacity: 0, scale: .94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .94 }}><button className="close" onClick={() => setHelpOpen(false)} aria-label="Fechar"><X size={20} /></button><div className="dialog-icon"><MapPin /></div><h2 id="dialog-title">Encontrar um endereço é simples</h2><p>Digite o CEP do local desejado. Nós removemos a pontuação, consultamos a base de endereços e exibimos as informações para você.</p><button className="dialog-action" onClick={() => { setHelpOpen(false); inputRef.current?.focus() }}>Entendi <ChevronRight size={18} /></button></motion.section></motion.div>}</AnimatePresence>
  </main>
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div> }
