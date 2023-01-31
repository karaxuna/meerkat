# Meerkat &middot; [![npm version](https://img.shields.io/npm/v/@flibbert/meerkat.svg?style=flat)](https://www.npmjs.com/package/@flibbert/meerkat)

Library to simplify working with mongodb aggregation framework.

### Installation

npm:
```
npm i @flibert/meerkat
```

yarn:
```
yarn add @flibert/meerkat
```

### Usage:

```javascript
import { paginate, match, sort } from '@flibbert/meerkat';

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
