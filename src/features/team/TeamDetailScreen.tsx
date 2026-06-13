import { useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { Badge } from '../../shared/ui/Badge'
import { teamRepo, seasonRepo } from '../../data/repositories'
import { navigate } from '../../router'
import { useTeams } from './useTeams'
import { useSeasons } from './useSeasons'
import type { SeasonRow } from '../../data/schema'

interface Props {
  teamId: string
}

type FormMode = 'none' | 'create' | { edit: SeasonRow }

interface SeasonFormState {
  name: string
  year: string
}

function emptyForm(): SeasonFormState {
  return { name: '', year: String(new Date().getFullYear()) }
}

function validateForm(f: SeasonFormState): Partial<Record<keyof SeasonFormState, string>> {
  const errors: Partial<Record<keyof SeasonFormState, string>> = {}
  if (!f.name.trim()) errors.name = 'Season name is required'
  const yr = parseInt(f.year, 10)
  if (isNaN(yr) || yr < 2020 || yr > 2040) errors.year = 'Enter a year between 2020 and 2040'
  return errors
}

export function TeamDetailScreen({ teamId }: Props) {
  const teams = useTeams()
  const seasons = useSeasons(teamId)
  const [formMode, setFormMode] = useState<FormMode>('none')
  const [form, setForm] = useState<SeasonFormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof SeasonFormState, string>>>({})
  const [saving, setSaving] = useState(false)
  const [editingTeam, setEditingTeam] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', abbreviation: '' })
  const [teamErrors, setTeamErrors] = useState<{ name?: string; abbreviation?: string }>({})
  const [teamSaving, setTeamSaving] = useState(false)

  const team = teams?.find((t) => t.id === teamId)

  function openCreate() {
    setForm(emptyForm())
    setErrors({})
    setFormMode('create')
  }

  function openEdit(season: SeasonRow) {
    setForm({ name: season.name, year: String(season.year) })
    setErrors({})
    setFormMode({ edit: season })
  }

  function cancelForm() {
    setFormMode('none')
    setErrors({})
  }

  function openTeamEdit() {
    if (!team) return
    setTeamForm({ name: team.name, abbreviation: team.abbreviation })
    setTeamErrors({})
    setEditingTeam(true)
  }

  function cancelTeamEdit() {
    setEditingTeam(false)
    setTeamErrors({})
  }

  async function handleSeasonSubmit(e: Event) {
    e.preventDefault()
    const errs = validateForm(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      const payload = { name: form.name.trim(), year: parseInt(form.year, 10), teamId }
      if (formMode === 'create') {
        await seasonRepo.create(payload)
      } else if (typeof formMode === 'object' && 'edit' in formMode) {
        await seasonRepo.update(formMode.edit.id, { name: payload.name, year: payload.year })
      }
      setFormMode('none')
    } finally {
      setSaving(false)
    }
  }

  async function handleTeamSave(e: Event) {
    e.preventDefault()
    const errs: { name?: string; abbreviation?: string } = {}
    if (!teamForm.name.trim()) errs.name = 'Team name is required'
    if (!teamForm.abbreviation.trim()) errs.abbreviation = 'Abbreviation is required'
    else if (teamForm.abbreviation.trim().length > 5) errs.abbreviation = 'Max 5 characters'
    if (Object.keys(errs).length > 0) {
      setTeamErrors(errs)
      return
    }
    setTeamSaving(true)
    try {
      await teamRepo.update(teamId, {
        name: teamForm.name.trim(),
        abbreviation: teamForm.abbreviation.trim().toUpperCase(),
      })
      setEditingTeam(false)
    } finally {
      setTeamSaving(false)
    }
  }

  async function handleSeasonDelete(season: SeasonRow) {
    await seasonRepo.delete(season.id)
    if (formMode !== 'none' && typeof formMode === 'object' && 'edit' in formMode && formMode.edit.id === season.id) {
      setFormMode('none')
    }
  }

  const isLoading = teams === undefined || seasons === undefined

  return (
    <div class="min-h-screen bg-background pb-24">
      {/* Header */}
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'teams' })}
          >
            <span class="text-base">‹</span> All Teams
          </button>

          {editingTeam ? (
            <form onSubmit={handleTeamSave} class="flex flex-col gap-2">
              <div class="flex gap-2">
                <div class="flex-1">
                  <input
                    class="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white text-xl font-bold placeholder:text-white/40 focus:outline-none focus:border-white"
                    value={teamForm.name}
                    onInput={(e) =>
                      setTeamForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
                    }
                    placeholder="Team name"
                    autoFocus
                  />
                  {teamErrors.name && <p class="text-xs text-clay/80 mt-0.5">{teamErrors.name}</p>}
                </div>
                <div class="w-20">
                  <input
                    class="w-full bg-white/10 border border-white/30 rounded px-2 py-1 text-white font-mono font-bold text-center placeholder:text-white/40 focus:outline-none focus:border-white"
                    value={teamForm.abbreviation}
                    onInput={(e) =>
                      setTeamForm((f) => ({
                        ...f,
                        abbreviation: (e.target as HTMLInputElement).value.toUpperCase().slice(0, 5),
                      }))
                    }
                    placeholder="ABR"
                    maxLength={5}
                  />
                  {teamErrors.abbreviation && (
                    <p class="text-xs text-clay/80 mt-0.5">{teamErrors.abbreviation}</p>
                  )}
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  type="submit"
                  disabled={teamSaving}
                  class="min-h-[36px] px-3 text-sm text-white border border-white/40 rounded font-medium hover:bg-white/10"
                >
                  {teamSaving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  class="min-h-[36px] px-3 text-sm text-white/70 rounded"
                  onClick={cancelTeamEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div class="flex items-center gap-3">
              <div class="flex-1">
                {team ? (
                  <>
                    <h1 class="text-white text-xl font-bold leading-tight">{team.name}</h1>
                    <Badge variant="success" class="mt-1 font-mono tracking-widest">
                      {team.abbreviation}
                    </Badge>
                  </>
                ) : (
                  <div class="h-7 w-40 bg-white/10 animate-pulse rounded" />
                )}
              </div>
              <button
                class="min-h-[44px] px-3 text-white/70 text-sm hover:text-white"
                onClick={openTeamEdit}
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4 flex flex-col gap-3">
        {/* Roster quick-nav */}
        <Card padding={false}>
          <button
            class="w-full flex items-center gap-3 px-4 py-3 min-h-[56px] text-left hover:bg-primary/5 rounded transition-colors"
            onClick={() => navigate({ page: 'roster', teamId })}
          >
            <span class="text-lg leading-none">👤</span>
            <span class="flex-1 font-semibold text-text-main text-sm">Roster</span>
            <span class="text-gray-400 text-lg leading-none">›</span>
          </button>
        </Card>

        {/* Seasons section header */}
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold uppercase tracking-wider text-gray-500">Seasons</h2>
          {formMode === 'none' && (
            <Button size="sm" variant="ghost" onClick={openCreate}>
              + New Season
            </Button>
          )}
        </div>

        {/* Inline create form */}
        {formMode === 'create' && (
          <Card>
            <form onSubmit={handleSeasonSubmit} class="flex flex-col gap-3">
              <p class="text-sm font-semibold text-text-main">New Season</p>
              <Input
                label="Season name"
                placeholder="e.g. Spring 2026"
                value={form.name}
                onInput={(e) =>
                  setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
                }
                error={errors.name}
                autoFocus
              />
              <Input
                label="Year"
                type="number"
                placeholder="2026"
                value={form.year}
                onInput={(e) =>
                  setForm((f) => ({ ...f, year: (e.target as HTMLInputElement).value }))
                }
                error={errors.year}
                min={2020}
                max={2040}
              />
              <div class="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={saving} fullWidth>
                  {saving ? 'Saving…' : 'Create Season'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
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
        {!isLoading && seasons.length === 0 && formMode === 'none' && (
          <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <span class="text-3xl">📋</span>
            <p class="text-text-main font-semibold">No seasons yet</p>
            <p class="text-sm text-gray-500 max-w-xs">
              Create a season to start adding games and tracking stats.
            </p>
            <Button size="md" onClick={openCreate}>
              Add a Season
            </Button>
          </div>
        )}

        {/* Season list */}
        {!isLoading &&
          seasons.map((season) => {
            const isEditing =
              typeof formMode === 'object' && 'edit' in formMode && formMode.edit.id === season.id

            if (isEditing) {
              return (
                <Card key={season.id}>
                  <form onSubmit={handleSeasonSubmit} class="flex flex-col gap-3">
                    <p class="text-sm font-semibold text-text-main">Edit Season</p>
                    <Input
                      label="Season name"
                      value={form.name}
                      onInput={(e) =>
                        setForm((f) => ({ ...f, name: (e.target as HTMLInputElement).value }))
                      }
                      error={errors.name}
                      autoFocus
                    />
                    <Input
                      label="Year"
                      type="number"
                      value={form.year}
                      onInput={(e) =>
                        setForm((f) => ({ ...f, year: (e.target as HTMLInputElement).value }))
                      }
                      error={errors.year}
                      min={2020}
                      max={2040}
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
              <Card key={season.id} padding={false}>
                <button
                  class="w-full flex items-center gap-3 px-4 py-3 min-h-[64px] text-left hover:bg-primary/5 rounded-t transition-colors"
                  onClick={() => navigate({ page: 'season', teamId, seasonId: season.id })}
                >
                  <div class="flex-1">
                    <p class="font-semibold text-text-main">{season.name}</p>
                    <p class="text-xs text-gray-500 font-tnum">{season.year}</p>
                  </div>
                  <Badge variant="default" class="font-tnum">
                    {season.year}
                  </Badge>
                  <span class="text-gray-400 text-lg leading-none">›</span>
                </button>
                <div class="flex border-t border-border">
                  <button
                    class="flex-1 min-h-[44px] text-sm text-primary font-medium hover:bg-primary/5 transition-colors px-4 rounded-bl"
                    onClick={() => openEdit(season)}
                  >
                    Edit
                  </button>
                  <div class="w-px bg-border" />
                  <button
                    class="flex-1 min-h-[44px] text-sm text-clay font-medium hover:bg-clay/5 transition-colors px-4 rounded-br"
                    onClick={() => handleSeasonDelete(season)}
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
