import { useCallback, useRef, useState } from 'react'
import type { Node } from '@xyflow/react'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'

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
const labelClass = 'block text-xs font-medium mb-1'

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
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
      <FieldGroup label="SMTP Host">
        <input
          className={inputClass}
          value={(config.smtpHost as string) ?? ''}
          placeholder="smtp.example.com"
          onChange={(e) => onChange({ smtpHost: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="SMTP Port">
        <input
          type="number"
          className={inputClass}
          value={(config.smtpPort as number) ?? 587}
          min={1}
          max={65535}
          onChange={(e) => onChange({ smtpPort: parseInt(e.target.value, 10) || 587 })}
        />
      </FieldGroup>
      <FieldGroup label="Auth Method">
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
      <FieldGroup label="Username">
        <input
          className={inputClass}
          value={(config.username as string) ?? ''}
          placeholder="user@example.com"
          onChange={(e) => onChange({ username: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Use TLS">
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
      <FieldGroup label="URL">
        <input
          className={inputClass}
          value={(config.url as string) ?? ''}
          placeholder="https://example.com/webhook"
          onChange={(e) => onChange({ url: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="HTTP Method">
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
      <FieldGroup label="Headers (JSON)">
        <textarea
          className={`${inputClass} resize-y min-h-[60px]`}
          value={(config.headers as string) ?? ''}
          placeholder='{"Authorization": "Bearer ..."}'
          onChange={(e) => onChange({ headers: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Secret Token">
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
      <FieldGroup label="Watch Path">
        <input
          className={inputClass}
          value={(config.watchPath as string) ?? ''}
          placeholder="/data/inbox"
          onChange={(e) => onChange({ watchPath: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="File Pattern">
        <input
          className={inputClass}
          value={(config.filePattern as string) ?? ''}
          placeholder="*.csv"
          onChange={(e) => onChange({ filePattern: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Recursive">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={(config.recursive as boolean) ?? false}
            onChange={(e) => onChange({ recursive: e.target.checked })}
          />
          Watch subdirectories
        </label>
      </FieldGroup>
      <FieldGroup label="Polling Interval (s)">
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
      <FieldGroup label="Cron Expression">
        <input
          className={inputClass}
          value={(config.cronExpression as string) ?? ''}
          placeholder="0 */5 * * *"
          onChange={(e) => onChange({ cronExpression: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Timezone">
        <input
          className={inputClass}
          value={(config.timezone as string) ?? ''}
          placeholder="UTC"
          onChange={(e) => onChange({ timezone: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Start Date">
        <input
          type="date"
          className={inputClass}
          value={(config.startDate as string) ?? ''}
          onChange={(e) => onChange({ startDate: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="End Date">
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
      <FieldGroup label="Connection String">
        <input
          className={inputClass}
          value={(config.connectionString as string) ?? ''}
          placeholder="postgresql://host:5432/db"
          onChange={(e) => onChange({ connectionString: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Database Type">
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
      <FieldGroup label="Query / Collection">
        <textarea
          className={`${inputClass} resize-y min-h-[60px]`}
          value={(config.query as string) ?? ''}
          placeholder="SELECT * FROM events WHERE ..."
          onChange={(e) => onChange({ query: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Poll Interval (s)">
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
      <FieldGroup label="Event Source">
        <input
          className={inputClass}
          value={(config.eventSource as string) ?? ''}
          placeholder="my-app.events"
          onChange={(e) => onChange({ eventSource: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Event Type">
        <input
          className={inputClass}
          value={(config.eventType as string) ?? ''}
          placeholder="order.created"
          onChange={(e) => onChange({ eventType: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Channel / Topic">
        <input
          className={inputClass}
          value={(config.channel as string) ?? ''}
          placeholder="orders-topic"
          onChange={(e) => onChange({ channel: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Consumer Group">
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
      <FieldGroup label="Base URL">
        <input
          className={inputClass}
          value={(config.baseUrl as string) ?? ''}
          placeholder="https://api.example.com/v1"
          onChange={(e) => onChange({ baseUrl: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Endpoint Path">
        <input
          className={inputClass}
          value={(config.endpointPath as string) ?? ''}
          placeholder="/resources"
          onChange={(e) => onChange({ endpointPath: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="HTTP Method">
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
      <FieldGroup label="Auth Type">
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
      <FieldGroup label="Headers (JSON)">
        <textarea
          className={`${inputClass} resize-y min-h-[60px]`}
          value={(config.headers as string) ?? ''}
          placeholder='{"Accept": "application/json"}'
          onChange={(e) => onChange({ headers: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Rate Limit (req/min)">
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
  const pushCommand = useCanvasStore((s) => s.pushCommand)
  const data = node.data as Record<string, unknown>

  const connectorType = (data.connectorSubType as ConnectorType) ?? 'email'
  const connectionConfig = (data.connectionConfig as Record<string, unknown>) ?? {}
  const filterRules = (data.filterRules as string) ?? ''
  const fieldMapping = (data.fieldMapping as string) ?? ''
  const targetCpm = (data.targetCpm as string) ?? ''
  const dailySignalLimit = (data.dailySignalLimit as number) ?? 0
  const active = (data.active as boolean) ?? true

  const [pendingType, setPendingType] = useState<ConnectorType | null>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  const updateProp = useCallback(
    (props: Record<string, unknown>) => {
      const oldProps: Record<string, unknown> = {}
      for (const key of Object.keys(props)) {
        oldProps[key] = data[key]
      }
      pushCommand(new UpdateElementPropertiesCommand(node.id, props, oldProps))
    },
    [node.id, data, pushCommand],
  )

  const updateConnectionConfig = useCallback(
    (patch: Record<string, unknown>) => {
      const merged = { ...connectionConfig, ...patch }
      updateProp({ connectionConfig: merged })
    },
    [connectionConfig, updateProp],
  )

  const applyTypeSwitch = useCallback(
    (newType: ConnectorType) => {
      const elementTypeId = `connector-${newType}`
      updateProp({
        connectorSubType: newType,
        elementType: elementTypeId,
        connectionConfig: {},
      })
    },
    [updateProp],
  )

  const handleTypeChange = useCallback(
    (newType: ConnectorType) => {
      if (newType === connectorType) return
      if (hasSubFormData(connectionConfig)) {
        setPendingType(newType)
        confirmDialogRef.current?.showModal()
      } else {
        applyTypeSwitch(newType)
      }
    },
    [connectorType, connectionConfig, applyTypeSwitch],
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
    <div className="space-y-4">
      <FieldGroup label="Connector Type">
        <select
          className={inputClass}
          value={connectorType}
          onChange={(e) => handleTypeChange(e.target.value as ConnectorType)}
        >
          {CONNECTOR_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </FieldGroup>

      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Connection Configuration
        </p>
        <div className="space-y-3">
          {SubForm && (
            <SubForm config={connectionConfig} onChange={updateConnectionConfig} />
          )}
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Signal Processing
        </p>
        <div className="space-y-3">
          <FieldGroup label="Filter Rules">
            <textarea
              className={`${inputClass} resize-y min-h-[60px]`}
              value={filterRules}
              placeholder="Filter expression or JSON rules"
              onChange={(e) => updateProp({ filterRules: e.target.value })}
            />
          </FieldGroup>

          <FieldGroup label="Field Mapping">
            <textarea
              className={`${inputClass} resize-y min-h-[60px]`}
              value={fieldMapping}
              placeholder='{"source_field": "target_field"}'
              onChange={(e) => updateProp({ fieldMapping: e.target.value })}
            />
          </FieldGroup>

          <FieldGroup label="Target Case Plan Model">
            <input
              className={inputClass}
              value={targetCpm}
              placeholder="Select target CPM"
              onChange={(e) => updateProp({ targetCpm: e.target.value })}
            />
          </FieldGroup>

          <FieldGroup label="Daily Signal Limit">
            <input
              type="number"
              className={inputClass}
              value={dailySignalLimit}
              min={0}
              onChange={(e) => updateProp({ dailySignalLimit: parseInt(e.target.value, 10) || 0 })}
            />
          </FieldGroup>

          <FieldGroup label="Active">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => updateProp({ active: e.target.checked })}
              />
              Connector is active
            </label>
          </FieldGroup>
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
  )
}
