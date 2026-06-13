import { useState } from 'preact/hooks'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { gameRepo } from '../../data/repositories'
import { defaultRuleset } from '../../domain/ruleset'
import { navigate } from '../../router'
import { useTeams } from '../team/useTeams'
import { useSeasons } from '../team/useSeasons'
import type { HomeAway } from '../../data/schema'

interface Props {
  teamId: string
  seasonId: string
}

interface GameFormState {
  opponent: string
  gameDate: string
  homeAway: HomeAway
  inningsScheduled: string
}

function todayISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function emptyForm(): GameFormState {
  return {
    opponent: '',
    gameDate: todayISO(),
    homeAway: 'home',
    inningsScheduled: '6',
  }
}

function validateForm(f: GameFormState): Partial<Record<keyof GameFormState, string>> {
  const errors: Partial<Record<keyof GameFormState, string>> = {}
  if (!f.opponent.trim()) errors.opponent = 'Opponent name is required'
  if (!f.gameDate) errors.gameDate = 'Game date is required'
  const innings = parseInt(f.inningsScheduled, 10)
  if (isNaN(innings) || innings < 1 || innings > 9)
    errors.inningsScheduled = 'Enter a number between 1 and 9'
  return errors
}

export function GameSetupScreen({ teamId, seasonId }: Props) {
  const teams = useTeams()
  const seasons = useSeasons(teamId)
  const [form, setForm] = useState<GameFormState>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof GameFormState, string>>>({})
  const [saving, setSaving] = useState(false)

  const team = teams?.find((t) => t.id === teamId)
  const season = seasons?.find((s) => s.id === seasonId)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    const errs = validateForm(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      const innings = parseInt(form.inningsScheduled, 10)
      await gameRepo.create({
        seasonId,
        opponent: form.opponent.trim(),
        gameDate: form.gameDate,
        homeAway: form.homeAway,
        inningsScheduled: innings,
        status: 'scheduled',
        ruleset: { ...defaultRuleset, scheduledInnings: innings },
      })
      navigate({ page: 'season', teamId, seasonId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="min-h-screen bg-background pb-24">
      {/* Header */}
      <header class="bg-primary px-4 pt-safe-top pb-4 sticky top-0 z-10">
        <div class="max-w-lg mx-auto">
          <button
            class="flex items-center gap-1 text-white/70 text-sm mb-2 min-h-[44px] -ml-1 px-1"
            onClick={() => navigate({ page: 'season', teamId, seasonId })}
          >
            <span class="text-base">‹</span>{' '}
            {season ? season.name : 'Season'}
          </button>
          <h1 class="text-white text-xl font-bold leading-tight">New Game</h1>
          {team && (
            <p class="text-white/60 text-sm mt-0.5">{team.name}</p>
          )}
        </div>
      </header>

      <div class="max-w-lg mx-auto px-4 pt-4">
        <Card>
          <form onSubmit={handleSubmit} class="flex flex-col gap-4">
            <Input
              label="Opponent"
              placeholder="e.g. Riverside Tigers"
              value={form.opponent}
              onInput={(e) =>
                setForm((f) => ({ ...f, opponent: (e.target as HTMLInputElement).value }))
              }
              error={errors.opponent}
              autoFocus
            />

            <Input
              label="Game date"
              type="date"
              value={form.gameDate}
              onInput={(e) =>
                setForm((f) => ({ ...f, gameDate: (e.target as HTMLInputElement).value }))
              }
              error={errors.gameDate}
            />

            {/* Home / Away toggle */}
            <div class="flex flex-col gap-1">
              <p class="text-sm font-medium text-text-main">Home or Away</p>
              <div class="flex gap-2">
                {(['home', 'away'] as HomeAway[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    class={[
                      'flex-1 min-h-[44px] text-sm font-medium rounded border transition-colors capitalize',
                      form.homeAway === option
                        ? 'bg-primary text-white border-primary'
                        : 'bg-surface text-text-main border-border hover:border-primary hover:text-primary',
                    ].join(' ')}
                    onClick={() => setForm((f) => ({ ...f, homeAway: option }))}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Innings scheduled"
              type="number"
              placeholder="6"
              value={form.inningsScheduled}
              onInput={(e) =>
                setForm((f) => ({
                  ...f,
                  inningsScheduled: (e.target as HTMLInputElement).value,
                }))
              }
              error={errors.inningsScheduled}
              min={1}
              max={9}
            />

            <div class="flex gap-2 pt-1">
              <Button type="submit" size="sm" disabled={saving} fullWidth>
                {saving ? 'Saving…' : 'Create Game'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate({ page: 'season', teamId, seasonId })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
