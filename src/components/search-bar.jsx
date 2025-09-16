'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Zap, Target } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import debounce from 'lodash.debounce'
import { Separator } from './ui/separator'

const SearchBar = ({ onSearch, searchResults = [], onSelectResult, onClearSearch }) => {
  const timeToWait = 300

  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const debouncedSearch = useMemo(
    () =>
      debounce(value => {
        if (value.trim()) {
          onSearch(value)
          setShowResults(true)
        } else {
          onClearSearch()
          setShowResults(false)
        }
      }, timeToWait),
    [onSearch, onClearSearch],
  )

  useEffect(() => {
    debouncedSearch(query)

    return () => {
      debouncedSearch.cancel()
    }
  }, [query, debouncedSearch])

  const handleSelectResult = result => {
    onSelectResult(result.node)
    setShowResults(false)
  }

  const clearSearch = () => {
    setQuery('')
    setShowResults(false)
    onClearSearch()
  }

  const getMatchTypeIcon = matchType => {
    return matchType === 'exact' ? (
      <Target className='h-3 w-3 text-green-600' />
    ) : (
      <Zap className='h-3 w-3 text-blue-600' />
    )
  }

  const getMatchTypeLabel = matchType => {
    return matchType === 'exact' ? 'Exact Match' : 'Synonym Match'
  }

  const getMatchTypeColor = matchType => {
    return matchType === 'exact'
      ? 'bg-green-100 text-green-800'
      : 'bg-blue-100 text-blue-800'
  }

  const renderMatchInfo = matchInfo => {
    const { matchedTerms, matchedSynonyms } = matchInfo

    return (
      <div className='flex flex-wrap gap-1 mt-1'>
        {matchedTerms.map((term, index) => (
          <Badge
            key={`exact-${index}`}
            variant='outline'
            className='text-xs bg-green-50 text-green-700'>
            "{term}"
          </Badge>
        ))}
        {matchedSynonyms.map((syn, index) => (
          <Badge
            key={`syn-${index}`}
            variant='outline'
            className='text-xs bg-blue-50 text-blue-700'>
            "{syn.searchTerm}" → "{syn.matchedSynonym}"
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className='relative w-full max-w-md'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
        <Input
          type='text'
          placeholder='Search features...'
          value={query}
          onChange={e => setQuery(e.target.value)}
          className='pl-10 pr-10'
        />
        {query && (
          <Button
            variant='ghost'
            size='sm'
            onClick={clearSearch}
            className='absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0'>
            <X className='h-4 w-4' />
          </Button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50'>
          <ScrollArea className='h-[400px]'>
            <div className='p-2'>
              <div className='text-sm text-muted-foreground mb-2 flex items-center justify-between'>
                <span>
                  {searchResults.length} result {searchResults.length !== 1 ? 's' : ''}{' '}
                  found
                </span>
                <div className='flex items-center gap-2 text-xs'>
                  <div className='flex items-center gap-1'>
                    <Target className='h-3 w-3 text-green-600' />
                    <span>Exact</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Zap className='h-3 w-3 text-blue-600' />
                    <span>Synonym</span>
                  </div>
                </div>
              </div>

              {searchResults.map((result, index) => (
                <div
                  key={result.node.id}
                  onClick={() => handleSelectResult(result)}
                  className='p-3 hover:bg-muted rounded cursor-pointer transition-colors border-b border-gray-100 last:border-b-0'>
                  <div className='flex items-start justify-between '>
                    <div className='flex-1'>
                      <div className='font-medium text-sm flex gap-2 justify-between items-center'>
                        {result.node.name}
                        <div className='flex items-center gap-1'>
                          {getMatchTypeIcon(result.matchType)}
                          <Badge
                            variant='secondary'
                            className={`text-xs ${getMatchTypeColor(result.matchType)}`}>
                            {getMatchTypeLabel(result.matchType)}
                          </Badge>
                        </div>
                      </div>

                      {result.node.description && (
                        <p className='text-xs text-muted-foreground my-4 line-clamp-1'>
                          {result.node.description}
                        </p>
                      )}

                      {renderMatchInfo(result)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {showResults && searchResults.length === 0 && query.trim() && (
        <div className='absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 p-4 text-center text-muted-foreground text-sm'>
          <div className='flex flex-col items-center gap-2'>
            <Search className='h-8 w-8 text-gray-300' />
            <div>
              <div className='font-medium'>No results found for "{query}"</div>
              <div className='text-xs mt-1'>
                Try searching for feature names, descriptions, or related terms
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
