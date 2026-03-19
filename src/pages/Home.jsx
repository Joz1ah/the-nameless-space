import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { useAuthContext } from '../App'
import Header from '../components/Header'
import NotebookPage from '../components/NotebookPage'
import AllEntries from '../components/AllEntries'
import { CATEGORIES } from '../components/EntryEditor'
import styles from './Home.module.css'

export default function Home() {
  const { user, profile } = useAuthContext()
  const { entries, loading, error, getRandomEntry } = useEntries(user?.id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animClass, setAnimClass] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)
  const animLock = useRef(false)
  const navigate = useNavigate()

  const publishedEntries = entries.filter(e => !e.is_draft)

  const categoryEntries = activeCategory === null
    ? publishedEntries
    : publishedEntries.filter(e => e.category === activeCategory)

  useEffect(() => {
    if (currentIndex >= publishedEntries.length && publishedEntries.length > 0) {
      setCurrentIndex(publishedEntries.length - 1)
    }
  }, [publishedEntries.length])

  useEffect(() => {
    const saved = sessionStorage.getItem('lastPageIndex')
    if (saved !== null && publishedEntries.length > 0) {
      setCurrentIndex(Math.min(Number(saved), publishedEntries.length - 1))
      sessionStorage.removeItem('lastPageIndex')
    }
  }, [publishedEntries.length])

  useEffect(() => { setCurrentIndex(0) }, [activeCategory])

  const goTo = (newIndex, dir) => {
    if (animLock.current) return
    if (newIndex < 0 || newIndex >= categoryEntries.length) return
    animLock.current = true
    setAnimClass(dir === 'next' ? 'exitNext' : 'exitPrev')
    setTimeout(() => {
      setCurrentIndex(newIndex)
      setAnimClass(dir === 'next' ? 'enterNext' : 'enterPrev')
      setTimeout(() => { setAnimClass(''); animLock.current = false }, 420)
    }, 300)
  }

  const flip = (dir) => {
    if (dir === 'next') goTo(currentIndex + 1, 'next')
    else goTo(currentIndex - 1, 'prev')
  }

  const handleRandomPage = () => {
    const others = categoryEntries.filter((_, i) => i !== currentIndex)
    if (!others.length) return
    const entry = others[Math.floor(Math.random() * others.length)]
    const idx = categoryEntries.findIndex(e => e.id === entry.id)
    goTo(idx, idx > currentIndex ? 'next' : 'prev')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') flip('next')
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') flip('prev')
  }

  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingDot} />
      <p>opening your notebook...</p>
    </div>
  )

  if (error) return (
    <div className={styles.errorScreen}><p>something went wrong: {error}</p></div>
  )

  const safeIndex = Math.min(currentIndex, Math.max(0, categoryEntries.length - 1))

  return (
    <div className={styles.shell} onKeyDown={handleKeyDown} tabIndex={0}>
      <Header
        onRandomPage={handleRandomPage}
        hasEntries={publishedEntries.length > 0}
        onShowAll={() => setShowAll(true)}
      />

      {showAll && (
        <AllEntries
          entries={entries}
          onClose={() => setShowAll(false)}
          onSelect={(pubIdx) => {
            setShowAll(false)
            if (pubIdx >= 0) goTo(pubIdx, pubIdx > currentIndex ? 'next' : 'prev')
          }}
          onSelectEntry={(entryId) => { setShowAll(false); navigate(`/entry/${entryId}`) }}
        />
      )}

      <main className={styles.main}>
        {publishedEntries.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={styles.flipBook}>
            {publishedEntries.length > 0 && (
              <div className={styles.greeting}>
                <span className={styles.greetName}>
                  {profile?.nickname ? `hey, ${profile.nickname} ✦` : 'hey there ✦'}
                </span>
                {activeCategory === null && publishedEntries.length > 1 && (
                  <>
                    <p className={styles.greetText}>let your notebook take you somewhere.</p>
                    <button className={styles.greetBtn} onClick={handleRandomPage}>
                      ✦ flip a random page
                    </button>
                  </>
                )}
                {activeCategory === 'food' && (
                  <p className={styles.greetText}>your food memories, one bite at a time.</p>
                )}
                {activeCategory === 'travel' && (
                  <p className={styles.greetText}>every adventure you've ever chased.</p>
                )}
                {activeCategory === 'daily' && (
                  <p className={styles.greetText}>little moments from your everyday life.</p>
                )}
              </div>
            )}

            <div className={styles.categoryTabs}>
              <button
                className={`${styles.catTab} ${activeCategory === null ? styles.catTabActive : ''}`}
                onClick={() => setActiveCategory(null)}>
                all
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  className={`${styles.catTab} ${activeCategory === cat.key ? styles.catTabActive : ''}`}
                  onClick={() => setActiveCategory(prev => prev === cat.key ? null : cat.key)}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {categoryEntries.length === 0 ? (
              <CategoryEmptyState category={activeCategory} navigate={navigate} />
            ) : (
              <>
                <div className={styles.counter}>
                  page {safeIndex + 1} of {categoryEntries.length}
                </div>

                <div className={styles.flipScene}>
                  <div className={`${styles.pageWrapper} ${animClass ? styles[animClass] : ''}`}>
                    <NotebookPage
                      entry={categoryEntries[safeIndex]}
                      index={safeIndex}
                      total={categoryEntries.length}
                    />
                  </div>
                </div>

                <div className={styles.controls}>
                  <button
                    className={`${styles.flipBtn} ${safeIndex === 0 ? styles.disabled : ''}`}
                    onClick={() => flip('prev')} disabled={safeIndex === 0}>
                    <span>←</span>
                    <span className={styles.btnLabel}>prev page</span>
                  </button>
                  <div className={styles.dots}>
                    {categoryEntries.map((_, i) => (
                      <button key={i}
                        className={`${styles.dot} ${i === safeIndex ? styles.activeDot : ''}`}
                        onClick={() => goTo(i, i > safeIndex ? 'next' : 'prev')}
                        aria-label={`Go to page ${i + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    className={`${styles.flipBtn} ${safeIndex === categoryEntries.length - 1 ? styles.disabled : ''}`}
                    onClick={() => flip('next')} disabled={safeIndex === categoryEntries.length - 1}>
                    <span className={styles.btnLabel}>next page</span>
                    <span>→</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className={styles.empty}>
      <div className={styles.emptyPage}>
        <div className={styles.emptyLines} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className={styles.emptyLine} />)}
        </div>
        <div className={styles.emptyContent}>
          <p className={styles.emptyTitle}>this notebook is empty</p>
          <p className={styles.emptySubtitle}>your thoughts are waiting to be written</p>
          <button className={styles.emptyBtn} onClick={() => navigate('/new')}>write your first entry →</button>
        </div>
      </div>
    </div>
  )
}

function CategoryEmptyState({ category, navigate }) {
  const cat = CATEGORIES.find(c => c.key === category)
  if (!cat) return null
  return (
    <div className={styles.empty}>
      <div className={styles.emptyPage}>
        <div className={styles.emptyLines} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className={styles.emptyLine} />)}
        </div>
        <div className={styles.emptyContent}>
          <span className={styles.catEmptyEmoji}>{cat.emoji}</span>
          <p className={styles.emptyTitle}>no {cat.label.toLowerCase()} entries yet</p>
          <p className={styles.emptySubtitle}>start writing your first {cat.label.toLowerCase()} page</p>
          <button className={styles.emptyBtn} onClick={() => navigate(`/new?template=${cat.key}`)}>
            write a {cat.label.toLowerCase()} entry →
          </button>
        </div>
      </div>
    </div>
  )
}
