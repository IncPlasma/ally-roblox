import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class RobloxProvider {
  constructor(protected app: ApplicationContract) {}

  public async boot() {
    const Ally = this.app.container.resolveBinding('Adonis/Addons/Ally')
    const { RobloxDriver } = await import('../src/Roblox')

    Ally.extend('roblox', (_, __, config, ctx) => {
      return new RobloxDriver(ctx, config)
    })
  }
}
