import type { Field, TextField } from 'payload'

/** Guest checkout uses phone — keep email optional and skip strict email validation. */
export function makeCustomerEmailOptionalText(fields: Field[]): Field[] {
  return fields.map((field): Field => {
    if (!('name' in field) || field.name !== 'customerEmail') {
      return field
    }

    const optionalEmailField: TextField = {
      name: 'customerEmail',
      type: 'text',
      required: false,
      ...('label' in field && field.label !== undefined ? { label: field.label } : {}),
      admin: {
        description: 'Optional. Phone-only guest orders use customer phone instead.',
      },
    }

    return optionalEmailField
  })
}
