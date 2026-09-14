'use client'

import { useCallback, useState } from 'react'

import { AttendanceList } from '@/components/crm/entries/attendance-list'
import { EventPicker } from '@/components/crm/entries/event-picker'
import { QrCamera } from '@/components/crm/entries/qr-camera'
import { ScanVerdict } from '@/components/crm/entries/scan-verdict'
import {
  ScannerModeToggle,
  type ScannerMode,
} from '@/components/crm/entries/scanner-mode-toggle'
import { useCheckInEntry, useRedeemEntry } from '@/hooks/use-entries'
import type { RedeemResult } from '@/lib/api/entries'

/** Control de acceso en la puerta (web#185 / server#278).
 *
 *  Dos caminos para el mismo acto: escanear el QR, o admitir por nombre desde la lista
 *  cuando la cámara no sirve. Los dos responden lo mismo, así que el veredicto se muestra
 *  con el mismo panel — el que decide es el backend, y esta pantalla sólo lo hace legible
 *  a un metro de distancia. */
export function ScannerScreen() {
  const [eventId, setEventId] = useState<string | null>(null)
  const [mode, setMode] = useState<ScannerMode>('escaner')
  const [result, setResult] = useState<RedeemResult | null>(null)

  const redeem = useRedeemEntry()
  const checkIn = useCheckInEntry(eventId)

  const handleToken = useCallback(
    (token: string) => {
      redeem.mutate({ token, eventId }, { onSuccess: setResult })
    },
    [redeem, eventId],
  )

  const handleCheckIn = useCallback(
    (entryId: string) => {
      checkIn.mutate(entryId, { onSuccess: setResult })
    },
    [checkIn],
  )

  const dismiss = useCallback(() => setResult(null), [])

  const openList = useCallback(() => {
    setResult(null)
    setMode('lista')
  }, [])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-3 p-4">
      <div>
        <h1 className="text-xl font-bold text-white">Entradas</h1>
        <p className="text-sm text-zinc-500">
          Escaneá el QR de la entrada y la pantalla te dice si pasa o no, y por qué.
        </p>
      </div>

      <EventPicker eventId={eventId} onChange={setEventId} />
      <ScannerModeToggle mode={mode} onChange={setMode} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {mode === 'escaner' ? (
          <QrCamera
            onToken={handleToken}
            result={result}
            pending={redeem.isPending}
            onDismiss={dismiss}
            onOpenList={openList}
          />
        ) : (
          <>
            <AttendanceList
              eventId={eventId}
              checkingIn={checkIn.isPending ? checkIn.variables : null}
              onCheckIn={handleCheckIn}
            />
            {result !== null && (
              <div className="absolute inset-x-0 top-0 z-10">
                <ScanVerdict result={result} onDismiss={dismiss} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
