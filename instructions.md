The package has been configured successfully!

Make sure to first define the mapping inside the `contracts/ally.ts` file as follows.

```ts
import { Roblox, RobloxConfig } from '@incplasma/ally-roblox'

declare module '@ioc:Adonis/Addons/Ally' {
  interface SocialProviders {
    // ... other mappings
    Roblox: {
      config: RobloxConfig
      implementation: Roblox
    }
  }
}
```
