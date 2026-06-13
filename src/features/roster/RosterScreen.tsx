import { useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { Badge } from '../../shared/ui/Badge'
import { playerRepo } from '../../data/repositories'
import { navigate } from '../../router'
import { useTeams } from '../team/useTeams'
import { usePlayers } from './usePlayers'
import type { PlayerRow } from '../../data/schema'

const ALL_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH']

interface Props {
  teamId: string
}

interface PlayerFormState {
  firstName: string
  lastName: string
  jerseyNumber: string
  positions: string[]
  isActive: boolean
}

type FormMode = 'none' | 'create' | { edit: PlayerRow }

function emptyForm(): PlayerFormState {
  return { firstName: '', lastName: '', jerseyNumber: '', positions: [], isActive: true }
}

function formFromPlayer(p: PlayerRow): PlayerFormState {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    jerseyNumber: p.jerseyNumber,
    positions: [...p.positions],
    isActive: p.isActive === 1,
  }
}

function validateForm(f: PlayerFormState): Partial<Record<keyof PlayerFormState, string>> {
  const errors: Partial<Record<keyof PlayerFormState, string>> = {}
  if (!f.firstName.trim()) errors.firstName = 'First name is required'
  if (!f.lastName.trim()) errors.lastName = 'Last name is required'
  if (!f.jerseyNumber.trim()) errors.jerseyNumber = 'Jersey number is required'
  if (f.positions.length === 0) errors.positions = 'Select at least one position'
  return errors
}

function togglePosition(positions: string[], pos: string): string[] {
  return positions.includes(pos) ? positions.filter((p) => p !== pos) : [...positions, pos]
}

export function RosterScreen({ teamId }: Props) {
  const teams = useTeams()
  const players = usePlayers(teamId)
  const [formMode, setFormMode] = useState<FormMode>('none')
  const [form, setForm] = useState<PlayerFormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormState, string>>>({})
  const [saving, setSaving] = useState(false)

  const team = teams?.find((t) => t.id === teamId)

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setFormMode('create')
  }

  function openEdit(player: PlayerRow) {
    setForm(formFromPlayer(player))
    setErrors({})
    setFormMode({ edit: player })
  }

  function cancelForm() {
    setFormMode('none')
    setErrors({})
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    const errs = validateForm(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        jerseyNumber: form.jerseyNumber.trim(),
        positions: form.positions,
        isActive: form.isActive ? (1 as const) : (0 as const),
        teamId,
      }
      if (formMode === 'create') {
        await playerRepo.create(payload)
      } else if (typeof formMode === 'object' && 'edit' in formMode) {
        await playerRepo.update(formMode.edit.id, payload)
      }
      setFormMode('none')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(player: PlayerRow) {
    if (typeof formMode === 'object' && 'edit' in formMode && formMode.edit.id === player.id) {
      setFormMode('none')
    }
    await playerRepo.delete(player.id)
  }

  async function handleToggleActive(player: PlayerRow) {
    await playerRepo.setActive(player.id, player.isActive !== 1)
  }

  const isLoading = teams === undefined || players === undefined

  return (
    <div class="min-h-screen bg-background pb-24">
      {/* Header */}
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'team', teamId })}
          >
            <span class="text-base">‹</span> {team ? team.name : 'Team'}
          </button>
          <h1 class="text-white text-xl font-bold leading-tight">Roster</h1>
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
        {/* Section header */}
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">Players</h2>
          {formMode === 'none' && (
            <Button size="sm" variant="ghost" onClick={openCreate}>
              + Add Player
            </Button>
          )}
        </div>

        {/* Inline create form */}
        {formMode === 'create' && (
          <PlayerForm
            title="New Player"
            form={form}
            errors={errors}
            saving={saving}
            submitLabel="Add Player"
            onChange={setForm}
            onSubmit={handleSubmit}
            onCancel={cancelForm}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div class="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} class="h-20 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && players.length === 0 && formMode === 'none' && (
          <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span class="text-3xl">👤</span>
            <p class="text-text-main font-semibold">No players yet</p>
            <p class="text-sm text-gray-500 max-w-xs">
              Add players to the roster before creating a game lineup.
            </p>
            <Button size="md" onClick={openCreate}>
              Add a Player
            </Button>
          </div>
        )}

        {/* Player list */}
        {!isLoading &&
          players.map((player) => {
            const isEditing =
              typeof formMode === 'object' && 'edit' in formMode && formMode.edit.id === player.id

            if (isEditing) {
              return (
                <PlayerForm
                  key={player.id}
                  title="Edit Player"
                  form={form}
                  errors={errors}
                  saving={saving}
                  submitLabel="Save"
                  onChange={setForm}
                  onSubmit={handleSubmit}
                  onCancel={cancelForm}
                />
              )
            }

            return (
              <Card key={player.id} padding={false}>
                <div class="flex items-center gap-3 px-4 py-3 min-h-[64px]">
                  <div class="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span class="text-primary font-bold font-tnum text-sm">
                      {player.jerseyNumber}
                    </span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-text-main truncate">
                      {player.firstName} {player.lastName}
                    </p>
                    <p class="text-xs text-gray-500 truncate">
                      {player.positions.join(' · ')}
                    </p>
                  </div>
                  <button
                    class="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    onClick={() => handleToggleActive(player)}
                    title={player.isActive ? 'Mark inactive' : 'Mark active'}
                  >
                    <Badge variant={player.isActive ? 'success' : 'default'}>
                      {player.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </button>
                </div>
                <div class="flex border-t border-border">
                  <button
                    class="flex-1 min-h-[44px] text-sm text-primary font-medium hover:bg-primary/5 transition-colors px-4 rounded-bl"
                    onClick={() => openEdit(player)}
                  >
                    Edit
                  </button>
                  <div class="w-px bg-border" />
                  <button
                    class="flex-1 min-h-[44px] text-sm text-clay font-medium hover:bg-clay/5 transition-colors px-4 rounded-br"
                    onClick={() => handleDelete(player)}
                  >
                    Delete
                  </button>
                </div>
              </Card>
            )
          })}
      </div>
    </div>
  )
}

