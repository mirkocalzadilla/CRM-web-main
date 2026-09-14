// Single source of validation messages. UI copy in Spanish (Bolivian client).

export const validationMessages = {
  required: 'Campo requerido',
  email: 'Email inválido',
  phone: 'Teléfono inválido',
  slug: 'Identificador inválido (a-z, 0-9, guiones)',
  currency: 'Moneda inválida',
  priceRequired: 'Precio requerido',
  priceAmount: 'El precio debe ser mayor a 0',
  linkScheme: 'El link debe empezar con http:// o https://',
  linkSpaces: 'El link no puede tener espacios',
  noteMin: (min: number) =>
    `La nota es obligatoria: escribí al menos ${min} caracteres explicando el motivo`,
  maxLength: (max: number) => `Máximo ${max} caracteres`,
} as const
