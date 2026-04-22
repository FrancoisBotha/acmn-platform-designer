import { useCallback, useRef, useState } from 'react'
import type { Node } from '@xyflow/react'
import { FormProvider, Controller } from 'react-hook-form'
import { connectorSchema } from '@/lib/validation'
import { useValidatedPropertyForm } from '@/hooks/useValidatedPropertyForm'
import {
  ValidatedTextInput,
  ValidatedTextarea,
  ValidatedNumberInput,
  FieldLabel,
  FieldError,
} from './ValidatedFields'
import { FieldLabel as HelpFieldLabel } from './HelpTooltip'

const CONNECTOR_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'file-watch', label: 'File Watch' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'database', label: 'Database' },
  { value: 'event', label: 'Event' },
  { value: 'api', label: 'API' },
] as const

type ConnectorType = (typeof CONNECTOR_TYPES)[number]['value']

const inputClass = 'w-full rounded border border-border bg-background px-2 py-1 text-sm'

function FieldGroup({ label, tooltip, children }: { label: string; tooltip?: string; children: React.ReactNode }) {
  return (
    <div>
      <HelpFieldLabel label={label} tooltip={tooltip} />
      {children}
    </div>
  )
}

function EmailSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="SMTP Host" tooltip="Hostname of the SMTP server for sending email">
        <input
          className={inputClass}
          value={(config.smtpHost as string) ?? ''}
          placeholder="smtp.example.com"
          onChange={(e) => onChange({ smtpHost: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="SMTP Port" tooltip="Port number for the SMTP connection (commonly 587 or 465)">
        <input
          type="number"
          className={inputClass}
          value={(config.smtpPort as number) ?? 587}
          min={1}
          max={65535}
          onChange={(e) => onChange({ smtpPort: parseInt(e.target.value, 10) || 587 })}
        />
      </FieldGroup>
      <FieldGroup label="Auth Method" tooltip="Authentication method used to connect to the SMTP server">
        <select
          className={inputClass}
          value={(config.authMethod as string) ?? 'none'}
          onChange={(e) => onChange({ authMethod: e.target.value })}
        >
          <option value="none">None</option>
          <option value="plain">Plain</option>
          <option value="login">Login</option>
          <option value="oauth2">OAuth2</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Username" tooltip="Username or email address for SMTP authentication">
        <input
          className={inputClass}
          value={(config.username as string) ?? ''}
          placeholder="user@example.com"
          onChange={(e) => onChange({ username: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Use TLS" tooltip="Whether to encrypt the SMTP connection with TLS">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={(config.useTls as boolean) ?? true}
            onChange={(e) => onChange({ useTls: e.target.checked })}
          />
          Enable TLS encryption
        </label>
      </FieldGroup>
    </>
  )
}

function WebhookSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="URL" tooltip="The webhook endpoint URL that will receive incoming signals">
        <input
          className={inputClass}
          value={(config.url as string) ?? ''}
          placeholder="https://example.com/webhook"
          onChange={(e) => onChange({ url: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="HTTP Method" tooltip="HTTP method used when calling the webhook endpoint">
        <select
          className={inputClass}
          value={(config.method as string) ?? 'POST'}
          onChange={(e) => onChange({ method: e.target.value })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Headers (JSON)" tooltip="Custom HTTP headers sent with webhook requests as a JSON object">
        <textarea
          className={`${inputClass} resize-y min-h-[60px]`}
          value={(config.headers as string) ?? ''}
          placeholder='{"Authorization": "Bearer ..."}'
          onChange={(e) => onChange({ headers: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Secret Token" tooltip="Shared secret used to verify the authenticity of webhook payloads">
        <input
          className={inputClass}
          type="password"
          value={(config.secretToken as string) ?? ''}
          placeholder="Webhook signing secret"
          onChange={(e) => onChange({ secretToken: e.target.value })}
        />
      </FieldGroup>
    </>
  )
}

function FileWatchSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="Watch Path" tooltip="Filesystem directory path to monitor for new or changed files">
        <input
          className={inputClass}
          value={(config.watchPath as string) ?? ''}
          placeholder="/data/inbox"
          onChange={(e) => onChange({ watchPath: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="File Pattern" tooltip="Glob pattern to filter which files trigger the connector (e.g. *.csv)">
        <input
          className={inputClass}
          value={(config.filePattern as string) ?? ''}
          placeholder="*.csv"
          onChange={(e) => onChange({ filePattern: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Recursive" tooltip="Whether to watch subdirectories within the watch path">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={(config.recursive as boolean) ?? false}
            onChange={(e) => onChange({ recursive: e.target.checked })}
          />
          Watch subdirectories
        </label>
      </FieldGroup>
      <FieldGroup label="Polling Interval (s)" tooltip="How often (in seconds) the directory is checked for changes">
        <input
          type="number"
          className={inputClass}
          value={(config.pollingInterval as number) ?? 30}
          min={1}
          onChange={(e) => onChange({ pollingInterval: parseInt(e.target.value, 10) || 30 })}
        />
      </FieldGroup>
    </>
  )
}

function ScheduleSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="Cron Expression" tooltip="Cron schedule expression defining when signals are emitted (e.g. 0 */5 * * *)">
        <input
          className={inputClass}
          value={(config.cronExpression as string) ?? ''}
          placeholder="0 */5 * * *"
          onChange={(e) => onChange({ cronExpression: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Timezone" tooltip="IANA timezone for evaluating the cron expression (e.g. UTC, America/New_York)">
        <input
          className={inputClass}
          value={(config.timezone as string) ?? ''}
          placeholder="UTC"
          onChange={(e) => onChange({ timezone: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Start Date" tooltip="Earliest date on which this schedule becomes active">
        <input
          type="date"
          className={inputClass}
          value={(config.startDate as string) ?? ''}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="End Date" tooltip="Date after which this schedule stops emitting signals">
        <input
          type="date"
          className={inputClass}
          value={(config.endDate as string) ?? ''}
          onChange={(e) => onChange({ endDate: e.target.value })}
        />
      </FieldGroup>
    </>
  )
}

function DatabaseSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="Connection String" tooltip="Database connection URI including host, port, and database name">
        <input
          className={inputClass}
          value={(config.connectionString as string) ?? ''}
          placeholder="postgresql://host:5432/db"
          onChange={(e) => onChange({ connectionString: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Database Type" tooltip="The type of database to connect to">
        <select
          className={inputClass}
          value={(config.dbType as string) ?? 'postgresql'}
          onChange={(e) => onChange({ dbType: e.target.value })}
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="mssql">SQL Server</option>
          <option value="mongodb">MongoDB</option>
          <option value="sqlite">SQLite</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Query / Collection" tooltip="SQL query or collection name used to poll for new data">
        <textarea
          className={`${inputClass} resize-y min-h-[60px]`}
          value={(config.query as string) ?? ''}
          placeholder="SELECT * FROM events WHERE ..."
          onChange={(e) => onChange({ query: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Poll Interval (s)" tooltip="How often (in seconds) the database is queried for new records">
        <input
          type="number"
          className={inputClass}
          value={(config.pollInterval as number) ?? 60}
          min={1}
          onChange={(e) => onChange({ pollInterval: parseInt(e.target.value, 10) || 60 })}
        />
      </FieldGroup>
    </>
  )
}

function EventSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="Event Source" tooltip="The source system or application emitting events">
        <input
          className={inputClass}
          value={(config.eventSource as string) ?? ''}
          placeholder="my-app.events"
          onChange={(e) => onChange({ eventSource: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Event Type" tooltip="The specific event type to listen for (e.g. order.created)">
        <input
          className={inputClass}
          value={(config.eventType as string) ?? ''}
          placeholder="order.created"
          onChange={(e) => onChange({ eventType: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Channel / Topic" tooltip="Message broker channel or topic to subscribe to">
        <input
          className={inputClass}
          value={(config.channel as string) ?? ''}
          placeholder="orders-topic"
          onChange={(e) => onChange({ channel: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Consumer Group" tooltip="Consumer group name for coordinated event consumption">
        <input
          className={inputClass}
          value={(config.consumerGroup as string) ?? ''}
          placeholder="cpm-consumer-group"
          onChange={(e) => onChange({ consumerGroup: e.target.value })}
        />
      </FieldGroup>
    </>
  )
}

function ApiSubForm({
  config,
  onChange,
}: {
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}) {
  return (
    <>
      <FieldGroup label="Base URL" tooltip="The root URL of the API including version prefix">
        <input
          className={inputClass}
          value={(config.baseUrl as string) ?? ''}
          placeholder="https://api.example.com/v1"
          onChange={(e) => onChange({ baseUrl: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Endpoint Path" tooltip="Path appended to the base URL for this connector's requests">
        <input
          className={inputClass}
          value={(config.endpointPath as string) ?? ''}
          placeholder="/resources"
          onChange={(e) => onChange({ endpointPath: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="HTTP Method" tooltip="HTTP method used for API requests">
        <select
          className={inputClass}
          value={(config.method as string) ?? 'GET'}
          onChange={(e) => onChange({ method: e.target.value })}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Auth Type" tooltip="Authentication mechanism used to authorize API requests">
        <select
          className={inputClass}
          value={(config.authType as string) ?? 'none'}
          onChange={(e) => onChange({ authType: e.target.value })}
        >
          <option value="none">None</option>
          <option value="api-key">API Key</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="oauth2">OAuth2</option>
        </select>
      </FieldGroup>
      <FieldGroup label="Headers (JSON)" tooltip="Custom HTTP headers sent with every request as a JSON object">
        <textarea
          className={`${inputClass} resize-y min-h-[60px]`}
          value={(config.headers as string) ?? ''}
          placeholder='{"Accept": "application/json"}'
          onChange={(e) => onChange({ headers: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Rate Limit (req/min)" tooltip="Maximum number of requests per minute to avoid exceeding API limits">
        <input
          type="number"
          className={inputClass}
          value={(config.rateLimit as number) ?? 60}
          min={1}
          onChange={(e) => onChange({ rateLimit: parseInt(e.target.value, 10) || 60 })}
        />
      </FieldGroup>
    </>
  )
}

const SUB_FORM_MAP: Record<ConnectorType, React.ComponentType<{
  config: Record<string, unknown>
  onChange: (patch: Record<string, unknown>) => void
}>> = {
  email: EmailSubForm,
  webhook: WebhookSubForm,
  'file-watch': FileWatchSubForm,
  schedule: ScheduleSubForm,
  database: DatabaseSubForm,
  event: EventSubForm,
  api: ApiSubForm,
}

function hasSubFormData(config: Record<string, unknown>): boolean {
  return Object.values(config).some(
    (v) => v !== undefined && v !== null && v !== '' && v !== 0 && v !== false,
  )
}

export function ConnectorProperties({ node }: { node: Node }) {
  const { form } = useValidatedPropertyForm(connectorSchema, node.id)

  const connectorType = (form.watch('connectorType') ?? 'email') as ConnectorType
  const config = (form.watch('config') ?? {}) as Record<string, unknown>

  const [pendingType, setPendingType] = useState<ConnectorType | null>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      const current = form.getValues('config') as Record<string, unknown> ?? {}
      form.setValue('config', { ...current, ...patch }, { shouldValidate: true, shouldDirty: true })
    },
    [form],
  )

  const applyTypeSwitch = useCallback(
    (newType: ConnectorType) => {
      form.setValue('connectorType', newType, { shouldValidate: true, shouldDirty: true })
      form.setValue('config', {}, { shouldValidate: true, shouldDirty: true })
    },
    [form],
  )

  const handleTypeChange = useCallback(
    (newType: ConnectorType) => {
      if (newType === connectorType) return
      if (hasSubFormData(config)) {
        setPendingType(newType)
        confirmDialogRef.current?.showModal()
      } else {
        applyTypeSwitch(newType)
      }
    },
    [connectorType, config, applyTypeSwitch],
  )

  const confirmTypeSwitch = useCallback(() => {
    if (pendingType) {
      applyTypeSwitch(pendingType)
      setPendingType(null)
    }
    confirmDialogRef.current?.close()
  }, [pendingType, applyTypeSwitch])

  const cancelTypeSwitch = useCallback(() => {
    setPendingType(null)
    confirmDialogRef.current?.close()
  }, [])

  const SubForm = SUB_FORM_MAP[connectorType]

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <Controller
          name="connectorType"
          render={({ field, fieldState }) => (
            <div>
              <FieldLabel label="Connector Type" tooltip="The integration channel this connector uses to receive or send signals" />
              <select
                className={`${inputClass} ${fieldState.error ? 'border-red-500' : ''}`}
                value={field.value ?? 'email'}
                onChange={(e) => handleTypeChange(e.target.value as ConnectorType)}
                onBlur={field.onBlur}
              >
                {CONNECTOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <FieldError message={fieldState.error?.message} />
            </div>
          )}
        />

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Connection Configuration
          </p>
          <div className="space-y-3">
            {SubForm && (
              <SubForm config={config} onChange={updateConfig} />
            )}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Signal Processing
          </p>
          <div className="space-y-3">
            <ValidatedTextarea
              name="filterRules"
              label="Filter Rules"
              tooltip="Expression or JSON rules that filter which incoming signals are processed"
              placeholder="Filter expression or JSON rules"
            />

            <ValidatedTextarea
              name="fieldMapping"
              label="Field Mapping"
              tooltip="JSON mapping from source fields to target case-file item fields"
              placeholder='{"source_field": "target_field"}'
            />

            <ValidatedTextInput
              name="targetCpm"
              label="Target Case Plan Model"
              tooltip="The case plan model that receives signals from this connector"
              placeholder="Select target CPM"
            />

            <ValidatedNumberInput
              name="dailySignalLimit"
              label="Daily Signal Limit"
              tooltip="Maximum number of signals this connector may process per day (0 = unlimited)"
              min={0}
            />

            <Controller
              name="active"
              render={({ field }) => (
                <div>
                  <FieldLabel label="Active" tooltip="Whether this connector is currently accepting and processing signals" />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value ?? true}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                    Connector is active
                  </label>
                </div>
              )}
            />
          </div>
        </div>

        <dialog
          ref={confirmDialogRef}
          className="rounded-lg border border-border bg-background p-4 shadow-lg backdrop:bg-black/40 max-w-sm"
        >
          <h3 className="text-sm font-semibold mb-2">Change Connector Type?</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Switching the connector type will discard the current connection
            configuration. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="rounded px-3 py-1 text-sm border border-border hover:bg-accent"
              onClick={cancelTypeSwitch}
            >
              Cancel
            </button>
            <button
              className="rounded px-3 py-1 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmTypeSwitch}
            >
              Discard &amp; Switch
            </button>
          </div>
        </dialog>
      </div>
    </FormProvider>
  )
}