interface PlayerFormProps {
  title: string
  form: PlayerFormState
  errors: Partial<Record<keyof PlayerFormState, string>>
  saving: boolean
  submitLabel: string
  onChange: (updater: (f: PlayerFormState) => PlayerFormState) => void
  onSubmit: (e: Event) => void
  onCancel: () => void
}

function PlayerForm({
  title,
  form,
  errors,
  saving,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: PlayerFormProps) {
  return (
    <Card>
      <form onSubmit={onSubmit} class="flex flex-col gap-3">
        <p class="text-sm font-semibold text-text-main">{title}</p>

        <div class="flex gap-3">
          <div class="flex-1">
            <Input
              label="First name"
              placeholder="e.g. Jake"
              value={form.firstName}
              onInput={(e) =>
                onChange((f) => ({ ...f, firstName: (e.target as HTMLInputElement).value }))
              }
              error={errors.firstName}
              autoFocus
            />
          </div>
          <div class="flex-1">
            <Input
              label="Last name"
              placeholder="e.g. Rivera"
              value={form.lastName}
              onInput={(e) =>
                onChange((f) => ({ ...f, lastName: (e.target as HTMLInputElement).value }))
              }
              error={errors.lastName}
            />
          </div>
        </div>

        <Input
          label="Jersey number"
          placeholder="e.g. 12"
          value={form.jerseyNumber}
          onInput={(e) =>
            onChange((f) => ({ ...f, jerseyNumber: (e.target as HTMLInputElement).value }))
          }
          error={errors.jerseyNumber}
        />

        <div class="flex flex-col gap-1">
          <p class="text-sm font-medium text-text-main">Positions</p>
          <div class="flex flex-wrap gap-2">
            {ALL_POSITIONS.map((pos) => {
              const selected = form.positions.includes(pos)
              return (
                <button
                  key={pos}
                  type="button"
                  class={[
                    'min-h-[44px] min-w-[44px] px-3 text-sm font-medium rounded border transition-colors',
                    selected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface text-text-main border-border hover:border-primary hover:text-primary',
                  ].join(' ')}
                  onClick={() =>
                    onChange((f) => ({ ...f, positions: togglePosition(f.positions, pos) }))
                  }
                >
                  {pos}
                </button>
              )
            })}
          </div>
          {errors.positions && <p class="text-xs text-clay">{errors.positions}</p>}
        </div>

        <div class="flex items-center gap-3 py-1">
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            class={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              form.isActive ? 'bg-primary' : 'bg-gray-300',
            ].join(' ')}
            onClick={() => onChange((f) => ({ ...f, isActive: !f.isActive }))}
          >
            <span
              class={[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                form.isActive ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
          <span class="text-sm text-text-main">{form.isActive ? 'Active' : 'Inactive'}</span>
        </div>

        <div class="flex gap-2 pt-1">
          <Button type="submit" size="sm" disabled={saving} fullWidth>
            {saving ? 'Saving…' : submitLabel}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
