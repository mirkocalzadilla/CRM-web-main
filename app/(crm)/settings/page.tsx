'use client'

import { ChangePasswordForm } from '@/components/crm/account/change-password-form'
import { ProfileCard } from '@/components/crm/account/profile-card'
import { PaymentSettingsCard } from '@/components/crm/settings/payment-settings-card'
import { usePermissions } from '@/hooks/use-permissions'

export default function SettingsPage() {
  const { canManagePayments } = usePermissions()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-12 p-8">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

      {/* Perfil — datos de la sesión activa, solo lectura (#139). */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-white">Perfil</h2>
        <p className="mb-6 text-sm text-zinc-500">Tu cuenta en esta organización.</p>
        <ProfileCard />
      </section>

      {/* Pagos — org-scoped: client_admin + platform_operator (#178). */}
      {canManagePayments && (
        <section>
          <h2 className="mb-1 text-lg font-semibold text-white">Pagos</h2>
          <p className="mb-6 text-sm text-zinc-500">
            Contra qué se validan los comprobantes que manda el lead y con qué QR se cobra.
          </p>
          <PaymentSettingsCard />
        </section>
      )}

      {/* Mi cuenta — disponible para cualquier usuario logueado. */}
      <section>
        <h2 className="mb-1 text-lg font-semibold text-white">Mi cuenta</h2>
        <p className="mb-6 text-sm text-zinc-500">Cambiá la contraseña de tu cuenta.</p>
        <ChangePasswordForm />
      </section>
    </div>
  )
}
