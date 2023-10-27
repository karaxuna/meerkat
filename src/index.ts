export const unset = (...fields: string[]) => {
  return [{
    $unset: fields,
  }];
};

export const sort = (sort: { [key: string]: number }) => {
  return [{
    $sort: sort,
  }];
};

export const unwind = (path: string, options = { preserveNullAndEmptyArrays: true }) => {
  return [{
    $unwind: {
      path: '$' + path,
      ...options,
    },
  }];
};

interface LookupBaseOptions {
  from: string;
  as: string;
  unique?: boolean;
};

export interface LookupWithPipelineOptions extends LookupBaseOptions {
  let: any;
  pipeline: any[];
};

export interface LookupWithFieldsOptions extends LookupBaseOptions {
  localField: string;
  foreignField: string;
};

export type LookupOptions = LookupWithPipelineOptions | LookupWithFieldsOptions;

export const lookup = ({
  unique,
  ...rest
}: LookupOptions) => {
  const pipeline: any[] = [{
    $lookup: rest,
  }];

  if (unique) {
    pipeline.push(
      ...addFields({
        [rest.as]: {
          $first: '$' + rest.as,
        },
      }),
    );
  };

  return pipeline;
};

export const addFields = (fields: { [key: string]: any }) => {
  return [{
    $addFields: fields,
  }];
};

export const group = (options: { [key: string]: any }) => {
  return [{
    $group: options,
  }];
};

export const replaceRoot = (options: { [key: string]: any }) => {
  return [{
    $replaceRoot: options,
  }];
};

const mergeObjects = (source, target) => {
  return {
    $mergeObjects: [
      source,
      Object.keys(target).reduce((result, key) => {
        const parts = key.split('.');

        if (parts.length > 1) {
          result[parts[0]] = mergeObjects(`${source}.${parts[0]}`, { [parts[1]]: target[key] });
        }
        else if (typeof target[key] === 'object' && target[key] !== null) {
          result[key] = mergeObjects(`${source}.${key}`, target[key]);
        }
        else {
          result[key] = target[key];
        }

        return result;
      }, {}),
    ],
  };
};

/**
 * Reverse of unwind
 *
 * @param path - path to the field to wind
 */
export const wind = (path: string) => {
  return [
    ...group({
      _id: '$_id',
      doc: {
        $first: '$$ROOT'
      },
      targets: {
        $push: '$' + path,
      },
    }),
    ...replaceRoot({
      newRoot: {
        ...mergeObjects(
          '$doc',
          {
            [path]: '$targets',
          },
        ),
      },
    })
  ];
};

export const lookupArray = (options: LookupWithFieldsOptions) => {
  return [
    ...unwind(options.localField),
    ...lookup(options),
    ...wind(options.as),
  ];
};

export const facet = (options: any) => {
  return [{
    $facet: options,
  }];
};

export const skip = (quantity: number) => {
  return [{
    $skip: quantity,
  }];
};

export const limit = (quantity: number) => {
  return [{
    $limit: quantity,
  }];
};

export const paginate = (options: { skip: number; limit: number; pipeline?: any[]; }) => {
  return [
    ...facet({
      metadata: [{
        $count: 'total'
      }],
      records: [
        ...skip(options.skip),
        ...limit(options.limit),
        ...(options.pipeline || []),
      ],
    }),
    ...unwind('metadata'),
    ...addFields({
      total: '$metadata.total',
    }),
    ...unset('metadata'),
  ];
};

export const match = (options: any) => {
  if (!options || !Object.keys(options).length) {
    return [];
  }

  return [{
    $match: options,
  }];
};

export const versioning = ({
  id,
  version,
}) => {
  return [
    ...sort({
      [id]: 1,
      [version]: -1,
    }),
    ...group({
      _id: id,
      latest: {
        $first: '$$ROOT',
      },
    }),
    ...replaceRoot({
      newRoot: '$latest',
    }),
  ];
};
