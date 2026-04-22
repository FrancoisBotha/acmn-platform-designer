import { useEffect, useRef, useCallback } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { useCanvasStore } from '@/state/canvasStore'
import { UpdateElementPropertiesCommand } from '@/state/commands'

const DEBOUNCE_MS = 500

export interface ValidatedPropertyForm<T extends Record<string, unknown>> {
  form: UseFormReturn<T>
  commitNow: () => void
}

export function useValidatedPropertyForm<TSchema extends z.ZodType>(
  schema: TSchema,
  nodeId: string,
): ValidatedPropertyForm<z.infer<TSchema>> {
  type FormValues = z.infer<TSchema>

  const pushCommand = useCanvasStore((s) => s.pushCommand)

  const nodeData = useCanvasStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId)
    return (node?.data ?? {}) as Record<string, unknown>
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: nodeData as FormValues,
    mode: 'onChange',
  })

  const sessionStartRef = useRef<Record<string, unknown> | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const justCommittedRef = useRef(false)
  const prevNodeDataRef = useRef(nodeData)

  const doCommit = useCallback(
    (currentValues: Record<string, unknown>) => {
      if (!sessionStartRef.current) return
      const oldProps: Record<string, unknown> = {}
      const newProps: Record<string, unknown> = {}
      const start = sessionStartRef.current
      const allKeys = new Set([...Object.keys(currentValues), ...Object.keys(start)])
      for (const key of allKeys) {
        const cur = currentValues[key]
        const old = start[key]
        if (JSON.stringify(cur) !== JSON.stringify(old)) {
          oldProps[key] = old
          newProps[key] = cur
        }
      }
      if (Object.keys(newProps).length === 0) {
        sessionStartRef.current = null
        return
      }
      justCommittedRef.current = true
      pushCommand(new UpdateElementPropertiesCommand(nodeId, newProps, oldProps))
      sessionStartRef.current = null
    },
    [nodeId, pushCommand],
  )

  const doCommitRef = useRef(doCommit)
  doCommitRef.current = doCommit

  const commitNow = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (sessionStartRef.current) {
      const values = form.getValues() as Record<string, unknown>
      const result = schema.safeParse(values)
      if (result.success) {
        doCommitRef.current(values)
      }
      sessionStartRef.current = null
    }
  }, [form, schema])

  useEffect(() => {
    const subscription = form.watch(() => {
      if (!sessionStartRef.current) {
        sessionStartRef.current = { ...prevNodeDataRef.current }
      }
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const currentValues = form.getValues() as Record<string, unknown>
        const result = schema.safeParse(currentValues)
        if (result.success) {
          doCommitRef.current(currentValues)
        }
      }, DEBOUNCE_MS)
    })

    return () => {
      subscription.unsubscribe()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (sessionStartRef.current) {
        const values = form.getValues() as Record<string, unknown>
        const result = schema.safeParse(values)
        if (result.success) {
          doCommitRef.current(values)
        }
        sessionStartRef.current = null
      }
    }
  }, [form, schema])

  useEffect(() => {
    if (nodeData === prevNodeDataRef.current) return
    prevNodeDataRef.current = nodeData

    if (justCommittedRef.current) {
      justCommittedRef.current = false
      return
    }

    form.reset(nodeData as FormValues)
    sessionStartRef.current = null
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [nodeData, form])

  return { form, commitNow }
}
