import { Controller, useFormContext } from 'react-hook-form'

export function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <label className="flex items-center gap-1 text-xs font-medium mb-1">
      {label}
      {tooltip && (
        <span
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted text-[10px] cursor-help"
          title={tooltip}
        >
          i
        </span>
      )}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500">{message}</p>
}

function fieldBorderClass(hasError: boolean) {
  return hasError ? 'border-red-500' : 'border-border'
}

export function ValidatedTextInput({
  name,
  label,
  tooltip,
  placeholder,
  readOnly,
}: {
  name: string
  label: string
  tooltip?: string
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel label={label} tooltip={tooltip} />
          <input
            className={`w-full rounded border ${fieldBorderClass(!!fieldState.error)} bg-background px-2 py-1 text-sm`}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
            readOnly={readOnly}
          />
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}

export function ValidatedNumberInput({
  name,
  label,
  tooltip,
  min,
  max,
  step,
  placeholder,
}: {
  name: string
  label: string
  tooltip?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel label={label} tooltip={tooltip} />
          <input
            type="number"
            className={`w-full rounded border ${fieldBorderClass(!!fieldState.error)} bg-background px-2 py-1 text-sm`}
            value={field.value ?? ''}
            onChange={(e) => {
              const val = e.target.value
              field.onChange(val === '' ? undefined : parseFloat(val))
            }}
            onBlur={field.onBlur}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
          />
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}

export function ValidatedSelectInput({
  name,
  label,
  tooltip,
  options,
}: {
  name: string
  label: string
  tooltip?: string
  options: readonly { value: string; label: string }[]
}) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel label={label} tooltip={tooltip} />
          <select
            className={`w-full rounded border ${fieldBorderClass(!!fieldState.error)} bg-background px-2 py-1 text-sm`}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}

export function ValidatedTextarea({
  name,
  label,
  tooltip,
  placeholder,
  className,
}: {
  name: string
  label: string
  tooltip?: string
  placeholder?: string
  className?: string
}) {
  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel label={label} tooltip={tooltip} />
          <textarea
            className={`w-full rounded border ${fieldBorderClass(!!fieldState.error)} bg-background px-2 py-1 text-sm resize-y min-h-[60px] ${className ?? ''}`}
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={placeholder}
          />
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}

export function ValidatedSlider({
  name,
  label,
  tooltip,
  min,
  max,
  step,
}: {
  name: string
  label: string
  tooltip?: string
  min: number
  max: number
  step: number
}) {
  const { watch } = useFormContext()
  const value = watch(name) ?? min

  return (
    <Controller
      name={name}
      render={({ field, fieldState }) => (
        <div>
          <FieldLabel label={label} tooltip={tooltip} />
          <div className="flex items-center gap-2">
            <input
              type="range"
              className="flex-1"
              min={min}
              max={max}
              step={step}
              value={field.value ?? min}
              onChange={(e) => field.onChange(parseFloat(e.target.value))}
            />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {(typeof value === 'number' ? value : min).toFixed(1)}
            </span>
          </div>
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  )
}
