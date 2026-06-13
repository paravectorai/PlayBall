import { useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { Badge } from '../../shared/ui/Badge'
import { teamRepo, seasonRepo } from '../../data/repositories'
import { navigate } from '../../router'
import { useTeams } from './useTeams'
import type { TeamRow } from '../../data/schema'

type FormMode = 'none' | 'create' | { edit: TeamRow }

interface TeamFormState {
  name: string
  abbreviation: string
}

function emptyForm(): TeamFormState {
  return { name: '', abbreviation: '' }
}

function validateForm(f: TeamFormState): Partial<Record<keyof TeamFormState, string>> {
  const errors: Partial<Record<keyof TeamFormState, string>> = {}
  if (!f.name.trim()) errors.name = 'Team name is required'
  if (!f.abbreviation.trim()) errors.abbreviation = 'Abbreviation is required'
  else if (f.abbreviation.trim().length > 5) errors.abbreviation = 'Max 5 characters'
  return errors
}

export function TeamListScreen() {
  const teams = useTeams()
  const [formMode, setFormMode] = useState<FormMode>('none')
  const [form, setForm] = useState<TeamFormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof TeamFormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setDeleteError(null)
    setFormMode('create')
  }

  function openEdit(team: TeamRow) {
    setForm({ name: team.name, abbreviation: team.abbreviation })
    setErrors({})
    setDeleteError(null)
    setFormMode({ edit: team })
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
        name: form.name.trim(),
        abbreviation: form.abbreviation.trim().toUpperCase(),
      }
      if (formMode === 'create') {
        await teamRepo.create(payload)
      } else if (typeof formMode === 'object' && 'edit' in formMode) {
        await teamRepo.update(formMode.edit.id, payload)
      }
      setFormMode('none')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(team: TeamRow) {
    setDeleteError(null)
    const seasons = await seasonRepo.findByTeam(team.id)
    if (seasons.length > 0) {
      setDeleteError(`Cannot delete "${team.name}" — it has ${seasons.length} season${seasons.length === 1 ? '' : 's'}. Remove all seasons first.`)
      return
    }
    await teamRepo.delete(team.id)
  }

  const isLoading = teams === undefined

  return (
    <div class="min-h-screen bg-background pb-24">
      {/* Header */}
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p class="text-white/60 text-xs font-medium uppercase tracking-wider">Stitch</p>
            <h1 class="text-white text-xl font-bold leading-tight">My Teams</h1>
          </div>
          {formMode === 'none' && (
            <Button
              size="sm"
              variant="secondary"
              class="border-white/40 text-white hover:bg-white/10"
              onClick={openCreate}
            >
              + New Team
            </Button>
          )}
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
        {/* Inline create form */}
        {formMode === 'create' && (
          <Card>
            <form onSubmit={handleSubmit} class="flex flex-col gap-3">
              <p class="text-sm font-semibold text-text-main">New Team</p>
              <Input
                label="Team name"
                placeholder="e.g. River City Raptors"
                value={form.name}
                onInput={(e) => setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))}
                error={errors.name}
                autoFocus
              />
              <Input
                label="Abbreviation"
                placeholder="e.g. RCR"
                value={form.abbreviation}
                onInput={(e) =>
                  setForm((f) => ({
                    ...f,
                    abbreviation: (e.target as HTMLInputElement).value.toUpperCase().slice(0, 5),
                  }))
                }
                error={errors.abbreviation}
                hint="Up to 5 characters — shown on scoreboard"
                maxLength={5}
              />
              <div class="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={saving} fullWidth>
                  {saving ? 'Saving…' : 'Create Team'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Delete error banner */}
        {deleteError && (
          <div class="rounded border border-clay/30 bg-clay/10 px-3 py-2 text-sm text-clay">
            {deleteError}
            <button
              class="ml-2 underline text-xs"
              onClick={() => setDeleteError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div class="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} class="h-16 rounded border border-border bg-surface animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && teams.length === 0 && formMode === 'none' && (
          <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span class="text-4xl">⚾</span>
            <p class="text-text-main font-semibold">No teams yet</p>
            <p class="text-sm text-gray-500 max-w-xs">
              Add your team to start tracking stats this season.
            </p>
            <Button size="md" onClick={openCreate}>
              Add Your Team
            </Button>
          </div>
        )}

        {/* Team list */}
        {!isLoading &&
          teams.map((team) => {
            const isEditing = typeof formMode === 'object' && 'edit' in formMode && formMode.edit.id === team.id

            if (isEditing) {
              return (
                <Card key={team.id}>
                  <form onSubmit={handleSubmit} class="flex flex-col gap-3">
                    <p class="text-sm font-semibold text-text-main">Edit Team</p>
                    <Input
                      label="Team name"
                      value={form.name}
                      onInput={(e) =>
                        setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
                      }
                      error={errors.name}
                      autoFocus
                    />
                    <Input
                      label="Abbreviation"
                      value={form.abbreviation}
                      onInput={(e) =>
                        setForm((f) => ({
                          ...f,
                          abbreviation: (e.target as HTMLInputElement).value.toUpperCase().slice(0, 5),
                        }))
                      }
                      error={errors.abbreviation}
                      maxLength={5}
                    />
                    <div class="flex gap-2 pt-1">
                      <Button type="submit" size="sm" disabled={saving} fullWidth>
                        {saving ? 'Saving…' : 'Save'}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              )
            }

            return (
              <Card key={team.id} padding={false}>
                <button
                  class="w-full flex items-center gap-3 p-4 text-left min-h-[64px] hover:bg-primary/5 rounded transition-colors"
                  onClick={() => navigate({ page: 'team', teamId: team.id })}
                >
                  <Badge variant="success" class="shrink-0 font-mono tracking-widest">
                    {team.abbreviation}
                  </Badge>
                  <span class="flex-1 font-semibold text-text-main">{team.name}</span>
                  <span class="text-gray-400 text-lg leading-none">›</span>
                </button>
                <div class="flex border-t border-border">
                  <button
                    class="flex-1 min-h-[44px] text-sm text-primary font-medium hover:bg-primary/5 transition-colors px-4 rounded-bl"
                    onClick={() => openEdit(team)}
                  >
                    Edit
                  </button>
                  <div class="w-px bg-border" />
                  <button
                    class="flex-1 min-h-[44px] text-sm text-clay font-medium hover:bg-clay/5 transition-colors px-4 rounded-br"
                    onClick={() => handleDelete(team)}
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
