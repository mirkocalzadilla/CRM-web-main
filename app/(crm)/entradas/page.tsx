'use client'

import { ScannerScreen } from '@/components/crm/entries/scanner-screen'

/** Sin guarda de permisos a propósito: quien atiende la puerta suele ser `staff`, y es
 *  justamente el rol que necesita esta pantalla. El backend valida el tenant en cada
 *  escaneo. */
export default function EntradasPage() {
  return <ScannerScreen />
}
