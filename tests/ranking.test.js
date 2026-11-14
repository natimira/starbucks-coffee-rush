import test from 'node:test'
import assert from 'node:assert/strict'
import { addScore, positionOf, sanitizeRanking, RANKING_SIZE } from '../src/game/ranking.js'

test('ranking keeps one best score per person, sorted, capped at ten', () => {
  let list = []
  list = addScore(list, { email: 'a@x.co', name: 'Ana', score: 500 })
  list = addScore(list, { email: 'b@x.co', name: 'Beto', score: 900 })
  assert.deepEqual(list.map(item => item.name), ['Beto', 'Ana'])
  const same = addScore(list, { email: 'A@x.co', name: 'Ana', score: 400 })
  assert.equal(same, list)
  list = addScore(list, { email: 'a@x.co', name: 'Ana', score: 1200 })
  assert.deepEqual(list.map(item => item.score), [1200, 900])
  for (let i = 0; i < 12; i++) list = addScore(list, { email: `p${i}@x.co`, name: `P${i}`, score: 100 + i })
  assert.equal(list.length, RANKING_SIZE)
  assert.equal(positionOf(list, 'a@x.co'), 1)
  assert.equal(positionOf(list, 'nadie@x.co'), null)
})

test('invalid scores and corrupt storage are ignored', () => {
  assert.deepEqual(addScore([], { email: 'a@x.co', name: 'Ana', score: 0 }), [])
  assert.deepEqual(addScore([], { email: '', name: 'Ana', score: 10 }), [])
  assert.deepEqual(sanitizeRanking('basura'), [])
  assert.deepEqual(sanitizeRanking([{ email: 1 }, null, { email: 'a@x.co', name: 'Ana', score: 'x' }]), [])
})
