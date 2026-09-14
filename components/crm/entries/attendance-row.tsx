'use client'

import { Ban, CircleCheck, Hand } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { formatTicketTime } from '@/lib/format'
import type { Attendee } from '@/lib/api/entries'

interface AttendanceRowProps {
  attendee: Attendee
  pending: boolean
  onCheckIn: (entryId: string) => void
}

/** Una persona de la lista. Tres estados posibles y cada uno se ve distinto: ya entró
 *  (con la marca de si fue escaneando o a mano), la entrada está anulada, o falta admitirla.
 *
 *  A las anuladas **no** se les ofrece el check-in: aparecen para poder decirle a alguien
 *  "tu entrada fue anulada" en vez de "no aparecés", no para dejarlas pasar a mano. */
export function AttendanceRow({ attendee, pending, onCheckIn }: AttendanceRowProps) {
  const revoked = attendee.revoked_at !== null
  const entered = attendee.used_at !== null

  return (
    <li className="flex items-center gap-3 border-b border-white/5 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-medium text-white">{attendee.lead_name}</p>
        {revoked && (
          <p className="flex items-center gap-1.5 text-sm text-rose-300">
            <Ban className="size-3.5 shrink-0" /> Entrada anulada
          </p>
        )}
        {!revoked && entered && attendee.used_at !== null && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-300">
            {attendee.used_manually ? (
              <Hand className="size-3.5 shrink-0" />
            ) : (
              <CircleCheck className="size-3.5 shrink-0" />
            )}
            {attendee.used_manually ? 'Pasó a mano' : 'Entró'} ·{' '}
            {formatTicketTime(attendee.used_at)}
          </p>
        )}
        {!revoked && !entered && <p className="text-sm text-zinc-500">Sin usar</p>}
      </div>

      {!revoked && !entered && (
        <Button
          onClick={() => onCheckIn(attendee.entry_id)}
          disabled={pending}
          className="h-12 shrink-0 bg-white px-5 text-base font-semibold text-black hover:bg-zinc-200"
        >
          {pending ? <Spinner className="size-5" /> : 'Dejar pasar'}
        </Button>
      )}
    </li>
  )
}
