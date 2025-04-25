import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { type Address, decodeEventLog } from 'viem'
import { AMAIPCM_ABI } from '../constants/abis'
import { AMAIPCM_ADDRESS } from '../constants/addresses'
import { getMatchesFromIPFS } from '../utils/ipfs'
import type { IPFSMatchData } from '../utils/ipfs'
import { Card } from './common/Card'

interface IPFSHistoryEntry {
  cid: string
  blockNumber: bigint
  timestamp: number
  content?: IPFSMatchData
}

export function IPFSHistory({ amaId }: { amaId: string }) {
  const [history, setHistory] = useState<IPFSHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchHistory() {
      if (!publicClient) {
        console.error('Public client not available')
        setIsLoading(false)
        return
      }

      try {
        // Get all MappingUpdated events
        const logs = await publicClient.getLogs({
          address: AMAIPCM_ADDRESS as Address,
          event: {
            type: 'event',
            name: 'MappingUpdated',
            inputs: [
              {
                indexed: false,
                name: 'value',
                type: 'string',
              },
            ],
          },
          fromBlock: 0n,
          toBlock: 'latest',
        })

        // Get block timestamps for each event
        const historyWithTimestamps = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({
              blockNumber: log.blockNumber,
            })

            const { args } = decodeEventLog({
              abi: AMAIPCM_ABI,
              data: log.data,
              topics: log.topics,
            })

            return {
              cid: (args as any).value as string,
              blockNumber: log.blockNumber,
              timestamp: Number(block.timestamp),
            }
          }),
        )

        // Sort by timestamp, most recent first
        setHistory(
          historyWithTimestamps.sort((a, b) => b.timestamp - a.timestamp),
        )
      } catch (error) {
        console.error('Error fetching IPFS history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [publicClient])

  // Load content for a specific CID
  const loadContent = async (cid: string) => {
    try {
      const content = await getMatchesFromIPFS(cid.replace('ipfs://', ''))
      setHistory((prev) =>
        prev.map((entry) =>
          entry.cid === cid ? { ...entry, content } : entry,
        ),
      )
      setExpandedEntry(cid)
    } catch (error) {
      console.error('Error loading content:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-gray-500">Loading history...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No version history available</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {history.map((entry, index) => (
            <li key={`${entry.blockNumber}-${index}`}>
              <Card className="bg-gray-50 overflow-hidden transition-all duration-200 p-0 shadow-none">
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Version {history.length - index}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(entry.timestamp * 1000).toLocaleString()}
                    </p>
                  </div>
                  {!entry.content ? (
                    <button
                      onClick={() => loadContent(entry.cid)}
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Load Content
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setExpandedEntry(
                          expandedEntry === entry.cid ? null : entry.cid,
                        )
                      }
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {expandedEntry === entry.cid
                        ? 'Hide Details'
                        : 'Show Details'}
                    </button>
                  )}
                </div>

                {/* Content */}
                {entry.content && expandedEntry === entry.cid && (
                  <div className="px-4 pb-4 border-t border-gray-100 bg-white">
                    <div className="pt-4 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Matches
                        </p>
                        <p className="text-sm">
                          {entry.content.matches.length} pairs
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          Submitter
                        </p>
                        <p className="text-sm">
                          {entry.content.metadata.submitter}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">
                          IPFS CID
                        </p>
                        <p className="text-sm font-mono text-gray-600">
                          {entry.cid}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Block</p>
                        <p className="text-sm">{entry.blockNumber.toString()}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
