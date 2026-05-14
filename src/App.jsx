import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'

const VAPID_PUBLIC_KEY = 'BAurdkv0qAKxkuzAq448zYqL5BuOjxWjBkXANNBAh7nDGho7UUsFgfu9TUyc4zg_vsZ4ggW3PVvK6Z_ZiTsNmXs'

const Q = {
  1: { 
    label: 'Urgent · Important',       
    color: '#ef9a9a', // Rouge corail très doux
    light: 'rgba(239,154,154,0.15)', 
    emoji: '🔴', 
    desc: 'À Faire maintenant' 
  },
  2: { 
    label: 'Important · Pas urgent',   
    color: '#90caf9', // Bleu ciel poudré
    light: 'rgba(144,202,249,0.15)', 
    emoji: '🔵', 
    desc: 'À Planifier'        
  },
  3: { 
    label: 'Urgent · Pas important',   
    color: '#ffcc80', // Orange crème / Pêche
    light: 'rgba(255,204,128,0.15)', 
    emoji: '🟡', 
    desc: 'À Déléguer'        
  },
  4: { 
    label: 'Ni urgent · Ni important', 
    color: '#a5d6a7', // Vert menthe à l'eau
    light: 'rgba(165,214,167,0.15)', 
    emoji: '🟢', 
    desc: 'À méditer'        
  },
}

const CAT_PALETTE = ['#16a34a','#2563eb','#9333ea','#db2777','#ea580c','#0891b2','#65a30d','#854d0e','#475569','#b45309']
const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS_FR = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)))
}

