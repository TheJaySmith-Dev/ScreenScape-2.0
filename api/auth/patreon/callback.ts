// pages/api/auth/patreon/callback.ts

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string
  if (!code) return res.status(400).send('Missing code from Patreon')

  try {
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.PATREON_CLIENT_ID!,
        client_secret: process.env.PATREON_CLIENT_SECRET!,
        redirect_uri: 'https://screenscape.space/api/auth/patreon/callback',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'Token exchange failed', tokenData })
    }

    const userResponse = await fetch(
      'https://www.patreon.com/api/oauth2/v2/identity?include=memberships,memberships.currently_entitled_tiers',
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    )

    const userData = await userResponse.json()
    const isPatron = userData?.included?.[0]?.attributes?.patron_status === 'active_patron'

    if (isPatron) {
      return res.redirect('/genscape?verified=true')
    } else {
      return res.redirect('/locked')
    }
  } catch (error) {
    console.error(error)
    return res.status(500).send('OAuth failed')
  }
}
