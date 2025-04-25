'use client'

import { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '../utils/formatDate'
import type { QAItemProps } from '../types'
import { Card } from './common/Card'

const QAItem = memo(
  ({
    question,
    answer,
    thirdTierResponses = [],
    amaUser,
    userAvatar,
  }: QAItemProps) => {
    const handleProfileClick = (e: React.MouseEvent, fid: number) => {
      e.preventDefault()
      e.stopPropagation()
      window.location.href = `/profile/${fid}`
    }

    return (
      <Card className="space-y-6 w-full pointer-events-none p-0 shadow-none">
        {/* Question - Left side */}
        <div className="flex items-start gap-3 max-w-[80%]">
          <div
            onClick={(e) => handleProfileClick(e, question.author.fid)}
            className="relative z-50 flex-shrink-0 cursor-pointer pointer-events-auto"
          >
            <Image
              src={question.author.avatar_url || '/default-avatar.png'}
              alt={question.author.display_name}
              width={40}
              height={40}
              className="rounded-full hover:opacity-80 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/default-avatar.png'
              }}
            />
          </div>
          <div className="flex-1">
            <div className="message-bubble message-bubble-left">
              <div className="message-metadata mb-2">
                <div
                  onClick={(e) => handleProfileClick(e, question.author.fid)}
                  className="relative z-50 hover:text-purple-600 transition-colors inline-flex items-center gap-1 cursor-pointer pointer-events-auto"
                >
                  <span className="font-medium">
                    {question.author.display_name}
                  </span>
                  <span className="text-gray-500">
                    @{question.author.fname}
                  </span>
                </div>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-gray-500 text-sm">
                  {formatDate(question.timestamp)}
                </span>
              </div>
              <p className="question-text relative">{question.text}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <span>{question.reactions.recasts_count} recasts</span>
                <span>•</span>
                <span>{question.reactions.likes_count} likes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Answer - Right side */}
        {answer && (
          <div className="flex items-start gap-3 max-w-[80%] ml-auto">
            <div className="flex-1">
              <div className="message-bubble message-bubble-right">
                <div className="message-metadata mb-2 justify-end">
                  <div
                    onClick={(e) => handleProfileClick(e, amaUser.fid)}
                    className="relative z-50 hover:text-purple-600 transition-colors inline-flex items-center gap-1 cursor-pointer pointer-events-auto"
                  >
                    <span className="font-medium text-purple-900">
                      {amaUser.display_name}
                    </span>
                    <span className="text-purple-700">@{amaUser.fname}</span>
                  </div>
                  <span className="text-purple-400 mx-2">•</span>
                  <span className="text-purple-700 text-sm">
                    {formatDate(answer.timestamp)}
                  </span>
                </div>
                <p className="answer-text text-purple-900 relative">
                  {answer.text}
                </p>
                <div className="flex items-center gap-4 text-sm text-purple-700 mt-2 justify-end">
                  <span>{answer.reactions.recasts_count} recasts</span>
                  <span>•</span>
                  <span>{answer.reactions.likes_count} likes</span>
                </div>
              </div>
            </div>
            <div
              onClick={(e) => handleProfileClick(e, amaUser.fid)}
              className="relative z-50 flex-shrink-0 cursor-pointer pointer-events-auto"
            >
              <Image
                src={userAvatar || '/default-avatar.png'}
                alt={amaUser.display_name}
                width={40}
                height={40}
                className="rounded-full hover:opacity-80 transition-opacity"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/default-avatar.png'
                }}
              />
            </div>
          </div>
        )}

        {/* Third Tier Responses */}
        {thirdTierResponses.length > 0 && (
          <div className="space-y-4 pl-12">
            <h3 className="text-sm font-medium text-gray-500">Responses</h3>
            {thirdTierResponses.map((response) => (
              <div
                key={response.hash}
                className="flex items-start gap-3 max-w-[70%] ml-auto"
              >
                <div className="flex-1">
                  <div className="message-bubble message-bubble-third">
                    <div className="message-metadata mb-2 justify-end">
                      <div
                        onClick={(e) =>
                          handleProfileClick(e, response.author.fid)
                        }
                        className="relative z-50 hover:text-purple-600 transition-colors inline-flex items-center gap-1 cursor-pointer pointer-events-auto"
                      >
                        <span className="font-medium text-blue-900">
                          {response.author.display_name}
                        </span>
                        <span className="text-blue-700">
                          @{response.author.fname}
                        </span>
                      </div>
                      <span className="text-blue-400 mx-2">•</span>
                      <span className="text-blue-700 text-sm">
                        {formatDate(response.timestamp)}
                      </span>
                    </div>
                    <p className="response-text text-blue-900 relative">
                      {response.text}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-blue-700 mt-2 justify-end">
                      <span>{response.reactions.recasts_count} recasts</span>
                      <span>•</span>
                      <span>{response.reactions.likes_count} likes</span>
                    </div>
                  </div>
                </div>
                <div
                  onClick={(e) => handleProfileClick(e, response.author.fid)}
                  className="relative z-50 flex-shrink-0 cursor-pointer pointer-events-auto"
                >
                  <Image
                    src={response.author.avatar_url || '/default-avatar.png'}
                    alt={response.author.display_name}
                    width={40}
                    height={40}
                    className="rounded-full hover:opacity-80 transition-opacity"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/default-avatar.png'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    )
  },
)

QAItem.displayName = 'QAItem'

export default QAItem
