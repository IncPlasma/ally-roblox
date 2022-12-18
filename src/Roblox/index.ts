/*
|--------------------------------------------------------------------------
| Ally Oauth driver
|--------------------------------------------------------------------------
|
| This is a dummy implementation of the Oauth driver. Make sure you
|
| - Got through every line of code
| - Read every comment
|
*/

import type { ApiRequestContract, LiteralStringUnion } from '@ioc:Adonis/Addons/Ally'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Oauth2Driver, ApiRequest, RedirectRequest } from '@adonisjs/ally/build/standalone'

/**
 * Define the access token object properties in this type. It
 * must have "token" and "type" and you are free to add
 * more properties.
 */
export type RobloxAccessToken = {
  token: string
  type: 'bearer'
}

/**
 * Define a union of scopes the driver accepts.
 */
export type RobloxScopes = 'openid' | 'profile' | 'universe-messaging-service:publish'

/**
 * The configuration options accepted by the driver
 */
export type RobloxConfig = {
  driver: 'roblox'
  clientId: string
  clientSecret: string
  callbackUrl: string
  authorizeUrl?: string
  accessTokenUrl?: string
  userInfoUrl?: string
  scopes?: LiteralStringUnion<RobloxScopes>[]
}

/**
 * Driver implementation.
 */
export class RobloxDriver extends Oauth2Driver<RobloxAccessToken, RobloxScopes> {
  /**
   * The URL for the redirect request. The user will be redirected on this page
   * to authorize the request.
   */
  protected authorizeUrl = 'https://apis.roblox.com/oauth/v1/authorize'

  /**
   * The URL to hit to exchange the authorization code for the access token
   */
  protected accessTokenUrl = 'https://apis.roblox.com/oauth/v1/token'

  /**
   * The URL to hit to get the user details
   */
  protected userInfoUrl = 'https://apis.roblox.com/oauth/v1/userinfo'

  /**
   * The param name for the authorization code.
   */
  protected codeParamName = 'code'

  /**
   * The param name for the error.
   */
  protected errorParamName = 'error'

  /**
   * Cookie name for storing the CSRF token.
   */
  protected stateCookieName = 'roblox_oauth_state'

  /**
   * Parameter name to be used for sending and receiving the state from.
   * Read the documentation of your oauth provider and update the param
   * name to match the query string used by the provider for exchanging
   * the state.
   */
  protected stateParamName = 'state'

  /**
   * Parameter name for sending the scopes to the oauth provider.
   */
  protected scopeParamName = 'scope'

  /**
   * The separator indentifier for defining multiple scopes
   */
  protected scopesSeparator = ' '

  constructor(ctx: HttpContextContract, public config: RobloxConfig) {
    super(ctx, config)

    /**
     * Extremely important to call the following method to clear the
     * state set by the redirect request.
     */
    this.loadState()
  }

  /**
   * Configure the authorization redirect request. The actual request
   * is made by the base implementation of "Oauth2" driver and this is a
   * hook to pre-configure the request.
   */
  protected configureRedirectRequest(request: RedirectRequest<RobloxScopes>) {
    request.scopes(this.config.scopes || ['openid'])
    request.param('response_type', 'code')
  }

  /**
   * Configure the access token request. The actual request is made by
   * the base implementation of "Oauth2" driver and this is a hook to pre-configure
   * the request
   */
  protected configureAccessTokenRequest(request: ApiRequest) {
    var authBuffer = Buffer.from(this.config.clientId + ':' + this.config.clientSecret)

    request.header('Authorization', `Bearer ${authBuffer.toString('base64')}`)
  }

  /**
   * Update the implementation to tell if the error received during redirect
   * means "ACCESS DENIED".
   */
  public accessDenied() {
    return this.ctx.request.input('error') === 'user_denied'
  }

  public async getUserInfo(accessToken, callback?: (request: ApiRequestContract) => void) {
    const request = this.httpClient(this.config.userInfoUrl || this.userInfoUrl)
    request.header('Authorization', `Bearer ${accessToken}`)
    request.header('Accept', 'application/json')
    request.parseAs('json')

    /**
     * Allow end user to configure the request.
     */
    if (typeof callback === 'function') {
      callback(request)
    }

    const resBody = await request.get()
    return {
      id: resBody.sub,
      name: resBody.name,
      nickName: resBody.nickname,
      email: resBody.email,
      emailVerificationState:
        'verified' in resBody
          ? resBody.verified
            ? ('verified' as const)
            : ('unverified' as const)
          : ('unsupported' as const),
      avatarUrl: `https://www.roblox.com/headshot-thumbnail/image?userId=${resBody.sub}&width=420&height=420&format=png`,
      original: resBody,
    }
  }

  /**
   * Get the user details by query the provider API. This method must return
   * the access token and the user details both.
   */
  public async user(callback?: (request: ApiRequest) => void) {
    const accessToken = await this.accessToken()

    const user = await this.getUserInfo(accessToken.token, callback)

    return {
      ...user,
      token: accessToken,
    }
  }

  public async userFromToken(accessToken: string, callback?: (request: ApiRequest) => void) {
    const user = await this.getUserInfo(accessToken, callback)

    return {
      ...user,
      token: { token: accessToken, type: 'bearer' as const },
    }
  }
}
