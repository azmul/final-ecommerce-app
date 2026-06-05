import clsx from 'clsx'

type Props = {
  id?: string
  message?: string
  as?: 'p' | 'span'
  className?: string
}

export const FormError: React.FC<Props> = ({ id, message, as, className }) => {
  const Element = as || 'p'

  if (!message) {
    return null
  }

  return (
    <Element className={clsx('text-error text-sm', className)} id={id} role="alert">
      {message}
    </Element>
  )
}
