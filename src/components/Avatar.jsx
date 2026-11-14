import { useMemo } from 'react'
import { avatarSrc } from '../avatarSvg.js'

export default function Avatar({ profile, small = false }) {
  const src = useMemo(() => avatarSrc(profile), [profile?.hair, profile?.apron, profile?.gender]) // eslint-disable-line react-hooks/exhaustive-deps
  return <img className={small ? 'avatar avatar-small' : 'avatar'} src={src} alt={small ? '' : 'Tu avatar'} />
}
