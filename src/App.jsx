import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'

const VAPID_PUBLIC_KEY = 'BAurdkv0qAKxkuzAq448zYqL5BuOjxWjBkXANNBAh7nDGho7UUsFgfu9TUyc4zg_vsZ4ggW3PVvK6Z_ZiTsNmXs'

const Q = {
  1: { label: 'Urgent · Important',       color: '#dc2626', light: 'rgba(220,38,38,0.10)',  emoji: '🔴', desc: 'À Faire maintenant' },
  2: { label: 'Important · Pas urgent',   color: '#2563eb', light: 'rgba(37,99,235,0.10)',  emoji: '🔵', desc: 'À Planifier'        },
  3: { label: 'Urgent · Pas important',   color: '#d97706', light: 'rgba(217,119,6,0.10)',  emoji: '🟡', desc: 'À Déléguer'         },
  4: { label: 'Ni urgent · Ni important', color: '#6b7280', light: 'rgba(107,114,128,0.10)',emoji: '🟢', desc: 'À méditer'        },
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

/* ──────────────────── DATE TIME PICKER ──────────────────── */
/* ──────────────────── DATE TIME PICKER (Version Popover Compacte) ──────────────────── */
/* ──────────────────── DATE TIME PICKER (Indépendant) ──────────────────── */
function DateTimePicker({ value, onChange }) {
  const [openPart, setOpenPart] = useState(null) // 'date' ou 'time'
  const pickerRef = useRef(null)
  const today = new Date()
  
  const parsed = value && !isNaN(new Date(value).getTime()) ? new Date(value) : null
  
  const [year, setYear]   = useState(parsed ? parsed.getFullYear() : today.getFullYear())
  const [month, setMonth] = useState(parsed ? parsed.getMonth() : today.getMonth())
  const [day, setDay]     = useState(parsed ? parsed.getDate() : today.getDate())
  const [hour, setHour]   = useState(parsed ? parsed.getHours() : 9)
  const [minute, setMinute] = useState(parsed ? Math.round(parsed.getMinutes()/5)*5 : 0)

  // Fermer les menus si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setOpenPart(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    position:'absolute', top:'100%', left:0, zIndex:1000, background:'#fff', 
    border:'1px solid #e5e0d5', borderRadius:12, boxShadow:'0 10px 25px rgba(0,0,0,0.1)',
    marginTop:5, padding:12, animation:'fadeIn 0.2s ease'
  }

  return (
    <div ref={pickerRef} style={{ display: 'flex', gap: 10, position: 'relative' }}>
      
      {/* BLOC DATE */}
      <div style={{ flex: 1, position: 'relative' }}>
        <label style={s.label}>Date</label>
        <div onClick={() => setOpenPart(openPart === 'date' ? null : 'date')} 
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
              {cells.map((d, i) => (
                <div key={i} onClick={() => { if(d){ setDay(d); updateGlobal(d, hour, minute); setOpenPart(null); } }} 
                  style={{
                    textAlign: 'center', fontSize: 12, padding: '6px 0', borderRadius: 6, cursor: d ? 'pointer' : 'default',
                    background: day === d && parsed ? '#c9a84c' : 'transparent',
                    color: day === d && parsed ? '#fff' : d ? '#1a1208' : 'transparent',
                  }}>{d || ''}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BLOC HEURE */}
      <div style={{ width: 120, position: 'relative' }}>
        <label style={s.label}>Heure</label>
        <div onClick={() => setOpenPart(openPart === 'time' ? null : 'time')} 
             style={{ ...s.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{color: parsed ? '#1a1208' : '#9a8f7a'}}>{displayTime}</span>
          <span>🕒</span>
        </div>

        {openPart === 'time' && (
          <div style={{ ...popoverStyle, width: 110, display: 'flex', gap: 5 }}>
            {/* Heures */}
            <div style={{ height: 150, overflowY: 'auto', flex: 1, borderRight: '1px solid #f0ece3' }}>
              {Array.from({length:24},(_,i)=>i).map(h => (
                <div key={h} onClick={() => { setHour(h); updateGlobal(day, h, minute); }} 
                  style={{ padding: '6px 0', textAlign: 'center', fontSize: 13, cursor: 'pointer', 
                  background: hour === h ? '#c9a84c' : 'transparent', color: hour === h ? '#fff' : '#1a1208', fontWeight: hour === h ? 700 : 400 }}>
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
            {/* Minutes */}
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
function AuthScreen({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const handle = async () => {
    setLoading(true); setError(''); setMsg('')
    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { data, error: err } = await fn
    setLoading(false)
    if (err) { setError(err.message); return }
    if (mode === 'signup') setMsg('Compte créé ! Tu peux te connecter.')
    else onAuth(data.session)
  }

  return (
    <div style={s.authWrap}>
      <div style={s.authCard}>
        <h1 style={s.authTitle}>Mémo</h1>
        <p style={s.authSub}>Notes & Rappels</p>
        <div style={s.authFields}>
          <input style={s.input} type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==='Enter' && handle()} />
          <input style={s.input} type="password" placeholder="Mot de passe" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && handle()} />
        </div>
        {error && <p style={s.errorTxt}>{error}</p>}
        {msg   && <p style={s.successTxt}>{msg}</p>}
        <button style={{...s.btn, width:'100%', opacity: loading ? 0.6 : 1}} onClick={handle} disabled={loading}>
          {loading ? '…' : mode==='login' ? 'Connexion' : 'Créer un compte'}
        </button>
        <button style={s.authToggle} onClick={() => setMode(m => m==='login' ? 'signup' : 'login')}>
          {mode==='login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
        </button>
      </div>
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
  const q = Q[note.importance];
  const noteCats = (note.cats||[]).map(id => categories.find(c => c.id===id)).filter(Boolean);
  
  // Formatage de la date de création
  const dateStr = new Date(note.created_at).toLocaleString('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={s.card}>
      {isTask && (
        <div style={{...s.cardBanner, background:q.color}}>
          <span style={s.bannerEmoji}>{q.emoji}</span>
          <span style={s.bannerLabel}>{q.label}</span>
        </div>
      )}
      <div style={{...s.cardBody, background: isTask ? q.light : '#fff'}}>
        <h3 style={s.cardTitle}>{note.title}</h3>
        
        {/* On affiche la date de création en petit sous le titre */}
        <p style={{fontSize: 9, color: '#9a8f7a', marginBottom: 8}}>Créé le {dateStr}</p>
        
        {note.content && <p style={s.cardContent}>{note.content}</p>}
        
        {noteCats.length > 0 && (
          <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:8}}>
            {noteCats.map(c => (
              <span key={c.id} style={{background:c.color+'1a',color:c.color,border:`1px solid ${c.color}44`,borderRadius:20,padding:'1px 8px',fontSize:10,fontWeight:600}}>{c.name}</span>
            ))}
          </div>
        )}
        <div style={s.cardFooter}>
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
function NoteModal({ note, categories, onSave, onClose, onNewCategory, currentTab }) {
  const [title, setTitle]           = useState(note?.title || '')
  const [content, setContent]       = useState(note?.content || '')
  const [importance, setImp]        = useState(note?.importance || 1)
  const [cats, setCats]             = useState(note?.cats || [])
  const [reminderAt, setReminderAt] = useState(note?.reminder_at || '')
  const [emailNotify, setEmailNotify] = useState(note?.email_notify ?? true)
  const [pushNotify, setPushNotify]   = useState(note?.push_notify ?? true)
  const [saving, setSaving] = useState(false)

  // Détection du mode : Est-ce une note simple ?
  // On regarde soit le type de la note existante, soit l'onglet où on se trouve
  const isSimpleNote = note?.type === 'note' || (currentTab === 'simple_notes' && !note?.id);
  
  // Si c'est une tâche, on prend la couleur de priorité. Si c'est une note, une couleur neutre.
  const headerColor = isSimpleNote ? '#c9a84c' : Q[importance].color;

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    await onSave({
      ...(note?.id ? {id:note.id} : {}),
      title: title.trim(), 
      content: content.trim(),
      importance: isSimpleNote ? 4 : importance, // Par défaut priorité basse pour les notes
      cats,
      reminder_at: isSimpleNote ? null : (reminderAt || null),
      email_notify: isSimpleNote ? false : emailNotify, 
      push_notify: isSimpleNote ? false : pushNotify,
      type: isSimpleNote ? 'note' : 'task'
    })
    setSaving(false)
  }

  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{...s.modal, animation:'slideUp 0.25s ease'}}>
        
        {/* Header avec couleur dynamique */}
        <div style={{...s.modalHeader, background: headerColor}}>
          <span style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:600,color:'#fff'}}>
            {note?.id ? 'Modifier' : 'Nouveau'} {isSimpleNote ? 'Note' : 'Tâche'}
          </span>
          <button style={{...s.iconBtn,color:'#fff',fontSize:20}} onClick={onClose}>×</button>
        </div>

        <div style={s.modalBody}>
          <input style={{...s.input,fontSize:15,fontWeight:500}} placeholder="Titre *" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea style={{...s.input,...s.textarea}} placeholder="Contenu (optionnel)" value={content} onChange={e => setContent(e.target.value)} />

          {/* SECTION PRIORITÉ : Uniquement pour les tâches */}
          {!isSimpleNote && (
            <>
              <label style={s.label}>Importance / priorité</label>
              <div style={s.quadGrid}>
                {Object.entries(Q).map(([k,v]) => (
                  <button key={k} style={{...s.quadBtn, borderColor:+k===importance ? v.color : '#e5e0d5', background:+k===importance ? v.color+'18' : '#f8f6f1', color:+k===importance ? v.color : '#9a8f7a'}} onClick={() => setImp(+k)}>
                    <span style={{fontSize:18}}>{v.emoji}</span>
                    <span style={{fontSize:10,lineHeight:1.3,fontWeight:600}}>{v.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <label style={s.label}>Catégories</label>
          <CatDropdown categories={categories} selected={cats} onChange={setCats} onNewCategory={onNewCategory} />

          {/* SECTION RAPPEL : Uniquement pour les tâches */}
          {!isSimpleNote && (
            <>
              <label style={s.label}>Date & heure de rappel</label>
              <DateTimePicker value={reminderAt} onChange={setReminderAt} />

              {reminderAt && (
                <div style={s.notifRow}>
                  <label style={s.checkLabel}><input type="checkbox" checked={emailNotify} onChange={e => setEmailNotify(e.target.checked)} style={{accentColor:'#c9a84c'}} /> E-mail</label>
                  <label style={s.checkLabel}><input type="checkbox" checked={pushNotify} onChange={e => setPushNotify(e.target.checked)} style={{accentColor:'#c9a84c'}} /> Push</label>
                </div>
              )}
            </>
          )}
        </div>

        <div style={s.modalFooter}>
          <button style={s.btnGhost} onClick={onClose}>Annuler</button>
          <button style={{...s.btn, opacity:saving?0.6:1, background: headerColor, color:'#fff'}} onClick={save} disabled={saving}>
            {saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── CAT SETTINGS ──────────────────── */
function CatSettings({ categories, onChange }) {
  const [newName, setNewName]   = useState('')
  const [newColor, setNewColor] = useState(CAT_PALETTE[0])
  const [editId, setEditId]     = useState(null)
  const [editName, setEditName] = useState('')

  const add = () => {
    if (!newName.trim()) return
    onChange([...categories, {id:'c'+Date.now(), name:newName.trim(), color:newColor}])
    setNewName('')
  }

  return (
    <div style={s.settingsCard}>
      <h3 style={s.settingsCardTitle}>🏷️ Mes catégories</h3>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
        {categories.length===0 && <p style={{color:'#9a8f7a',fontSize:13}}>Aucune catégorie pour l'instant.</p>}
        {categories.map(c => (
          <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#f8f6f1',borderRadius:8}}>
            <span style={{width:12,height:12,borderRadius:'50%',background:c.color,flexShrink:0}} />
            {editId===c.id
              ? <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if(e.key==='Enter'){onChange(categories.map(x=>x.id===c.id?{...x,name:editName}:x));setEditId(null)}}}
                  style={{flex:1,border:'1px solid #e5e0d5',borderRadius:6,padding:'3px 8px',fontSize:13,fontFamily:'inherit',background:'#fff'}} />
              : <span style={{flex:1,fontSize:13,color:'#1a1208'}}>{c.name}</span>
            }
            {editId===c.id
              ? <button onClick={() => {onChange(categories.map(x=>x.id===c.id?{...x,name:editName}:x));setEditId(null)}} style={{background:'#16a34a',color:'#fff',border:'none',borderRadius:6,padding:'3px 8px',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✓</button>
              : <button onClick={() => {setEditId(c.id);setEditName(c.name)}} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:13,color:'#9a8f7a',padding:'2px 4px'}}>✏️</button>
            }
            <button onClick={() => onChange(categories.filter(x=>x.id!==c.id))} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:13,color:'#9a8f7a',padding:'2px 4px'}}>🗑️</button>
          </div>
        ))}
      </div>
      <div style={{borderTop:'1px solid #f0ece3',paddingTop:12}}>
        <p style={{...s.label,marginBottom:8}}>Nouvelle catégorie</p>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
          <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key==='Enter' && add()} placeholder="Nom…"
            style={{flex:1,background:'#f8f6f1',border:'1px solid #e5e0d5',borderRadius:8,padding:'7px 10px',fontSize:13,color:'#1a1208',fontFamily:'inherit'}} />
          <button onClick={add} style={{...s.btn,whiteSpace:'nowrap'}}>＋ Ajouter</button>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {CAT_PALETTE.map(col => (
            <button key={col} onClick={() => setNewColor(col)} style={{width:22,height:22,borderRadius:'50%',background:col,border:newColor===col?'3px solid #1a1208':'2px solid transparent',cursor:'pointer',outline:'none'}} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────── CALENDAR ──────────────────── */
function CalendarView({ notes }) {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const firstDay    = new Date(year,month,1).getDay()
  const daysInMonth = new Date(year,month+1,0).getDate()
  const offset      = (firstDay+6)%7
  const notesByDay  = {}
  notes.filter(n=>n.reminder_at).forEach(n => {
    const d = new Date(n.reminder_at)
    if (d.getFullYear()===year && d.getMonth()===month) {
      const day = d.getDate()
      if (!notesByDay[day]) notesByDay[day]=[]
      notesByDay[day].push(n)
    }
  })
  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }
  const monthName = new Date(year,month).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})
  const cells = []
  for(let i=0;i<offset;i++) cells.push(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(d)
  const isToday = d => d && d===today.getDate() && month===today.getMonth() && year===today.getFullYear()
  return (
    <div style={s.calWrap}>
      <div style={s.calHeader}>
        <button style={s.iconBtn} onClick={prevMonth}>‹</button>
        <span style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:600,textTransform:'capitalize',color:'#c9a84c'}}>{monthName}</span>
        <button style={s.iconBtn} onClick={nextMonth}>›</button>
      </div>
      <div style={s.calGrid}>
        {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <div key={d} style={s.calDayHeader}>{d}</div>)}
        {cells.map((d,i) => (
          <div key={i} style={{...s.calCell, background:isToday(d)?'rgba(201,168,76,0.10)':d&&notesByDay[d]?'#fff':'transparent', border:isToday(d)?'1px solid #c9a84c':d&&notesByDay[d]?'1px solid #e5e0d5':'1px solid transparent'}}>
            {d && <>
              <span style={{...s.calDayNum,color:isToday(d)?'#c9a84c':'#9a8f7a'}}>{d}</span>
              {notesByDay[d] && notesByDay[d].map((n,j) => (
                <div key={j} style={{...s.calDot,background:Q[n.importance].color}} title={n.title}>
                  {n.title.slice(0,14)}{n.title.length>14?'…':''}
                </div>
              ))}
            </>}
          </div>
        ))}
      </div>
      {Object.keys(notesByDay).length===0 && <p style={{textAlign:'center',color:'#9a8f7a',marginTop:24}}>Aucun rappel ce mois-ci</p>}
    </div>
  )
}

/* ──────────────────── SETTINGS ──────────────────── */
function SettingsView({ session, categories, onCategoriesChange }) {
  const [pushStatus, setPushStatus] = useState('idle')
  const [pushMsg, setPushMsg]       = useState('')

  const subscribePush = async () => {
    setPushStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) { setPushMsg('Notifications push déjà activées ✓'); setPushStatus('ok'); return }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY) })
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id:session.user.id, endpoint:sub.endpoint,
        auth:btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
        p256dh:btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      })
      if (error) throw error
      setPushMsg('Notifications push activées ✓'); setPushStatus('ok')
    } catch(e) { setPushMsg('Erreur : '+e.message); setPushStatus('error') }
  }

  const saveCategories = async (newCats) => {
  // On trie par nom avant de sauvegarder et de mettre à jour l'affichage
  const sorted = [...newCats].sort((a, b) => a.name.localeCompare(b.name))
  
  setCategories(sorted)
  await supabase.from('user_settings').upsert({ 
    user_id: session.user.id, 
    categories: sorted 
  })
}

  return (
    <div style={s.settingsWrap}>
      <h2 style={s.sectionTitle}>Paramètres</h2>
      <CatSettings categories={categories} onChange={saveCategories} />
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>🔔 Notifications push</h3>
        <p style={{color:'#7a6f5e',marginBottom:16,fontSize:14,lineHeight:1.5}}>Autorise les notifications pour recevoir des rappels directement sur cet appareil.</p>
        <button style={{...s.btn,opacity:pushStatus==='loading'?0.6:1}} onClick={subscribePush} disabled={pushStatus==='loading'}>
          {pushStatus==='loading' ? '…' : 'Activer les notifications push'}
        </button>
        {pushMsg && <p style={{marginTop:10,fontSize:13,color:pushStatus==='ok'?'#16a34a':'#dc2626'}}>{pushMsg}</p>}
      </div>
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>📧 Rappels par e-mail</h3>
        <p style={{color:'#7a6f5e',fontSize:14,lineHeight:1.5}}>Les rappels sont envoyés automatiquement à l'heure définie.<br/>Adresse : <strong>{session.user.email}</strong></p>
      </div>
      <div style={s.settingsCard}>
        <h3 style={s.settingsCardTitle}>🟩 Matrice d'Eisenhower</h3>
        {Object.entries(Q).map(([k,v]) => (
          <div key={k} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
            <span style={{width:12,height:12,borderRadius:'50%',background:v.color,flexShrink:0}} />
            <span style={{fontWeight:500}}>{v.label}</span>
            <span style={{color:'#9a8f7a',fontSize:13}}> — {v.desc}</span>
          </div>
        ))}
      </div>
      <button style={{...s.btnGhost,marginTop:8}} onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </div>
  )
}

/* ──────────────────── MAIN APP ──────────────────── */
export default function App() {
  const [session, setSession]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [notes, setNotes]           = useState([])
  const [categories, setCategories] = useState([])
  const [tab, setTab]               = useState('notes')
  const [modal, setModal]           = useState(null)
  const [filterQ, setFilterQ]       = useState(0)
  const [filterCat, setFilterCat]   = useState(null)
  const [search, setSearch]         = useState('')

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

  const fetchSettings = useCallback(async () => {
  if (!session) return
  const { data } = await supabase.from('user_settings').select('*').eq('user_id', session.user.id).single()
  
  if (data?.categories) {
    // On trie ici aussi pour l'affichage au démarrage
    const sorted = [...data.categories].sort((a, b) => a.name.localeCompare(b.name))
    setCategories(sorted)
  }
}, [session])

  useEffect(() => { fetchNotes(); fetchSettings() }, [fetchNotes, fetchSettings])

  const saveCategories = async (newCats) => {
  setCategories(newCats)
  await supabase.from('user_settings').upsert({ 
    user_id: session.user.id, 
    categories: newCats 
  })
}

  const saveNote = async (payload) => {
  const type = tab === 'simple_notes' ? 'note' : 'task';
  const { id, ...dataToSave } = payload;
  
  const finalData = { ...dataToSave, type: id ? undefined : type }; // On garde le type d'origine si c'est un edit

  if (id) {
    await supabase.from('notes').update({...finalData, updated_at:new Date().toISOString()}).eq('id',id)
  } else {
    await supabase.from('notes').insert({...finalData, type, user_id:session.user.id})
  }
  await fetchNotes(); setModal(null)
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

  const filtered = notes
  .filter(n => {
    if (tab === 'notes') return n.type === 'task';
    if (tab === 'simple_notes') return n.type === 'note';
    return true; // Pour le calendrier
  })
  .filter(n => filterQ === 0 || n.importance === filterQ)
  .filter(n => !filterCat || (n.cats || []).includes(filterCat))
  .filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()))
  
  return (
    <div style={s.app}>
      <header style={s.header}>
        <h1 style={s.logo}>Mémo</h1>
        <nav style={s.nav}>
  {[
    ['notes', '📋 Tâches'],        // L'ancien "Notes" devient "Tâches"
    ['simple_notes', '📝 Notes'], // Le nouveau coin pour les notes simples
    ['calendar', '📅 Calendrier'], 
    ['settings', '⚙️']
  ].map(([id, label]) => (
    <button key={id} style={{...s.navBtn,...(tab===id?s.navBtnActive:{})}} onClick={() => setTab(id)}>{label}</button>
  ))}
</nav>
      </header>

      <main style={s.main}>
  {/* ON DIT AU CODE : Affiche ce bloc pour les Tâches OU pour les Notes */}
  {(tab === 'notes' || tab === 'simple_notes') && (
    <>
      <div style={s.toolbar}>
        <input 
          style={{...s.input, flex: 1, height: 38}} 
          placeholder="Rechercher…" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <button style={{...s.btn, whiteSpace: 'nowrap'}} onClick={() => setModal('new')}>
          ＋ {tab === 'simple_notes' ? 'Note' : 'Tâche'}
        </button>
      </div>

      {/* On n'affiche la ligne Priorité QUE si on est dans l'onglet Tâches ('notes') */}
{tab === 'notes' && (
  <div style={{display: 'flex', gap: 5, marginBottom: 7, flexWrap: 'wrap', alignItems: 'center'}}>
    <span style={s.filterLabel}>Priorité</span>
    {[[0, 'Toutes'], [1, '🔴 À Faire maintenant'], [2, '🔵 À Planifier'], [3, '🟡 À Déléguer'], [4, '🟢 À méditer']].map(([k, label]) => (
      <button 
        key={k} 
        style={{...s.filterBtn, ...(filterQ === k ? {background: k === 0 ? '#1a1208' : Q[k]?.color, color: '#fff'} : {})}} 
        onClick={() => setFilterQ(k)}
      >
        {label}
      </button>
    ))}
  </div>
)}

      <div style={{display: 'flex', gap: 5, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center'}}>
        <span style={s.filterLabel}>Catégorie</span>
        <button 
          onClick={() => setFilterCat(null)} 
          style={{...s.filterBtn, ...(filterCat === null ? {background: '#1a1208', color: '#fff'} : {})}}
        >
          Toutes
        </button>
        {categories.map(c => (
          <button 
            key={c.id} 
            onClick={() => setFilterCat(filterCat === c.id ? null : c.id)} 
            style={{
              background: filterCat === c.id ? c.color : c.color + '15', 
              color: filterCat === c.id ? '#fff' : c.color, 
              border: `1px solid ${c.color}55`, 
              borderRadius: 20, padding: '3px 11px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={{fontSize: 40}}>📝</p>
          <p style={{color: '#9a8f7a', marginTop: 8}}>Rien ici pour le moment.</p>
        </div>
      ) : (
        <div style={s.noteGrid}>
          {filtered.map(n => (
            <NoteCard key={n.id} note={n} categories={categories} onEdit={setModal} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </>
  )}

  {tab === 'calendar' && <CalendarView notes={notes} />}
  {tab === 'settings' && <SettingsView session={session} categories={categories} onCategoriesChange={saveCategories} />}
</main>

     // Trouve cette ligne en bas du fichier et remplace-la par :
{modal && (
  <NoteModal 
    note={modal === 'new' ? null : modal} 
    categories={categories} 
    onSave={saveNote} 
    onClose={() => setModal(null)}
    onNewCategory={saveCategories}
    currentTab={tab} // <-- Ajoute cette ligne pour envoyer l'onglet actuel
  />
)}
    </div>
  )
}

const s = {
  app:         {display:'flex',flexDirection:'column',minHeight:'100vh',background:'#f8f6f1'},
  header:      {position:'sticky',top:0,zIndex:10,background:'#fff',borderBottom:'1px solid #e5e0d5',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',height:56,gap:16},
  logo:        {fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color:'#c9a84c',letterSpacing:'-0.5px',fontStyle:'italic',flexShrink:0},
  nav:         {display:'flex',gap:4},
  navBtn:      {background:'transparent',color:'#9a8f7a',padding:'6px 12px',borderRadius:8,fontSize:13,border:'none',cursor:'pointer',fontFamily:'inherit'},
  navBtnActive:{background:'#f0ece3',color:'#1a1208'},
  main:        {flex:1,maxWidth:860,width:'100%',margin:'0 auto',padding:'20px 16px 40px'},
  toolbar:     {display:'flex',gap:10,marginBottom:12},
  filterLabel: {fontSize:10,fontWeight:600,color:'#9a8f7a',textTransform:'uppercase',letterSpacing:'0.5px',marginRight:2,flexShrink:0},
  filterBtn:   {background:'#fff',border:'1px solid #e5e0d5',color:'#9a8f7a',padding:'3px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontFamily:'inherit'},
  noteGrid:    {display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:16},
  empty:       {textAlign:'center',marginTop:60},
  card:        {borderRadius:12,overflow:'hidden',border:'1px solid #e5e0d5',background:'#fff'},
  cardBanner:  {display:'flex',alignItems:'center',gap:8,padding:'8px 14px'},
  bannerEmoji: {fontSize:13},
  bannerLabel: {fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.95)',flex:1},
  bannerDesc:  {fontSize:9,color:'rgba(255,255,255,0.75)',background:'rgba(0,0,0,0.2)',padding:'2px 6px',borderRadius:10},
  cardBody:    {padding:'13px 15px 11px'},
  cardTitle:   {fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,color:'#1a1208',marginBottom:5},
  cardContent: {fontSize:12,color:'#7a6f5e',lineHeight:1.5,marginBottom:8,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'},
  cardFooter:  {display:'flex',alignItems:'center',justifyContent:'space-between',gap:8},
  reminderBadge:{fontSize:10,fontWeight:500},
  cardActions: {display:'flex',gap:4},
  overlay:     {position:'fixed',inset:0,background:'rgba(0,0,0,0.35)',backdropFilter:'blur(4px)',zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16},
  modal:       {background:'#fff',border:'1px solid #e5e0d5',borderRadius:16,width:'100%',maxWidth:520,maxHeight:'90vh',overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:'0 20px 60px rgba(0,0,0,0.15)'},
  modalHeader: {display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px'},
  modalBody:   {flex:1,overflowY:'auto',padding:'18px 18px 0',display:'flex',flexDirection:'column',gap:12},
  modalFooter: {display:'flex',justifyContent:'flex-end',gap:10,padding:18,borderTop:'1px solid #f0ece3'},
  label:       {fontSize:11,fontWeight:600,color:'#9a8f7a',letterSpacing:'0.5px',textTransform:'uppercase'},
  input:       {background:'#f8f6f1',border:'1px solid #e5e0d5',borderRadius:8,color:'#1a1208',padding:'9px 12px',fontSize:14,width:'100%',fontFamily:'inherit'},
  textarea:    {resize:'vertical',minHeight:90},
  quadGrid:    {display:'grid',gridTemplateColumns:'1fr 1fr',gap:8},
  quadBtn:     {background:'#f8f6f1',border:'2px solid',borderRadius:10,padding:'10px 8px',cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:4,textAlign:'center',fontFamily:'inherit'},
  notifRow:    {display:'flex',gap:20},
  checkLabel:  {display:'flex',alignItems:'center',gap:6,fontSize:13,color:'#9a8f7a',cursor:'pointer'},
  btn:         {background:'#c9a84c',color:'#13100a',fontWeight:700,fontSize:13,padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontFamily:'inherit'},
  btnGhost:    {background:'transparent',border:'1px solid #e5e0d5',color:'#9a8f7a',fontSize:13,padding:'8px 18px',borderRadius:8,cursor:'pointer',fontFamily:'inherit'},
  iconBtn:     {background:'transparent',color:'#9a8f7a',fontSize:18,padding:'2px 6px',borderRadius:6,cursor:'pointer',border:'none',fontFamily:'inherit'},
  calWrap:     {animation:'fadeIn 0.3s ease'},
  calHeader:   {display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,padding:'0 4px'},
  calGrid:     {display:'grid',gridTemplateColumns:'repeat(7, 1fr)',gap:4},
  calDayHeader:{textAlign:'center',fontSize:10,fontWeight:600,color:'#9a8f7a',padding:'4px 0',textTransform:'uppercase'},
  calCell:     {minHeight:72,borderRadius:8,padding:6,display:'flex',flexDirection:'column',gap:3},
  calDayNum:   {fontSize:11,fontWeight:500,marginBottom:2},
  calDot:      {fontSize:9,color:'#fff',borderRadius:4,padding:'2px 4px',overflow:'hidden',whiteSpace:'nowrap',lineHeight:1.4},
  settingsWrap:{maxWidth:500,animation:'fadeIn 0.3s ease'},
  sectionTitle:{fontFamily:'var(--font-display)',fontSize:24,fontWeight:700,marginBottom:20,color:'#c9a84c',fontStyle:'italic'},
  settingsCard:{background:'#fff',border:'1px solid #e5e0d5',borderRadius:12,padding:'18px 20px',marginBottom:12},
  settingsCardTitle:{fontSize:15,fontWeight:600,marginBottom:12,color:'#1a1208'},
  authWrap:    {minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:20,background:'#f8f6f1'},
  authCard:    {background:'#fff',border:'1px solid #e5e0d5',borderRadius:20,padding:'36px 32px',width:'100%',maxWidth:380,boxShadow:'0 8px 32px rgba(0,0,0,0.08)'},
  authTitle:   {fontFamily:'var(--font-display)',fontSize:36,fontWeight:700,color:'#c9a84c',textAlign:'center',marginBottom:4,fontStyle:'italic'},
  authSub:     {textAlign:'center',color:'#9a8f7a',marginBottom:28,fontSize:14},
  authFields:  {display:'flex',flexDirection:'column',gap:12,marginBottom:16},
  authToggle:  {background:'transparent',color:'#9a8f7a',fontSize:13,marginTop:12,width:'100%',textDecoration:'underline',cursor:'pointer',border:'none',fontFamily:'inherit'},
  errorTxt:    {color:'#dc2626',fontSize:13,marginBottom:8},
  successTxt:  {color:'#16a34a',fontSize:13,marginBottom:8},
}
