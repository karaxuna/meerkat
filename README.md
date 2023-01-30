## Meerkat

Library to simplify working with mongodb aggregation framework. Example:

```javascript
import { paginate, match, sort } from 'meerkat';

db.getCollection('subscriptions').aggregate([
  ...match({
    status: 'active',
  }),
  ...sort({
    createdAt: -1,
  }),
  ...paginate({
    skip: 0,
    limit: 100,
  }),
]);
```

See [tests](./src/index.spec.ts) for more examples.
