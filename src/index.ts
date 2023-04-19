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
      [path]: {
        $push: '$' + path,
      },
    }),
    ...replaceRoot({
      newRoot: {
        $mergeObjects: [
          '$doc',
          {
            [path]: '$' + path,
          },
        ],
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
