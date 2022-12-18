The package has been configured successfully!

Make sure to first define the mapping inside the `contracts/ally.ts` file as follows.

```ts
import { RobloxDriver, RobloxConfig } from 'adonis-ally-roblox/build/standalone'

declare module '@ioc:Adonis/Addons/Ally' {
  interface SocialProviders {
    // ... other mappings
    Roblox: {
      config: RobloxConfig
      implementation: RobloxDriver
    }
  }
}
```