/* ──────────────────── DATE TIME PICKER (Version avec Scroll Auto) ──────────────────── */
function DateTimePicker({ value, onChange }) {
  const [openPart, setOpenPart] = useState(null)
  const pickerRef = useRef(null)
  const today = new Date()
  
  const parsed = value && !isNaN(new Date(value).getTime()) ? new Date(value) : null
  
  const [year, setYear]   = useState(parsed ? parsed.getFullYear() : today.getFullYear())
  const [month, setMonth] = useState(parsed ? parsed.getMonth() : today.getMonth())
  const [day, setDay]     = useState(parsed ? parsed.getDate() : today.getDate())
  const [hour, setHour]   = useState(parsed ? parsed.getHours() : 9)
  const [minute, setMinute] = useState(parsed ? Math.round(parsed.getMinutes()/5)*5 : 0)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpenPart(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // CETTE FONCTION DÉCLENCHE LE SCROLL AUTO
  const handleOpen = (e, part) => {
    const isOpening = openPart !== part;
    setOpenPart(isOpening ? part : null);
    
    if (isOpening) {
      // On laisse 100ms au menu pour apparaître, puis on centre
      setTimeout(() => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }

  const updateGlobal = (newDay, newHour, newMin) => {
    const dt = new Date(year, month, newDay, newHour, newMin)
    onChange(dt.toISOString())
  }

  const cells = []
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  for(let i=0; i<firstDay; i++) cells.push(null)
  for(let d=1; d<=new Date(year, month + 1, 0).getDate(); d++) cells.push(d)

  const displayDate = parsed ? `${String(day).padStart(2,'0')}/${String(month+1).padStart(2,'0')}/${year}` : 'Choisir date...'
  const displayTime = parsed ? `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}` : '--:--'

  const popoverStyle = {
  position: 'absolute', 
  bottom: '100%', // <-- On le fait s'ouvrir VERS LE HAUT au lieu de vers le bas
  left: 0, 
  zIndex: 1000, 
  background: '#fff', 
  border: '1px solid #e5e0d5', 
  borderRadius: 12, 
  boxShadow: '0 -10px 25px rgba(0,0,0,0.1)', // Ombre inversée
  marginBottom: 5, // Marge en bas au lieu de en haut
  padding: 12, 
  animation: 'fadeIn 0.2s ease'
}
  return (
    <div ref={pickerRef} style={{ display: 'flex', gap: 10, position: 'relative' }}>
      
      {/* BLOC DATE */}
      <div style={{ flex: 1, position: 'relative' }}>
        <label style={s.label}>Date</label>
        <div onClick={(e) => handleOpen(e, 'date')} 
             style={{ ...s.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{color: parsed ? '#1a1208' : '#9a8f7a'}}>{displayDate}</span>
          <span>📅</span>
        </div>
        
        {openPart === 'date' && (
          <div style={{ ...popoverStyle, width: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
              <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1)} else setMonth(m=>m-1) }} style={s.iconBtn}>‹</button>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{MONTHS_FR[month]} {year}</span>
              <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1)} else setMonth(m=>m+1) }} style={s.iconBtn}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {DAYS_FR.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#9a8f7a' }}>{d}</div>)}
             {cells.map((d, i) => {
  const isSelected = day === d && parsed
  const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
  return (
    <div key={i} onClick={() => { if(d){ setDay(d); updateGlobal(d, hour, minute); setOpenPart(null); } }} 
      style={{
        textAlign: 'center', fontSize: 12, padding: '6px 0', borderRadius: 6, cursor: d ? 'pointer' : 'default',
        background: isSelected ? '#c9a84c' : 'transparent',
        color: isSelected ? '#fff' : d ? '#1a1208' : 'transparent',
        fontWeight: isToday ? 800 : 400,
        position: 'relative'
      }}>
      {d || ''}
      {d && isToday && !isSelected && (
        <span style={{
          position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
          width: 4, height: 4, borderRadius: '50%', background: '#c9a84c', display: 'block'
        }} />
      )}
    </div>
  )
})}
            </div>
          </div>
        )}
      </div>

      {/* BLOC HEURE */}
      <div style={{ width: 120, position: 'relative' }}>
        <label style={s.label}>Heure</label>
        <div onClick={(e) => handleOpen(e, 'time')} 
             style={{ ...s.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{color: parsed ? '#1a1208' : '#9a8f7a'}}>{displayTime}</span>
          <span>🕒</span>
        </div>
        {openPart === 'time' && (
          <div style={{ ...popoverStyle, width: 110, display: 'flex', gap: 5 }}>
            <div style={{ height: 150, overflowY: 'auto', flex: 1, borderRight: '1px solid #f0ece3' }}>
              {Array.from({length:24},(_,i)=>i).map(h => (
                <div key={h} onClick={() => { setHour(h); updateGlobal(day, h, minute); }} 
                  style={{ padding: '6px 0', textAlign: 'center', fontSize: 13, cursor: 'pointer', 
                  background: hour === h ? '#c9a84c' : 'transparent', color: hour === h ? '#fff' : '#1a1208', fontWeight: hour === h ? 700 : 400 }}>
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
            <div style={{ height: 150, overflowY: 'auto', flex: 1 }}>
              {[0,5,10,15,20,25,30,35,40,45,50,55].map(m => (
                <div key={m} onClick={() => { setMinute(m); updateGlobal(day, hour, m); }} 
                  style={{ padding: '6px 0', textAlign: 'center', fontSize: 13, cursor: 'pointer',
                  background: minute === m ? '#c9a84c' : 'transparent', color: minute === m ? '#fff' : '#1a1208', fontWeight: minute === m ? 700 : 400 }}>
                  {String(m).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ──────────────────── AUTH ──────────────────── */
function AuthScreen({ onAuth }) { // On a remis le nom AuthScreen et onAuth
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleAuth = async (e) => {
  e.preventDefault()
  setLoading(true)
  
  if (isLogin) {
    // CONNEXION SIMPLIFIÉE
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
      setLoading(false) // On arrête le chargement seulement s'il y a une erreur
    }
    // Si ça marche, on ne fait RIEN. L'app va basculer toute seule grâce à l'écouteur Supabase.
  } else {
    // INSCRIPTION (on garde ta sécurité de mot de passe)
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !")
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Vérifie tes e-mails pour confirmer ton inscription !')
    setLoading(false)
  }
}

  return (
    <div style={{...s.overlay, background:'#f8f6f1'}}>
      <form onSubmit={handleAuth} style={{...s.modal, maxWidth:360, padding:30}}>
        <h2 style={{...s.sectionTitle, textAlign:'center', marginBottom:20}}>
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h2>
        
        <div style={{display:'flex', flexDirection:'column', gap:15}}>
          <div>
            <label style={s.label}>E-mail</label>
            <input 
              type="email" 
              placeholder="ton@email.com" 
              style={s.input} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          {/* MOT DE PASSE AVEC ŒIL */}
          <div style={{position:'relative'}}>
            <label style={s.label}>Mot de passe</label>
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••" 
              style={{...s.input, paddingRight: 40}} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              style={{position:'absolute', right:10, top:32, background:'none', border:'none', cursor:'pointer', fontSize:18}}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          </div>

          {/* CONFIRMATION (Uniquement à l'inscription) */}
          {!isLogin && (
            <div>
              <label style={s.label}>Confirmer le mot de passe</label>
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                style={{
                  ...s.input, 
                  borderColor: confirmPassword && password !== confirmPassword ? '#dc2626' : '#e5e0d5'
                }} 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)} 
                required 
              />
              {confirmPassword && password !== confirmPassword && (
                <p style={{ color: '#dc2626', fontSize: '11px', marginTop: '5px' }}>
                  Les mots de passe ne correspondent pas
                </p>
              )}
            </div>
          )}

          <button style={{...s.btn, marginTop:10}} disabled={loading}>
            {loading ? 'Chargement...' : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </div>

        <button 
          type="button" 
          onClick={() => { setIsLogin(!isLogin); setConfirmPassword(''); }} 
          style={{...s.btnGhost, marginTop:15, width:'100%', border:'none'}}
        >
          {isLogin ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </form>
    </div>
  )
}

/* ──────────────────── CAT DROPDOWN ──────────────────── */
function CatDropdown({ categories, selected, onChange, onNewCategory }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef()

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = id => onChange(selected.includes(id) ? selected.filter(x => x!==id) : [...selected, id])

  const addNew = () => {
    if (!query.trim()) return
    const newCat = {
      id: 'c' + Date.now(),
      name: query.trim(),
      color: CAT_PALETTE[Math.floor(Math.random() * CAT_PALETTE.length)]
    }
    onNewCategory([...categories, newCat])
    toggle(newCat.id)
    setQuery('')
  }

  return (
    <div ref={ref} style={{position:'relative'}}>
      {/* Barre de sélection */}
      <div 
        onClick={() => setOpen(o => !o)} 
        style={{...s.input, cursor:'pointer', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', minHeight:42, paddingRight: 35}}
      >
        {selected.length === 0 ? (
          <span style={{color:'#4b4b4b', fontSize:13}}>Choisir ou créer un libellé…</span>
        ) : (
          selected.map(id => {
            const c = categories.find(x => x.id === id)
            return c ? <span key={id} style={{background:c.color+'22', color:c.color, border:`1px solid ${c.color}55`, borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:700}}>{c.name}</span> : null
          })
        )}
        {/* LA FLÈCHE À DROITE */}
        <span style={{position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#4b4b4b', fontSize:10}}>
          {open ? '▲' : '▼'}
        </span>
      </div>

      {/* Menu déroulant */}
      {open && (
        <div style={{position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#fff', border:'1px solid #e5e0d5', borderRadius:10, boxShadow:'0 12px 30px rgba(0,0,0,0.15)', zIndex:200}}>
          <div style={{maxHeight: 220, overflowY: 'auto', padding: '4px 0'}}>
            {categories.map(c => {
              const isSelected = selected.includes(c.id);
              return (
                <div 
                  key={c.id} 
                  onClick={() => toggle(c.id)} 
                  style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', background: isSelected ? c.color+'15' : 'transparent'}}
                >
                  <span style={{width:10, height:10, borderRadius:'50%', background:c.color}} />
                  {/* Texte assombri ici (#1a1208 au lieu de gris) */}
                  <span style={{fontSize:13, color: '#1a1208', fontWeight: isSelected ? 600 : 400}}>{c.name}</span>
                  {isSelected && <span style={{color:c.color, marginLeft:'auto', fontWeight:700}}>✓</span>}
                </div>
              );
            })}
          </div>
          
          {/* Champ d'ajout rapide */}
          <div style={{padding:'10px', borderTop:'1px solid #f0ece3', display:'flex', gap:8, background: '#fcfaf7', borderRadius: '0 0 10px 10px'}}>
            <input 
              style={{...s.input, padding:'6px 10px', height:34, fontSize:13, background: '#fff'}} 
              placeholder="Nouveau tag..." 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNew()}
            />
            <button 
              onClick={addNew} 
              style={{...s.btn, padding:'0 12px', height:34, fontSize:14, display:'flex', alignItems:'center', justifyContent:'center'}}
            >
              ＋
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────── NOTE CARD ──────────────────── */
function NoteCard({ note, categories, onEdit, onDelete }) {
  const isTask = note.type !== 'note';
  const q = Q[note.importance] || Q[4];
  const noteCats = (note.cats || []).map(id => categories.find(c => c.id === id)).filter(Boolean);
  
  // Formatage de la date de création
  const dateStr = note.created_at 
    ? new Date(note.created_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Date inconnue';

  // Formatage de la date de rappel (si elle existe)
  const reminderStr = note.reminder_at 
    ? new Date(note.reminder_at).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;
  
  const noteColors = ['#fff9c4', '#e1f5fe', '#f3e5f5', '#e8f5e9', '#fff3e0'];
  const pastelBg = isTask ? q.light : '#ffffff';

  return (
    <div style={{...s.card, boxShadow: isTask ? 'none' : '2px 4px 10px rgba(0,0,0,0.05)',
                border: isTask ? '1px solid #e5e0d5' : '1px solid #e5e0d5'
                }}>
      {isTask && (
        <div style={{...s.cardBanner, background:q.color}}>
          <span style={s.bannerEmoji}>{q.emoji}</span>
          <span style={s.bannerLabel}>
           {q.label}
            {note.status === 'doing' && ' | 🚀 EN COURS'}
            {note.status === 'waiting' && ' | ⏸️ EN ATTENTE'}
            </span>
        </div>
      )}
      <div style={{...s.cardBody, background: pastelBg, transition: '0.3s'}}>
        <h3 style={s.cardTitle}>{note.title}</h3>
        
        {/* DATE DE CRÉATION (Plus lisible) */}
        <p style={{fontSize: 10, color: '#9a8f7a', marginBottom: 8}}>
          📅 Créé le {dateStr}
        </p>
        
        {note.content && <p style={s.cardContent}>{note.content}</p>}
        
        {noteCats.length > 0 && (
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
            {noteCats.map(c => (
              <span key={c.id} style={{background:c.color+'1a',color:c.color,border:`1px solid ${c.color}44`,borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:600}}>{c.name}</span>
            ))}
          </div>
        )}

{/* On affiche les collaborateurs pour TOUT LE MONDE (Notes et Tâches) */}
{note.assignees && note.assignees.length > 0 && (
  <div style={{display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8}}>
    {note.assignees.map(name => (
      <span key={name} style={{fontSize: 10, background: 'rgba(26, 18, 8, 0.1)', padding: '2px 8px', borderRadius: 10, color: '#1a1208', display: 'flex', alignItems: 'center', gap: 3}}>
        👤 {name}
      </span>
    ))}
  </div>
)}

        <div style={s.cardFooter}>
          {/* AFFICHAGE DU RAPPEL (S'il existe) */}
          {isTask && note.reminder_at && (
            <span style={{...s.reminderBadge, color: q.color, fontSize: 10}}>
              ⏰ Rappel : {reminderStr}
            </span>
          )}
          
          <div style={{...s.cardActions, marginLeft: 'auto'}}>
            <button style={s.iconBtn} onClick={() => onEdit(note)}>✏️</button>
            <button style={s.iconBtn} onClick={() => onDelete(note.id)}>🗑️</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── NOTE MODAL ──────────────────── */
function NoteModal({ note, categories, collaborators, onSave, onClose, onNewCategory, currentTab }) {
  const [title, setTitle]           = useState(note?.title || '')
  const [content, setContent]       = useState(note?.content || '')
  const [importance, setImp]        = useState(note?.importance || 1)
  const [cats, setCats]             = useState(note?.cats || [])
  const [reminderAt, setReminderAt] = useState(note?.reminder_at || '')
  const [emailNotify, setEmailNotify] = useState(note?.email_notify ?? true)
  const [pushNotify, setPushNotify]   = useState(note?.push_notify ?? true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(note?.status || 'todo')
  const [assignees, setAssignees] = useState(note?.assignees || [])

  const [localType, setLocalType] = useState(note?.type || (currentTab === 'simple_notes' ? 'note' : 'task'));

  // Verrouillage du scroll iOS quand la modal est ouverte
useEffect(() => {
  const scrollY = window.scrollY
  document.body.style.position = 'fixed'
  document.body.style.top = `-${scrollY}px`
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
  
  return () => {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    window.scrollTo(0, scrollY)
  }
}, [])
  
  const isSimpleNote = localType === 'note';
  const headerColor = isSimpleNote ? '#c9a84c' : Q[importance].color;

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    
    await onSave({
      ...(note?.id ? {id:note.id} : {}),
      title: title.trim(), 
      content: content.trim(),
      type: localType, 
      importance: isSimpleNote ? 4 : importance, 
      cats,
      reminder_at: isSimpleNote ? null : (reminderAt || null),
      email_notify: isSimpleNote ? false : emailNotify, 
      push_notify: isSimpleNote ? false : pushNotify,
      status: isSimpleNote ? 'todo' : status,
      // CORRECTION ICI : On enregistre les collaborateurs même pour les notes !
      assignees: assignees 
    })
    
    setSaving(false)
  }

  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{...s.modal, animation:'slideUp 0.25s ease'}}
        onTouchEnd={e => e.stopPropagation()}  // ← AJOUT
  >
        
        <div style={{...s.modalHeader, background: headerColor}}>
          <div style={{display:'flex', gap: 10, alignItems: 'center'}}>
            <span style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,color:'#fff'}}>
              {isSimpleNote ? 'Note 📝' : 'Tâche 📋'}
            </span>
            <button 
              type="button"
              onClick={() => setLocalType(isSimpleNote ? 'task' : 'note')}
              style={{background: 'rgba(255,255,255,0.2)', border: '1px solid #fff', color: '#fff', borderRadius: 15, padding: '2px 10px', fontSize: 11, cursor: 'pointer'}}
            >
              Basculer en {isSimpleNote ? 'Tâche' : 'Note'}
            </button>
          </div>
          <button style={{...s.iconBtn,color:'#fff',fontSize:20}} onClick={onClose}>×</button>
        </div>

        <div style={s.modalBody}>
          <input style={{...s.input,fontSize:15,fontWeight:500}} placeholder="Titre *" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea style={{...s.input,...s.textarea}} placeholder="Contenu (optionnel)" value={content} onChange={e => setContent(e.target.value)} />

          {!isSimpleNote && (
            <div style={{marginBottom: 12}}>
              <label style={s.label}>Priorité</label>
              <div style={s.quadGrid}>
                {Object.entries(Q).map(([k,v]) => (
                  <button key={k} style={{...s.quadBtn, borderColor:+k===importance ? v.color : '#e5e0d5', background:+k===importance ? v.color+'18' : '#f8f6f1', color:+k===importance ? v.color : '#9a8f7a'}} onClick={() => setImp(+k)}>
                    <span style={{fontSize:18}}>{v.emoji}</span>
                    <span style={{fontSize:10,lineHeight:1.3,fontWeight:600}}>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isSimpleNote && (
            <div style={{marginBottom: 12}}>
              <label style={s.label}>Statut</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{...s.input, padding:'7px 10px'}}>
                <option value="todo">⏳ À faire</option>
                <option value="doing">🚀 En cours</option>
                <option value="waiting">⏸️ En attente</option>
                <option value="done">✅ Terminé</option>
              </select>
            </div>
          )}

          <div style={{marginBottom: 12}}>
            <label style={s.label}>Qui ?</label>
            <div style={{...s.input, minHeight: 40, padding: '8px 10px', background: '#f8f6f1'}}>
              {collaborators && collaborators.map(name => (
                <label key={name} style={{display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:4, cursor:'pointer', color:'#1a1208'}}>
                  <input 
                    type="checkbox" 
                    checked={assignees.includes(name)}
                    onChange={(e) => {
                      if(e.target.checked) setAssignees([...assignees, name])
                      else setAssignees(assignees.filter(n => n !== name))
                    }}
                  />
                  {name}
                </label>
              ))}
              {(!collaborators || collaborators.length === 0) && <span style={{fontSize:12, color:'#9a8f7a'}}>Aucun collaborateur créé</span>}
            </div>
          </div>

          <label style={s.label}>Catégories</label>
          <CatDropdown categories={categories} selected={cats} onChange={setCats} onNewCategory={onNewCategory} />

          {!isSimpleNote && (
            <>
              <label style={s.label}>Date & heure de rappel</label>
              <DateTimePicker value={reminderAt} onChange={setReminderAt} />
            </>
          )}
        </div>

        <div style={s.modalFooter}>
  <button style={s.btnGhost} onPointerDown={onClose}>Annuler</button>
  <button 
    style={{...s.btn, opacity:saving?0.6:1, background: headerColor, color:'#fff'}} 
    onPointerDown={save} 
    disabled={saving}
  >
    {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
} 

/* ──────────────────── CAT SETTINGS (Version avec changement de couleur) ──────────────────── */
function CatSettings({ categories, onChange }) {
  const [newName, setNewName]   = useState('')
  const [newColor, setNewColor] = useState(CAT_PALETTE[0])
  const [editId, setEditId]     = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('') // On ajoute l'état pour la couleur éditée [cite: 84]

  const add = () => {
    if (!newName.trim()) return
    onChange([...categories, {id:'c'+Date.now(), name:newName.trim(), color:newColor}])
    setNewName('')
  }

  return (
    <div style={s.settingsCard}>
      <h3 style={s.settingsCardTitle}>🏷️ Mes catégories</h3>
      <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:14}}>
        {categories.length === 0 && <p style={{color:'#9a8f7a', fontSize:13}}>Aucune catégorie pour l'instant.</p>}
        {categories.map(c => (
          <div key={c.id} style={{display:'flex', flexDirection:'column', gap:4, padding:'10px', background:'#f8f6f1', borderRadius:10}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              {/* Le point de couleur change dynamiquement pendant l'édition */}
              <span style={{width:14, height:14, borderRadius:'50%', background: editId === c.id ? editColor : c.color, flexShrink:0}} />
              
              {editId === c.id ? (
                <input 
                  autoFocus 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)}
                  style={{flex:1, border:'1px solid #e5e0d5', borderRadius:6, padding:'4px 8px', fontSize:13, background:'#fff'}} 
                />
              ) : (
                <span style={{flex:1, fontSize:13, color:'#1a1208', fontWeight: 500}}>{c.name}</span>
              )}

              {editId === c.id ? (
                <button 
                  onClick={() => {
                    onChange(categories.map(x => x.id === c.id ? {...x, name:editName, color:editColor} : x));
                    setEditId(null);
                  }} 
                  style={{background:'#16a34a', color:'#fff', border:'none', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer'}}
                >
                  Enregistrer
                </button>
              ) : (
                <>
                  <button onClick={() => {setEditId(c.id); setEditName(c.name); setEditColor(c.color)}} style={{background:'transparent', border:'none', cursor:'pointer', fontSize:14}}>✏️</button>
                  <button onClick={() => onChange(categories.filter(x => x.id !== c.id))} style={{background:'transparent', border:'none', cursor:'pointer', fontSize:14}}>🗑️</button>
                </>
              )}
            </div>

            {/* PALETTE QUI APPARAÎT SEULEMENT LORS DE L'ÉDITION */}
            {editId === c.id && (
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8, padding:'8px', background:'#fff', borderRadius:8, border:'1px solid #e5e0d5'}}>
                {CAT_PALETTE.map(col => (
                  <button 
                    key={col} 
                    onClick={() => setEditColor(col)} 
                    style={{
                      width:22, height:22, borderRadius:'50%', background:col, 
                      border: editColor === col ? '2px solid #1a1208' : '1px solid transparent', 
                      cursor:'pointer', padding:0
                    }} 
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Le reste (Nouvelle catégorie) ne change pas */}
      <div style={{borderTop:'1px solid #f0ece3', paddingTop:12}}>
        <p style={{...s.label, marginBottom:8}}>Nouvelle catégorie</p>
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nom…" style={{...s.input, flex:1}} />
          <button onClick={add} style={s.btn}>＋ Ajouter</button>
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {CAT_PALETTE.map(col => (
            <button key={col} onClick={() => setNewColor(col)} style={{width:22, height:22, borderRadius:'50%', background:col, border:newColor===col?'3px solid #1a1208':'2px solid transparent', cursor:'pointer'}} />
          ))}
        </div>
      </div>
    </div>
  )
}


/* ──────────────────── CALENDAR ──────────────────── */
/* ──────────────────── CALENDAR VIEW (CORRIGÉ) ──────────────────── */
function CalendarView({ notes, onEdit }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  
  const years = Array.from({length: 31}, (_, i) => today.getFullYear() - 15 + i)

  const goToToday = () => {
    setMonth(today.getMonth())
    setYear(today.getFullYear())
  }

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const offset = (firstDay + 6) % 7

  const notesByDay = {}
  notes.filter(n => n.reminder_at).forEach(n => {
    const d = new Date(n.reminder_at)
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate()
      if (!notesByDay[day]) notesByDay[day] = []
      notesByDay[day].push(n)
    }
  })

  const cells = []
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div style={s.calWrap}>
      <div style={s.calHeader}>
        <button style={s.iconBtn} onClick={prevMonth}>‹</button>
        
        <div style={{display:'flex', gap: 12, alignItems:'center'}}>
          <div style={{display:'flex', gap: 4, alignItems:'center'}}>
            <div style={s.selectWrapper}>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} style={s.calHeaderSelect}>
                {MONTHS_FR.map((m, i) => (<option key={i} value={i}>{m}</option>))}
              </select>
              <span style={s.selectChevron}>▼</span>
            </div>
            <div style={s.selectWrapper}>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={s.calHeaderSelect}>
                {years.map(y => (<option key={y} value={y}>{y}</option>))}
              </select>
              <span style={s.selectChevron}>▼</span>
            </div>
          </div>

          <button onClick={goToToday} style={{...s.iconBtn, fontSize: 18, background: '#fff', padding: '5px', borderRadius: '50%', border: '1px solid #e5e0d5', display: 'flex', alignItems: 'center', justifyContent: 'center'}} title="Aujourd'hui">📅</button>
        </div>

        <button style={s.iconBtn} onClick={nextMonth}>›</button>
      </div>
      
      <div style={s.calGrid}>
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <div key={d} style={s.calDayHeader}>{d}</div>)}
        {cells.map((d, i) => {
          const isToday = d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
          return (
            <div key={i} style={{
              ...s.calCell, 
              border: isToday ? '2px solid #c9a84c' : '1px solid #e5e0d5', 
              background: isToday ? '#ffffff' : 'transparent',
              boxShadow: isToday ? 'inset 0 0 0 1px #c9a84c' : 'none'
            }}>
              {d && (
                <>
                  <span style={{fontSize: 11, fontWeight: isToday ? 800 : 600, color: isToday ? '#c9a84c' : '#9a8f7a'}}>{d}</span>
                  {notesByDay[d] && notesByDay[d].map((n, j) => (
                    <div 
                      key={j} 
                      onClick={(e) => { e.stopPropagation(); onEdit(n); }} 
                      style={{...s.calDot, background: Q[n.importance].color, cursor: 'pointer'}}
                    >
                      {n.title.slice(0, 12)}
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ──────────────────── SETTINGS VIEW (COMPLET) ──────────────────── */
function SettingsView({ session, categories, onCategoriesChange, collaborators, onCollaboratorsChange }) {
  const [pushStatus, setPushStatus] = useState('idle')
  const [pushMsg, setPushMsg]       = useState('')

  const subscribePush = async () => {
    setPushStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { 
        setPushMsg('Notifications push déjà activées ✓'); 
        setPushStatus('ok'); 
        return 
      }
      const sub = await reg.pushManager.subscribe({ 
        userVisibleOnly: true, 
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) 
      })
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: session.user.id, 
        endpoint: sub.endpoint,
        auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
        p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      })
      if (error) throw error
      setPushMsg('Notifications push activées ✓'); 
      setPushStatus('ok')
    } catch(e) { 
      setPushMsg('Erreur : ' + e.message); 
      setPushStatus('error') 
    }
  }

  return (
    <div style={s.settingsWrap}>
      <h2 style={s.sectionTitle}>Paramètres</h2>
      
      {/* 1. CATÉGORIES */}
      <CatSettings categories={categories} onChange={onCategoriesChange} />
      
      {/* 2. L'ÉQUIPE / COLLABORATEURS */}
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>👥 L'Équipe</h3>
        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <input 
            id="new-collab-input" 
            placeholder="Nom du collaborateur..." 
            style={{...s.input, flex:1}}
            onKeyDown={e => {
              if(e.key === 'Enter' && e.target.value.trim()){
                onCollaboratorsChange([...collaborators, e.target.value.trim()]);
                e.target.value = '';
              }
            }}
          />
          <button style={s.btn} onClick={() => {
            const input = document.getElementById('new-collab-input');
            if(input.value.trim()){
              onCollaboratorsChange([...collaborators, input.value.trim()]);
              input.value = '';
            }
          }}>＋</button>
        </div>
        <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
          {collaborators && collaborators.map(name => (
            <span key={name} style={{background:'#f0ece3', color:'#1a1208', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight: 600, display:'flex', alignItems:'center', gap:8}}>
              {name}
              <button onClick={() => onCollaboratorsChange(collaborators.filter(n => n !== name))} style={{border:'none', background:'transparent', cursor:'pointer', fontSize:16, color: '#9a8f7a'}}>×</button>
            </span>
          ))}
        </div>
      </div>

      {/* 3. NOTIFICATIONS PUSH */}
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>🔔 Notifications push</h3>
        <p style={{color:'#7a6f5e', marginBottom:16, fontSize:14, lineHeight:1.5}}>
          Autorise les notifications pour recevoir des rappels directement sur cet appareil.
        </p>
        <button 
          style={{...s.btn, opacity: pushStatus === 'loading' ? 0.6 : 1}} 
          onClick={subscribePush} 
          disabled={pushStatus === 'loading'}
        >
          {pushStatus === 'loading' ? '...' : 'Activer les notifications push'}
        </button>
        {pushMsg && <p style={{marginTop:10, fontSize:13, color: pushStatus === 'ok' ? '#16a34a' : '#dc2626'}}>{pushMsg}</p>}
      </div>

      {/* 4. RAPPELS E-MAIL */}
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>📧 Rappels par e-mail</h3>
        <p style={{color:'#7a6f5e', fontSize:14, lineHeight:1.5}}>
          Les rappels sont envoyés automatiquement à l'heure définie.<br/>
          Adresse : <strong>{session.user.email}</strong>
        </p>
      </div>

      {/* 5. MATRICE D'EISENHOWER */}
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>🟩 Matrice d'Eisenhower</h3>
        {Object.entries(Q).map(([k,v]) => (
          <div key={k} style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
            <span style={{width:12, height:12, borderRadius:'50%', background:v.color, flexShrink:0}} />
            <span style={{fontWeight:500}}>{v.label}</span>
            <span style={{color:'#9a8f7a', fontSize:13}}> — {v.desc}</span>
          </div>
        ))}
      </div>

      {/* BOUTON DÉCONNEXION */}
      <button style={{...s.btnGhost, marginTop: 8}} onClick={() => supabase.auth.signOut()}>
        Se déconnecter
      </button>
      
    </div> // Fin de settingsWrap
  ) // Fin du return
} // Fin de la fonction SettingsView

/* ──────────────────── MAIN APP ──────────────────── */
export default function App() {
  const [session, setSession]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [notes, setNotes]           = useState([])
  const [categories, setCategories] = useState([])
  const [tab, setTab]               = useState('notes')
  const [modal, setModal]           = useState(null)
  const [filterQ, setFilterQ]       = useState(0)
  const [filterCats, setFilterCats] = useState([])
  const [isCatsOpen, setIsCatsOpen] = useState(false);
  const [search, setSearch]         = useState('')
  const [showDone, setShowDone]     = useState(false)
  const [showWaiting, setShowWaiting] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [filterAssignee, setFilterAssignee] = useState(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); setLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_e,s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const fetchNotes = useCallback(async () => {
    if (!session) return
    const {data} = await supabase.from('notes').select('*').order('importance').order('created_at',{ascending:false})
    setNotes(data||[])
  }, [session])

  const rolloverOverdueTasks = useCallback(async () => {
  if (!session) return

  const now = new Date()
  const overdue = notes.filter(n => 
    n.type === 'task' && 
    n.status !== 'done' && 
    n.reminder_at && 
    new Date(n.reminder_at) < now
  )

  if (overdue.length === 0) return

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(7, 0, 0, 0) // Reporté à 9h le lendemain

  await Promise.all(overdue.map(n =>
    supabase.from('notes')
      .update({ reminder_at: tomorrow.toISOString() })
      .eq('id', n.id)
  ))

  await fetchNotes()
}, [session, notes, fetchNotes])

 const fetchSettings = useCallback(async () => {
  if (!session) return
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
  
  if (data?.categories) setCategories([...data.categories].sort((a, b) => a.name.localeCompare(b.name)))
  
  // CORRECTION : On enlève le texte qui était ici
  if (data?.collaborators) setCollaborators([...data.collaborators].sort()) 
}, [session])

  useEffect(() => { 
  fetchNotes().then(() => rolloverOverdueTasks())
  fetchSettings() 
}, [fetchNotes, fetchSettings, rolloverOverdueTasks])

  const saveCategories = async (newCats) => {
  // On trie par nom avant de sauvegarder
  const sorted = [...newCats].sort((a, b) => a.name.localeCompare(b.name));
  
  setCategories(sorted);
  await supabase.from('user_settings').upsert({ 
    user_id: session.user.id, 
    categories: sorted 
  });
};

  
 const saveCollaborators = async (newCollabs) => {
  const sorted = [...newCollabs].sort(); // Tri par ordre alphabétique
  setCollaborators(sorted);
  await supabase.from('user_settings').upsert({ 
    user_id: session.user.id, 
    collaborators: sorted 
  });
};

  const saveNote = async (payload) => {
  const { id, type, status, assignee, ...dataToSave } = payload;
  
  if (id) {
    await supabase.from('notes')
      .update({ 
        ...dataToSave, 
        type, 
        status,    // Ajoute bien ça
        assignee,  // Et ça
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
  } else {
    await supabase.from('notes')
      .insert({ 
        ...dataToSave, 
        type, 
        status,    // Et ici aussi
        assignee, 
        user_id: session.user.id 
      });
  }
  await fetchNotes(); 
  setModal(null);
}
  const deleteNote = async (id) => {
    if (!confirm('Supprimer cette note ?')) return
    await supabase.from('notes').delete().eq('id',id)
    setNotes(n=>n.filter(x=>x.id!==id))
  }

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#f8f6f1'}}>
      <div style={{width:32,height:32,border:'3px solid #e5e0d5',borderTopColor:'#c9a84c',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
    </div>
  )

  if (!session) return <AuthScreen onAuth={setSession} />

// SÉCURITÉ ANTI-ÉCRAN NOIR (à insérer ici)
  if (session && (!notes || !categories)) {
    return (
      <div style={{...s.overlay, background:'#f8f6f1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <p style={{fontSize: 40}}>⏳</p>
        <p style={{color:'#9a8f7a', marginTop:10, fontFamily:'sans-serif'}}>Chargement de votre espace...</p>
      </div>
    )
  }
    
  const filtered = notes
  .filter(n => {
    if (tab === 'notes') {
  if (showDone) return n.type === 'task' && n.status === 'done'
  if (showWaiting) return n.type === 'task' && n.status === 'waiting'
  return n.type === 'task' && n.status !== 'done' && n.status !== 'waiting'
}
    if (tab === 'simple_notes') return n.type === 'note';
    return true;
  })
  .filter(n => filterQ === 0 || n.importance === filterQ)
  .filter(n => filterCats.length === 0 || filterCats.every(id => (n.cats || []).includes(id)))
  .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()))
  .filter(n => !filterAssignee || (n.assignees || []).includes(filterAssignee))
  // LE TRI INTELLIGENT
  .sort((a, b) => {
  if (tab === 'notes') { // Rappel : l'onglet s'appelle 'notes' pour les Tâches
    if (a.importance !== b.importance) return a.importance - b.importance;
  }
  // Si même importance ou si on est dans les Notes simples, le plus récent en haut
  return new Date(b.created_at) - new Date(a.created_at);
});
  
// FONCTION POUR COMPTER LES NOTES PAR CATÉGORIE
const getCatCount = (catId) => {
  return notes.filter(n => (n.cats || []).includes(catId)).length;
};
  
  return (
    <div style={s.app}>
      <header style={s.header}>
        <h1 style={s.logo}>Mémo</h1>
        
     <nav style={s.nav}>
  {[
    ['notes', '📋 Tâches'],
    ['simple_notes', '📝 Notes'],
    ['calendar', '📅 Calendrier'],
    ['settings', '⚙️ Paramètres']
  ].map(([id, label]) => (
    <button 
      key={id} 
      style={{...s.navBtn, ...(tab === id ? s.navBtnActive : {})}} 
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  ))}
</nav>
      </header>

     <main style={s.main}>
        {(tab === 'notes' || tab === 'simple_notes') && (
          <>
            {/* LE BANDEAU GRIS BLEUTÉ (filterPanel) */}
            <div style={s.filterPanel}>
              <div style={s.toolbar}>
                <input 
                  style={{...s.input, flex: 1, height: 38, background: '#fff'}} 
                  placeholder="Rechercher…" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
                <button style={{...s.btn, whiteSpace: 'nowrap'}} onClick={() => setModal('new')}>
                  ＋ {tab === 'simple_notes' ? 'Note' : 'Tâche'}
                </button>
              </div>

              {tab === 'notes' && (
                <div style={{display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div style={{display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap'}}>
                    <span style={s.filterLabel}>Priorité</span>
                    {[[0, 'Toutes'], [1, '🔴'], [2, '🔵'], [3, '🟡'], [4, '🟢']].map(([k, label]) => (
                      <button 
                        key={k} 
                        style={{...s.filterBtn, ...(filterQ === k ? {background: k === 0 ? '#1a1208' : Q[k]?.color, color: '#fff'} : {})}} 
                        onClick={() => setFilterQ(k)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setShowDone(!showDone)}
                    style={{...s.btnGhost, padding: '4px 12px', fontSize: 11, borderColor: showDone ? '#c9a84c' : '#e5e0d5', color: showDone ? '#c9a84c' : '#9a8f7a', display: 'flex', alignItems: 'center', gap: 5}}
                  >
                    {showDone ? '📂 Actives' : '✅ Terminées'}
                  </button>
                  <button 
    onClick={() => { setShowWaiting(!showWaiting); setShowDone(false) }}
    style={{...s.btnGhost, padding: '4px 12px', fontSize: 11, borderColor: showWaiting ? '#9333ea' : '#e5e0d5', color: showWaiting ? '#9333ea' : '#9a8f7a'}}
  >
    ⏸️ En attente
  </button>
                </div>
              )}

             {/* DEBUT DU BLOC CATEGORIES RETRACTABLE */}
<div style={{display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #e1e8f0', paddingTop: 8, marginBottom: 10}}>
  
  {/* La barre de titre cliquable */}
  <div 
  onClick={() => setIsCatsOpen(!isCatsOpen)} 
  style={{
    display: 'flex', 
    alignItems: 'center', 
    gap: 10, // <--- C'est ici qu'on gère l'écart entre le titre et le bouton
    cursor: 'pointer', 
    padding: '4px 0'
  }}
>
  <span style={s.filterLabel}>
    Catégories {filterCats.length > 0 && `(${filterCats.length})`}
  </span>
  <span style={{fontSize: 11, color: '#9a8f7a', fontWeight: 600}}>
    {isCatsOpen ? '▲ Masquer' : '▼ Afficher'}
  </span>
</div>
  
  {/* Le tiroir qui s'ouvre ou se ferme */}
  {isCatsOpen && (
    <div style={{display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, animation: 'fadeIn 0.2s ease'}}>
      <button 
        onClick={() => setFilterCats([])} 
        style={{...s.filterBtn, ...(filterCats.length === 0 ? {background: '#1a1208', color: '#fff'} : {})}}
      >
        Toutes
      </button>
      
      {categories.map(c => {
        const isSelected = filterCats.includes(c.id);
        return (
          <button 
            key={c.id} 
            onClick={() => {
              // Ajoute ou enlève la catégorie du tableau
              setFilterCats(isSelected ? filterCats.filter(id => id !== c.id) : [...filterCats, c.id]);
            }} 
            style={{
              ...s.filterBtn, 
              background: isSelected ? c.color : c.color + '15', 
              color: isSelected ? '#fff' : c.color, 
              borderColor: c.color + '55'
            }}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  )}
</div>


              <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center'}}>
                <span style={s.filterLabel}>Qui ?</span>
                <button onClick={() => setFilterAssignee(null)} style={{...s.filterBtn, ...(filterAssignee === null ? {background: '#1a1208', color: '#fff'} : {})}}>Tous</button>
                {collaborators.map(name => (
                  <button key={name} onClick={() => setFilterAssignee(filterAssignee === name ? null : name)} style={{...s.filterBtn, ...(filterAssignee === name ? {background: '#c9a84c', color: '#fff', borderColor: '#c9a84c'} : {})}}>👤 {name}</button>
                ))}
              </div>
            </div> {/* FIN DU filterPanel */}

            {/* AFFICHAGE DES FICHES */}
            {filtered.length === 0 ? (
              <div style={s.empty}>
                <p style={{fontSize: 40}}>📝</p>
                <p style={{color: '#9a8f7a', marginTop: 8}}>Rien ici pour le moment.</p>
              </div>
           ) : (
  <>
    {showDone && (
      <h2 style={{fontFamily:'serif', fontStyle:'italic', color:'#9a8f7a', fontSize:20, marginBottom:8}}>
        ✅ Tâches terminées
      </h2>
    )}
    {showWaiting && (
      <h2 style={{fontFamily:'serif', fontStyle:'italic', color:'#9a8f7a', fontSize:20, marginBottom:8}}>
        ⏸️ Tâches en attente
      </h2>
    )}
    <div style={s.noteGrid}>
      {filtered.map(n => (
        <NoteCard key={n.id} note={n} categories={categories} onEdit={setModal} onDelete={deleteNote} />
      ))}
    </div>
  </>
)}
          </>
        )}

       {tab === 'calendar' && <CalendarView notes={notes} onEdit={setModal} />}
        {tab === 'settings' && (
          <SettingsView 
            session={session} 
            categories={categories} 
            onCategoriesChange={saveCategories}
            collaborators={collaborators} 
            onCollaboratorsChange={saveCollaborators} 
          />
        )}
      </main>

      {modal && (
        <NoteModal 
          note={modal === 'new' ? null : modal} 
          categories={categories} 
          collaborators={collaborators} 
          onSave={saveNote} 
          onClose={() => setModal(null)}
          onNewCategory={saveCategories}
          currentTab={tab}
        />
      )}
    </div>
  )
}

const s = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f8f6f1',
    touchAction: 'manipulation', 
    overflowX: 'hidden' 
  },
  
filterPanel: { 
  background: '#f0f4f8', 
  padding: '16px', // On augmente un peu le padding pour que ce soit plus aéré
  borderRadius: '16px', 
  marginBottom: '20px', 
  border: '1px solid #e1e8f0', 
  display: 'flex', // <--- On met 'flex' à la place de 'inline-flex'
  flexDirection: 'column', 
  gap: 12,
  width: '100%' // <--- On force la largeur à 100% du conteneur
},
  
  // À modifier dans ton objet "s" tout en bas :
header: { 
  position: 'sticky', 
  top: 0, 
  zIndex: 10, 
  background: '#fff', 
  borderBottom: '1px solid #e5e0d5', 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center', // <--- Aligne tout le contenu (logo + nav) au centre
  justifyContent: 'center',
  padding: '10px 0',
  width: '100%'
},
logo: { 
  fontFamily: 'serif', 
  fontSize: 22, 
  fontWeight: 700, 
  color: '#c9a84c', 
  fontStyle: 'italic',
  textAlign: 'center', // <--- Sécurité supplémentaire pour le texte
  margin: '0 0 5px 0', // Petit espace sous le logo avant les boutons
  width: '100%'
},
 nav: {
    display: 'flex',
    gap: 2, // On réduit l'écart entre les boutons pour les rapprocher du centre 
    justifyContent: 'center'
  },
  navBtn: {
    background: 'transparent',
    color: '#9a8f7a',
    padding: '6px 6px', // On réduit le padding latéral (de 12px à 6px) pour "tirer" les boutons vers l'intérieur 
    borderRadius: 8,
    fontSize: 13, // On garde une taille lisible 
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: 4
  },
  
  navBtnActive:{background:'#f0ece3',color:'#1a1208'},
  main:         {flex:1,maxWidth:860,width:'100%',margin:'0 auto',padding:'20px 16px 40px'},
  toolbar:      {display:'flex',gap:10,marginBottom:12},
  filterLabel: {fontSize:10,fontWeight:600,color:'#9a8f7a',textTransform:'uppercase',letterSpacing:'0.5px',marginRight:2,flexShrink:0},
  filterBtn:    {background:'#fff',border:'1px solid #e5e0d5',color:'#9a8f7a',padding:'3px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'inherit'},
  noteGrid:     {display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:16},
  empty:        {textAlign:'center',marginTop:60},
  card:         {borderRadius:12,overflow:'hidden',border:'1px solid #e5e0d5',background:'#fff', display: 'flex', flexDirection: 'column'},
  cardBanner:   {display:'flex',alignItems:'center',gap:8,padding:'8px 14px'},
  bannerEmoji: {fontSize:13},
  bannerLabel: {fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.95)',flex:1},
  bannerDesc:   {fontSize:9,color:'rgba(255,255,255,0.75)',background:'rgba(0,0,0,0.2)',padding:'2px 6px',borderRadius:10},
  cardBody:     {padding:'13px 15px 11px', flex: 1},
  cardTitle:    {fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,color:'#1a1208',marginBottom:5},
  cardContent: {fontSize:12,color:'#7a6f5e',lineHeight:1.5,marginBottom:8,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'},
  cardFooter:   {display:'flex',alignItems:'center',justifyContent:'space-between',gap:8},
  reminderBadge:{fontSize:10,fontWeight:500},
  cardActions: {display:'flex',gap:4},
  overlay: {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  zIndex: 50,
  overflowY: 'auto',                    
  WebkitOverflowScrolling: 'touch',     
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  padding: 16
},
  modal: {
  background: '#fff',
  border: '1px solid #e5e0d5',
  borderRadius: '16px 16px 0 0',
  width: '100%',
  maxWidth: 520,
  maxHeight: '90vh',
  // overflow: 'hidden' ← SUPPRIMER cette ligne
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
},
  modalHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  width: '100%',
  minHeight: '50px'},
  modalBody: {
  flex: 1,
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',    // ← AJOUT
  padding: '18px 18px 250px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12
},
  modalFooter: {display:'flex',justifyContent:'flex-end',gap:10,padding:18,borderTop:'1px solid #f0ece3'},
  label:        {fontSize:11,fontWeight:600,color:'#9a8f7a',letterSpacing:'0.5px',textTransform:'uppercase'},
  input:        {background:'#f8f6f1',border:'1px solid #e5e0d5',borderRadius:8,color:'#1a1208',padding:'9px 12px',fontSize:16,width:'100%',fontFamily:'inherit'},
  textarea:     {resize:'vertical',minHeight:90},
  quadGrid:     {display:'grid',gridTemplateColumns:'1fr 1fr',gap:8},
  quadBtn:      {background:'#f8f6f1',border:'2px solid',borderRadius:10,padding:'10px 8px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,textAlign:'center',fontFamily:'inherit'},
  notifRow:     {display:'flex',gap:20},
  checkLabel:   {display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#9a8f7a',cursor:'pointer'},
  btn:          {background:'#c9a84c',color:'#13100a',fontWeight:700,fontSize:13,padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'inherit'},
  btnGhost:     {background:'transparent',border:'1px solid #e5e0d5',color:'#9a8f7a',fontSize:13,padding:'8px 18px',borderRadius:8,cursor:'pointer',fontFamily:'inherit'},
  iconBtn:      {background:'transparent',color:'#9a8f7a',fontSize:18,padding:'2px 6px',borderRadius:6,cursor:'pointer',border:'none',fontFamily:'inherit'},
  calWrap:      {animation:'fadeIn 0.3s ease'},
  calHeader:    {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,padding:'0 4px'},
  calGrid:      {display:'grid',gridTemplateColumns:'repeat(7, 1fr)',gap:4},
  calDayHeader:{textAlign:'center',fontSize:10,fontWeight:600,color:'#9a8f7a',padding:'4px 0',textTransform:'uppercase'},
  calCell:      {minHeight:72,borderRadius:8,padding:6,display:'flex',flexDirection:'column',gap:3},
  calDayNum:    {fontSize:11,fontWeight:500,marginBottom:2},
  calDot:       {fontSize:9,color:'#fff',borderRadius:4,padding:'2px 4px',overflow:'hidden',whiteSpace:'nowrap',lineHeight:1.4},
  settingsWrap:{maxWidth:500,animation:'fadeIn 0.3s ease'},
  sectionTitle:{fontFamily:'var(--font-display)',fontSize:24,fontWeight:700,marginBottom:20,color:'#c9a84c',fontStyle:'italic'},
  settingsCard:{background:'#fff',border:'1px solid #e5e0d5',borderRadius:12,padding:'18px 20px',marginBottom:12},
  settingsCardTitle:{fontSize:15,fontWeight:600,marginBottom:12,color:'#1a1208'},
  authWrap:     {minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'#f8f6f1'},
  authCard:     {background:'#fff',border:'1px solid #e5e0d5',borderRadius:20,padding:'36px 32px',width:'100%',maxWidth:380,boxShadow:'0 8px 32px rgba(0,0,0,0.08)'},
  authTitle:    {fontFamily:'var(--font-display)',fontSize:36,fontWeight:700,color:'#c9a84c',textAlign:'center',marginBottom:4,fontStyle:'italic'},
  authSub:      {textAlign:'center',color:'#9a8f7a',marginBottom:28,fontSize:14},
  authFields:   {display:'flex',flexDirection:'column',gap:12,marginBottom:16},
  authToggle:   {background:'transparent',color:'#9a8f7a',fontSize:13,marginTop:12,width:'100%',textDecoration:'underline',cursor:'pointer',border:'none',fontFamily:'inherit'},
  errorTxt:     {color:'#dc2626',fontSize:13,marginBottom:8},
  successTxt:   {color:'#16a34a',fontSize:13,marginBottom:8},
  dateRow:      {display: 'flex', flexDirection: 'column', gap: 10, padding: '10px', background: '#f8f6f1', borderRadius: '8px', border: '1px solid #e5e0d5'},
  calHeaderSelect: {
    fontFamily: 'serif',
    fontSize: 22, // Légèrement plus grand pour le style
    fontWeight: 700,
    color: '#c9a84c',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    padding: '0 2px',
  },
  selectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 6px',
    borderRadius: 8,
    transition: 'background 0.2s',
    cursor: 'pointer',
    // Petit effet au survol pour montrer que c'est cliquable
    background: 'rgba(201, 168, 76, 0.05)', 
  },
  selectChevron: {
    fontSize: 10,
    color: '#c9a84c',
    marginTop: 4,
    opacity: 0.7
  },
};
