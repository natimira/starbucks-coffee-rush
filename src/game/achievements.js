export const ACHIEVEMENTS = [
  { id: 'primer-sorbo', title: 'PRIMER SORBO', stars: '★', asset: 'card-primer-sorbo.svg', description: 'Tu primer pedido completo.', number: '01 / INICIACIÓN', color: 'paper', unlocked: progress => progress.totalOrders >= 1 },
  { id: 'espresso-express', title: 'ESPRESSO EXPRESS', stars: '★★', asset: 'card-espresso-express.svg', description: 'Pedido sin errores: 6 s por bebida.', number: '02 / VELOCIDAD', color: 'gold', unlocked: progress => progress.fastestDrink !== null && progress.fastestDrink <= 6000 },
  { id: 'manos-caramelo', title: 'MANOS DE CARAMELO', stars: '★★★', asset: 'card-manos-caramelo.svg', description: '3 pedidos rápidos y sin errores.', number: '03 / PRECISIÓN', color: 'coral', unlocked: progress => progress.bestPerfectOrderStreak >= 3 },
  { id: 'reina-hora-pico', title: 'REINA DE LA HORA PICO', stars: '★★★★', asset: 'card-reina-hora-pico.svg', description: 'Nivel 2 completo con al menos 20 segundos restantes.', number: '04 / MAESTRÍA', color: 'mint', unlocked: progress => progress.level2Thirty },
  { id: 'leyenda-cafe', title: 'LEYENDA DEL CAFÉ', stars: '★★★★★', asset: 'card-leyenda-cafe.svg', description: 'Nivel 3 completo con al menos 20 segundos restantes.', number: '05 / LEYENDA', color: 'gold', unlocked: progress => progress.level3Thirty },
  { id: 'primer-express', title: 'PRIMER EXPRESS', stars: '★★', asset: 'card-primer-express.svg', description: 'Tu primer pedido express completo.', number: '06 / VELOCIDAD', color: 'coral', unlocked: progress => progress.expressOrders >= 1 },
  { id: 'estrella-hora-feliz', title: 'ESTRELLA DE LA HORA FELIZ', stars: '★★★', asset: 'card-hora-feliz.svg', description: 'Pedido express completo durante Hora feliz.', number: '07 / BONUS', color: 'gold', unlocked: progress => progress.happyHourExpress === true },
  { id: 'dominio-hora-pico', title: 'DOMINIO DE LA HORA PICO', stars: '★★★★', asset: 'card-hora-pico.svg', description: 'Los 2 express de Hora pico completos.', number: '08 / RUSH', color: 'mint', unlocked: progress => progress.rushMastered === true },
]

export function getUnlockedAchievementIds(progress) {
  return ACHIEVEMENTS.filter(card => card.unlocked(progress)).map(card => card.id)
}

export function achievementProgressFromState(state) {
  return { totalOrders: state.careerOrders, fastestDrink: state.fastestDrink,
    bestPerfectOrderStreak: state.bestPerfectOrderStreak,
    level2Thirty: state.level2Thirty, level3Thirty: state.level3Thirty,
    expressOrders: state.expressOrders, happyHourExpress: state.happyHourExpress,
    rushMastered: state.rushMastered }
}
