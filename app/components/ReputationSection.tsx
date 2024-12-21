import { UserReputation } from '../hooks/useAMAContract'

interface ReputationSectionProps {
  reputation?: UserReputation
  isLoading?: boolean
}

export function ReputationSection({
  reputation,
  isLoading,
}: ReputationSectionProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!reputation) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Reputation</h2>
        <p className="text-gray-500">No reputation data available</p>
      </div>
    )
  }

  const qualityLevel = getQualityLevel(reputation.qualityMultiplier)
  const cooldownRemaining = getCooldownRemaining(reputation.cooldownPeriod)

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Reputation</h2>
        <span className="text-3xl">
          {getReputationEmoji(reputation.effectiveScore)}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Base Score</span>
          <span className="font-bold">{reputation.baseScore.toString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Quality Level</span>
          <span className="font-bold text-purple-600">
            {getQualityLevel(reputation.qualityMultiplier)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Effective Score</span>
          <span className="font-bold">
            {reputation.effectiveScore.toString()}
          </span>
        </div>

        {cooldownRemaining > 0 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700">
              Cooldown: {formatCooldown(cooldownRemaining)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Privileges</h3>
        <ul className="space-y-2">
          {getPrivileges(reputation.effectiveScore).map((privilege, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <span className="mr-2">{privilege.unlocked ? '✅' : '🔒'}</span>
              {privilege.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function getQualityLevel(multiplier: bigint): string {
  if (multiplier >= 9500n) return '🌟 Elite'
  if (multiplier >= 9000n) return '💎 Diamond'
  if (multiplier >= 8500n) return '👑 Platinum'
  if (multiplier >= 8000n) return '🥇 Gold'
  if (multiplier >= 7500n) return '🥈 Silver'
  return '🥉 Bronze'
}

function getReputationEmoji(score: bigint): string {
  if (score >= 10000n) return '🌟'
  if (score >= 5000n) return '💎'
  if (score >= 2500n) return '👑'
  if (score >= 1000n) return '🏆'
  if (score >= 500n) return '🎯'
  return '🎮'
}

function getCooldownRemaining(cooldownPeriod: bigint): number {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return Number(cooldownPeriod > now ? cooldownPeriod - now : 0n)
}

function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}

function getPrivileges(
  score: bigint,
): { description: string; unlocked: boolean }[] {
  return [
    {
      description: 'Submit matches',
      unlocked: true,
    },
    {
      description: 'Reduced cooldown (30m)',
      unlocked: score >= 5000n,
    },
    {
      description: 'Submit multiple matches',
      unlocked: score >= 7500n,
    },
    {
      description: 'Create AMA contracts',
      unlocked: score >= 10000n,
    },
  ]
}
