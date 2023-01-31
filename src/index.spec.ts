import {
  unset,
  sort,
  unwind,
  lookup,
  addFields,
  group,
  replaceRoot,
  lookupArray,
  facet,
  paginate,
} from './index';

test('unset', () => {
  expect(unset('something')).toEqual([{
    $unset: ['something'],
  }]);
});

test('sort', () => {
  expect(sort({ something: -1 })).toEqual([{
    $sort: {
      something: -1,
    },
  }]);
});

test('unwind', () => {
  expect(unwind('something')).toEqual([{
    $unwind: {
      path: '$something',
      preserveNullAndEmptyArrays: true,
    },
  }]);
});

test('lookup', () => {
  expect(lookup({
    from: 'from',
    localField: 'something',
    foreignField: '_id',
    as: 'somethings',
  })).toEqual([
    {
      $lookup: {
        from: 'from',
        localField: 'something',
        foreignField: '_id',
        as: 'somethings'
      },
    },
  ]);
});

test('lookup (with unique: true)', () => {
  expect(lookup({
    from: 'from',
    localField: 'something',
    foreignField: '_id',
    as: 'somethings',
    unique: true,
  })).toEqual([
    {
      $lookup: {
        from: 'from',
        localField: 'something',
        foreignField: '_id',
        as: 'somethings'
      },
    },
    {
      $addFields: {
        somethings: {
          $first: '$somethings',
        },
      },
    },
  ]);
});

test('addFields', () => {
  expect(addFields({ something: '$otherthing' })).toEqual([{
    $addFields: {
      something: '$otherthing',
    },
  }]);
});

test('group', () => {
  expect(group({
    _id: '$_id',
    somethings: {
      $push: '$something',
    },
  })).toEqual([{
    $group: {
      _id: '$_id',
      somethings: {
        $push: '$something',
      },
    },
  }]);
});

test('replaceRoot', () => {
  expect(replaceRoot({
    newRoot: {
      $mergeObjects: [
        '$thing',
        {
          something: '$otherthing',
        },
      ],
    },
  })).toEqual([{
    $replaceRoot: {
      newRoot: {
        $mergeObjects: [
          '$thing',
          {
            something: '$otherthing',
          },
        ],
      },
    },
  }]);
});

test('lookupArray', () => {
  expect(lookupArray({
    from: 'from',
    localField: 'somethingRefs',
    foreignField: '_id',
    as: 'somethings',
    unique: true,
  })).toEqual([
    {
      $unwind: {
        path: '$somethingRefs',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'from',
        localField: 'somethingRefs',
        foreignField: '_id',
        as: 'somethings',
      },
    },
    {
      $addFields: {
        somethings: {
          $first: '$somethings',
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        doc: {
          $first: '$$ROOT',
        },
        somethings: {
          $push: '$somethings',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [
            '$doc',
            {
              somethings: '$somethings',
            },
          ],
        },
      },
    },
  ]);
});

test('facet', () => {
  expect(facet({
    metadata: [{
      $count: 'total'
    }],
    records: [
      {
        $skip: 0,
      },
      {
        $limit: 100,
      },
    ],
  })).toEqual([{
    $facet: {
      metadata: [{
        $count: 'total'
      }],
      records: [
        {
          $skip: 0,
        },
        {
          $limit: 100,
        },
      ],
    },
  }]);
});

test('paginate', () => {
  expect(paginate({
    skip: 5,
    limit: 30,
  })).toEqual([
    {
      $facet: {
        metadata: [
          {
            $count: 'total',
          },
        ],
        records: [
          {
            $skip: 5,
          },
          {
            $limit: 30,
          },
        ],
      },
    },
    {
      $unwind: {
        path: '$metadata',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        total: '$metadata.total',
      },
    },
    {
      $unset: [
        'metadata',
      ],
    },
  ]);
});
