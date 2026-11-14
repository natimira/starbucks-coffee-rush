import test from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer as reduce, initialState, currentRecipe } from '../src/game/engine.js'
import { DEFAULT_PROFILE, LEVELS, RULES, validateProfile } from '../src/game/data.js'
function begin(state, now=state.lastAt) {
  state=reduce(state,{type:'START_COUNTDOWN',now})
  for(let value=0;value<4;value++) state=reduce(state,{type:'COUNTDOWN_TICK',now})
  return state
}
const start = () => begin(reduce({...initialState,screen:'profile'}, {type:'START',profile:{...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'},now:0}))
function drink(state) {
  for (const [ingredient,count] of Object.entries(currentRecipe(state).doses)) {
    for(let i=0;i<count;i++) {
      state=reduce(state,{type:'ADD',ingredient,now:state.lastAt})
      state=reduce(state,{type:'TICK',now:state.lastAt+RULES.pourMs})
    }
  }
  state=reduce(state,{type:'DELIVER',now:state.lastAt})
  return reduce(state,{type:'TICK',now:state.lastAt+RULES.deliveryMs})
}
function finishOrder(state) {
 const index=state.orderIndex
 while(state.screen==='game'&&state.orderIndex===index) state=drink(state)
 return state
}
test('complete progression: 15 varied orders, exact level durations and a continuous streak',()=>{
 let s=start()
 let expectedDrinks=0
 for(let level=0;level<3;level++) {
  assert.equal(s.remaining,LEVELS[level].duration)
  assert.ok(s.orders.length>LEVELS[level].orders)
  assert.deepEqual([...new Set(s.orders.slice(0,LEVELS[level].orders).map(order=>order.drinks.length))].sort(),LEVELS[level].drinkCounts)
  expectedDrinks+=s.orders.slice(0,LEVELS[level].orders).reduce((total,order)=>total+order.drinks.length,0)
  while(s.screen==='game') s=drink(s)
  assert.equal(s.completedOrders,(level+1)*LEVELS[level].orders)
  assert.equal(s.screen,level===2?'results':'levelComplete')
  if(level===1) { assert.equal(s.level2Thirty,true);assert.deepEqual(s.rewardEvent.cards,['reina-hora-pico']) }
  if(level===2) { assert.equal(s.level3Thirty,true);assert.deepEqual(s.rewardEvent.cards,['leyenda-cafe']) }
  if(level<2) { const streak=s.streak;s=begin(reduce(s,{type:'NEXT_LEVEL',now:s.lastAt}));assert.equal(s.streak,streak) }
 }
 assert.equal(s.completedDrinks,expectedDrinks);assert.equal(s.careerOrders,15);assert.equal(s.outcome,'won')
})
test('rapid clicks cannot duplicate a dose or delivery',()=>{
 let s=start();const ingredient=Object.keys(currentRecipe(s).doses)[0];s=reduce(s,{type:'ADD',ingredient,now:0})
 s=reduce(s,{type:'ADD',ingredient,now:1});assert.equal(s.doses[ingredient],1)
 s=start();s={...s,doses:{...currentRecipe(s).doses}}
 s=reduce(s,{type:'DELIVER',now:0});s=reduce(s,{type:'DELIVER',now:1})
 s=reduce(s,{type:'TICK',now:480});assert.equal(s.completedDrinks,1)
 s=reduce(s,{type:'TICK',now:1000});assert.equal(s.completedDrinks,1)
})
test('pause freezes countdown, ingredients and animation deadline',()=>{
 let s=start();const ingredient=Object.keys(currentRecipe(s).doses)[0];s=reduce(s,{type:'ADD',ingredient,now:0})
 s=reduce(s,{type:'PAUSE',now:100});const remaining=s.remaining
 s=reduce(s,{type:'ADD',ingredient:'milk',now:10000});assert.equal(s.remaining,remaining);assert.equal(s.doses.milk,undefined)
 s=reduce(s,{type:'RESUME',now:10100});assert.equal(s.phaseUntil,10240)
 s=reduce(s,{type:'TICK',now:10240});assert.equal(s.phase,'idle');assert.equal(s.remaining,LEVELS[0].duration-RULES.pourMs)
})
test('wrong ingredient costs time without contaminating cup',()=>{
 let base=start();const wrong=['espresso','milk','caramel','ice','strawberry','chocolate'].find(id=>!Object.hasOwn(currentRecipe(base).doses,id))
 let s=reduce({...base,streak:4},{type:'ADD',ingredient:wrong,now:0})
 assert.equal(s.remaining,LEVELS[0].duration-RULES.mistakePenaltyMs);assert.deepEqual(s.doses,{});assert.equal(s.streak,0)
})
test('late clicks cannot beat zero or restart a completed game',()=>{
 let s=reduce(start(),{type:'ADD',ingredient:'espresso',now:LEVELS[0].duration})
 assert.equal(s.outcome,'timeout');assert.deepEqual(s.doses,{})
 s=reduce(s,{type:'DELIVER',now:150100});assert.equal(s.completedDrinks,0)
})
test('delivery completed before deadline counts despite a delayed timer',()=>{
 let s=start(); s={...s,doses:{...currentRecipe(s).doses},remaining:500}
 s=reduce(s,{type:'DELIVER',now:0});s=reduce(s,{type:'TICK',now:600})
 assert.equal(s.completedDrinks,1);assert.equal(s.outcome,'timeout')
})
test('retry restores checkpoint without accumulating duplicate points',()=>{
 let s=drink(start());s=reduce(s,{type:'TICK',now:LEVELS[0].duration});s=reduce(s,{type:'RETRY',now:LEVELS[0].duration+1})
 assert.equal(s.score,0);assert.equal(s.completedOrders,0);assert.equal(s.remaining,LEVELS[0].duration)
})
test('invalid profile and unknown ingredient cannot start or modify game',()=>{
 assert.ok(validateProfile({name:' ',email:'invalid'}).name)
 assert.ok(validateProfile({name:'Nati',email:'invalid'}).email)
 assert.equal(reduce({...initialState,screen:'profile'},{type:'START',profile:{},now:0}).screen,'profile')
 assert.deepEqual(reduce(start(),{type:'ADD',ingredient:'unknown',now:0}).doses,{})
})

test('a returning authenticated player skips avatar setup',()=>{
 const profile={...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'}
 const started=reduce(initialState,{type:'AUTH_START',profile,now:0})
 assert.equal(started.screen,'briefing')
 assert.equal(started.profile.name,'Nati')
 assert.equal(reduce({...initialState,screen:'profile'},{type:'AUTH_START',profile,now:0}).screen,'profile')
})

test('account opens after login and can start or pause-return to the game',()=>{
 const profile={...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'}
 let s=reduce(initialState,{type:'ACCOUNT_LOGIN',profile,now:0})
 assert.equal(s.screen,'account')
 s=reduce(s,{type:'START_ACCOUNT',now:10})
 assert.equal(s.screen,'briefing')
 s=begin(s,10)
 s=reduce(s,{type:'OPEN_ACCOUNT',now:1010})
 assert.equal(s.screen,'account');assert.equal(s.returnScreen,'game');assert.equal(s.paused,true)
 s=reduce(s,{type:'CLOSE_ACCOUNT',now:5010})
 assert.equal(s.screen,'game');assert.equal(s.paused,false);assert.equal(s.remaining,LEVELS[0].duration-1000)
})

test('an authenticated player returns to the account instead of logging in again',()=>{
 const profile={...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'}
 let s={...initialState,screen:'home',profile,careerOrders:4}
 s=reduce(s,{type:'GO_ACCOUNT',now:0})
 assert.equal(s.screen,'account');assert.equal(s.profile.name,'Nati');assert.equal(s.careerOrders,4)
 s={...s,screen:'results',outcome:'won'}
 s=reduce(s,{type:'GO_ACCOUNT',now:10})
 assert.equal(s.screen,'account');assert.equal(s.profile.email,'test@example.com')
})

test('profile-ready saves setup without starting and perfect drinks record their time',()=>{
 const profile={...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'}
 let s=reduce({...initialState,screen:'profile'},{type:'PROFILE_READY',profile,now:0})
 assert.equal(s.screen,'account')
 s=reduce(s,{type:'START_ACCOUNT',now:0})
 s=begin(s,0)
 s={...s,doses:{...currentRecipe(s).doses}}
 s=reduce(s,{type:'DELIVER',now:5000});s=reduce(s,{type:'TICK',now:5480})
 assert.equal(s.fastestDrink,5480)
})

test('completed orders unlock career progress and three perfect orders build the reward streak',()=>{
 let s=start()
 s=finishOrder(s)
 assert.equal(s.careerOrders,1)
 assert.equal(s.perfectOrderStreak,1)
 assert.equal(s.currentOrderStreak,1)
 assert.equal(s.scoreEvent.label,'+100')
 assert.ok(s.rewardEvent.cards.includes('primer-sorbo'))
 assert.ok(s.fastestDrink<=6000)
 s=finishOrder(finishOrder(s))
 assert.equal(s.careerOrders,3)
 assert.equal(s.perfectOrderStreak,3)
 assert.equal(s.bestPerfectOrderStreak,3)
 assert.equal(s.currentOrderStreak,3)
 assert.deepEqual(s.rewardEvent.cards,['manos-caramelo'])
})

test('an error keeps the completed order but breaks the perfect-order reward streak',()=>{
 let s=finishOrder(start())
 assert.equal(s.perfectOrderStreak,1)
 const wrong=['espresso','milk','caramel','ice','strawberry','chocolate'].find(id=>!Object.hasOwn(currentRecipe(s).doses,id))
 s=reduce(s,{type:'ADD',ingredient:wrong,now:s.lastAt})
 assert.equal(s.scoreEvent.label,'−10 S')
 assert.equal(s.scoreEvent.kind,'negative')
 s=reduce(s,{type:'TICK',now:s.lastAt+RULES.pourMs})
 s=finishOrder(s)
 assert.equal(s.careerOrders,2)
 assert.equal(s.perfectOrderStreak,0)
 assert.equal(s.bestPerfectOrderStreak,1)
 assert.equal(s.currentOrderStreak,0)
})

test('clean orders count toward the current streak even when they take more than six seconds',()=>{
 let s=start()
 s=reduce(s,{type:'TICK',now:7000})
 s=finishOrder(s)
 assert.equal(s.currentOrderStreak,1)
 assert.equal(s.perfectOrderStreak,0)
 assert.equal(s.bestPerfectOrderStreak,0)
})

test('saved achievement progress is restored when an account starts a new game',()=>{
 const profile={...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'}
 const progress={totalOrders:7,bestPerfectOrderStreak:3,fastestDrink:4200,currentOrderStreak:2}
 let s=reduce(initialState,{type:'ACCOUNT_LOGIN',profile,progress,now:0})
 assert.equal(s.careerOrders,7)
 assert.equal(s.currentOrderStreak,2)
 s=reduce(s,{type:'START_ACCOUNT',progress,now:10})
 assert.equal(s.careerOrders,7)
 assert.equal(s.bestPerfectOrderStreak,3)
 assert.equal(s.fastestDrink,4200)
})

test('level mastery cards use the new twenty-second threshold',()=>{
 let levelOne=start()
 for(let i=0;i<LEVELS[0].orders;i++) levelOne=finishOrder(levelOne)
 let beforeLast=begin(reduce(levelOne,{type:'NEXT_LEVEL',now:levelOne.lastAt}))
 const levelTwoDrinks=beforeLast.orders.slice(0,LEVELS[1].orders).reduce((total,order)=>total+order.drinks.length,0)
 for(let i=0;i<levelTwoDrinks-1;i++) beforeLast=drink(beforeLast)
 function finishWith(remaining) {
  let state={...beforeLast,remaining,doses:{...currentRecipe(beforeLast).doses}}
  state=reduce(state,{type:'DELIVER',now:state.lastAt})
  return reduce(state,{type:'TICK',now:state.lastAt+RULES.deliveryMs})
 }
 const exact=finishWith(20000+RULES.deliveryMs)
 const short=finishWith(20000+RULES.deliveryMs-1)
 assert.equal(exact.level2Thirty,true)
 assert.deepEqual(exact.rewardEvent.cards,['reina-hora-pico'])
 assert.equal(short.level2Thirty,false)
})

 test('levels use their new durations and mistakes cost 10 seconds',()=>{
  assert.deepEqual(LEVELS.map(level=>level.duration),[120000,90000,60000])
  for(let level=0;level<3;level++) {
   const state=level===0 ? start() : begin(reduce({...start(),screen:'levelComplete',levelIndex:level-1},{type:'NEXT_LEVEL',now:0}))
   const ingredient=Object.keys(currentRecipe(state).doses)[0]
   const fullCup={...state,doses:{...currentRecipe(state).doses},streak:4}
   const penalized=reduce(fullCup,{type:'ADD',ingredient,now:0})
   assert.equal(penalized.remaining,state.remaining-10000)
   assert.deepEqual(penalized.doses,fullCup.doses)
   assert.equal(penalized.streak,0)
   const timeout=reduce({...fullCup,remaining:9000},{type:'ADD',ingredient,now:0})
   assert.equal(timeout.remaining,0)
   assert.equal(timeout.outcome,'timeout')
  }
 })

test('the briefing and countdown keep every timer frozen until YA',()=>{
 const profile={...DEFAULT_PROFILE,name:'Nati',email:'test@example.com'}
 let s=reduce({...initialState,screen:'profile'},{type:'START',profile,now:100})
 assert.equal(s.screen,'briefing');assert.equal(s.remaining,LEVELS[0].duration)
 s=reduce(s,{type:'START_COUNTDOWN',now:1000})
 for(let value=3;value>0;value--) {
  assert.equal(s.countdown,value)
  s=reduce(s,{type:'COUNTDOWN_TICK',now:1000+(4-value)*1000})
  assert.equal(s.remaining,LEVELS[0].duration)
 }
 assert.equal(s.countdown,0)
 s=reduce(s,{type:'COUNTDOWN_TICK',now:4500})
 assert.equal(s.screen,'game');assert.equal(s.remaining,LEVELS[0].duration)
})

test('an expired express counts as an attempt and applies both penalties',()=>{
 let s=finishOrder(start())
 assert.equal(s.orders[s.orderIndex].type,'express')
 const remaining=s.remaining
 s={...s,score:500,streak:4}
 s=reduce(s,{type:'TICK',now:s.lastAt+RULES.expressDrinkMs})
 assert.equal(s.orderIndex,2);assert.equal(s.failedOrders,1)
 assert.equal(s.completedOrders,1);assert.equal(s.streak,0)
 assert.equal(s.score,400)
 assert.equal(s.remaining,remaining-RULES.expressDrinkMs-RULES.expressFailurePenaltyMs)
 assert.equal(s.scoreEvent.kind,'negative')
})

test('cancelled express orders are replaced and five correct orders are still required',()=>{
 let s=start()
 let cancelled=0
 while(s.screen==='game') {
  if(s.orders[s.orderIndex].type==='express'&&cancelled<2) { s=reduce(s,{type:'TICK',now:s.lastAt+RULES.expressDrinkMs});cancelled++ }
  else s=drink(s)
 }
 assert.equal(s.screen,'levelComplete')
 assert.equal(s.levelCompletedOrders,5)
 assert.equal(s.failedOrders,2)
})

test('happy hour and express multipliers stack and unlock both new cards',()=>{
 let s=start()
 const event=s.events.happyHour
 s=reduce(s,{type:'TICK',now:s.lastAt+event.startAt+1})
 s=finishOrder(s)
 assert.equal(s.orders[s.orderIndex].type,'express')
 const expressDrinkCount=s.orders[s.orderIndex].drinks.length
 const before=s.score
 s=finishOrder(s)
 assert.ok(s.score-before>=400*expressDrinkCount)
 assert.equal(s.happyHourExpress,true)
 assert.ok(s.rewardEvent.cards.includes('primer-express'))
 assert.ok(s.rewardEvent.cards.includes('estrella-hora-feliz'))
})

test('completing the two rush orders unlocks the rush mastery card',()=>{
 let s=start()
 for(let index=0;index<LEVELS[0].orders;index++) s=finishOrder(s)
 s=begin(reduce(s,{type:'NEXT_LEVEL',now:s.lastAt}))
 assert.equal(s.events.rushOrderIndices.length,2)
 const lastRush=Math.max(...s.events.rushOrderIndices)
 while(s.screen==='game' && s.orderIndex<=lastRush) s=drink(s)
 assert.equal(s.rushMastered,true)
 assert.ok(s.rewardEvent.cards.includes('dominio-hora-pico'))
})
