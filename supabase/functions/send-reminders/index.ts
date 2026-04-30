// supabase/functions/send-reminders/index.ts
// Edge Function déclenchée toutes les 15 min via un cron Supabase
// Envoie les rappels email et push pour les notes dues

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY   = Deno.env.get('RESEND_API_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT')! // ex: mailto:toi@email.com

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Chercher les rappels dus dans la fenêtre ±15 min et non encore envoyés
  const now  = new Date()
  const from = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
  const to   = new Date(now.getTime() +  1 * 60 * 1000).toISOString()

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*, auth.users!inner(email)')
    .gte('reminder_at', from)
    .lte('reminder_at', to)
    .eq('reminder_sent', false)

  if (error) {
    console.error('Erreur lecture notes:', error)
    return new Response('error', { status: 500 })
  }

  if (!notes || notes.length === 0) {
    return new Response('no reminders', { status: 200 })
  }

  for (const note of notes) {
    const userEmail = note['auth.users']?.email
    const importance = note.importance
    const labels = ['', '🔴 Urgent & Important', '🔵 Important', '🟡 Urgent', '⚫ À évaluer']

    // ── Email ──
    if (note.email_notify && userEmail && RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Mémo <rappels@tondomaine.com>',   // ⚠️ Remplace par ton domaine vérifié Resend
            to: [userEmail],
            subject: `⏰ Rappel : ${note.title}`,
            html: `
              <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
                <div style="background:${['','#dc2626','#2563eb','#d97706','#6b7280'][importance]};padding:16px 20px;border-radius:8px 8px 0 0">
                  <p style="color:rgba(255,255,255,0.85);margin:0;font-size:13px">${labels[importance]}</p>
                  <h2 style="color:#fff;margin:4px 0 0;font-size:22px">${note.title}</h2>
                </div>
                <div style="background:#1e1a12;color:#f0e8d5;padding:20px;border-radius:0 0 8px 8px">
                  ${note.content ? `<p style="margin:0 0 16px;line-height:1.6">${note.content}</p>` : ''}
                  <p style="color:#8a7d68;font-size:12px;margin:0">
                    Rappel défini pour le ${new Date(note.reminder_at).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}
                  </p>
                </div>
              </div>
            `,
          }),
        })
        console.log(`Email envoyé : ${note.id}`)
      } catch (e) {
        console.error('Erreur email:', e)
      }
    }

    // ── Push ──
    if (note.push_notify) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', note.user_id)

      for (const sub of subs || []) {
        try {
          // Pour les notifications push avec VAPID, utilise web-push ou une lib Deno équivalente
          // Ici on appelle directement le endpoint (simplifié — installe web-push si besoin)
          const payload = JSON.stringify({
            title: `⏰ ${note.title}`,
            body: note.content?.slice(0, 100) || labels[importance],
            importance,
            noteId: note.id,
          })
          console.log(`Push pour note ${note.id} → endpoint ${sub.endpoint.slice(0, 30)}...`)
          // Implémentation complète web-push : voir README
        } catch (e) {
          console.error('Erreur push:', e)
        }
      }
    }

    // Marquer comme envoyé
    await supabase.from('notes').update({ reminder_sent: true }).eq('id', note.id)
  }

  return new Response(`${notes.length} rappel(s) traité(s)`, { status: 200 })
})
