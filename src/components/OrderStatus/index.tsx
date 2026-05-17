import { OrderStatus as StatusOptions } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  status: StatusOptions | 'shipped' | 'delivered'
  className?: string
}

export const OrderStatus: React.FC<Props> = ({ status, className }) => {
  return (
    <div
      className={cn(
        'text-xs tracking-widest font-mono uppercase py-0 px-2 rounded w-fit',
        className,
        {
          'bg-primary/10': status === 'processing',
          'bg-blue-500/15 text-blue-800 dark:text-blue-200': status === 'shipped',
          'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200': status === 'delivered',
          'bg-success': status === 'completed',
          'bg-destructive/10 text-destructive': status === 'cancelled',
          'bg-muted text-muted-foreground': status === 'refunded',
        },
      )}
    >
      {status}
    </div>
  )
}
