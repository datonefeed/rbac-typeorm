import { Brackets, ObjectLiteral, SelectQueryBuilder } from 'typeorm';

// tạo các hàm filter dùng chung
export function applySearchFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  fields: string[],
  searchValue: string
): SelectQueryBuilder<T> {
  if (!searchValue || fields.length === 0) {
    return qb;
  }

  return qb.andWhere(
    new Brackets(subQb => {
      fields.forEach((field, index) => {
        if (index === 0) {
          subQb.where(`${field} ILIKE :search`, { search: `%${searchValue}%` });
        } else {
          subQb.orWhere(`${field} ILIKE :search`, { search: `%${searchValue}%` });
        }
      });
    })
  );
}


// Apply boolean filter (e.g., isActive = true/false)
export function applyBooleanFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  field: string,
  value: boolean | undefined
): SelectQueryBuilder<T> {
  if (value === undefined) {
    return qb;
  }

  return qb.andWhere(`${field} = :${field.split('.').pop()}`, {
    [field.split('.').pop()!]: value,
  });
}

// Apply EXISTS subquery filter for relations
export function applyRelationExistsFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  config: {
    relationTable: any; 
    relationAlias: string;
    mainTableAlias: string; 
    conditions: { field: string; paramName: string; value: any }[];
  }
): SelectQueryBuilder<T> {
  // Only apply if at least one condition has a non-undefined value (excluding userId field)
  const hasActiveFilters = config.conditions.some(c => 
    c.value !== undefined && !c.field.includes('userId')
  );
  
  if (!hasActiveFilters) {
    return qb;
  }

  return qb.andWhere(subQb => {
    let existsQuery = subQb
      .subQuery()
      .select('1')
      .from(config.relationTable, config.relationAlias)
      .where(`${config.relationAlias}.userId = ${config.mainTableAlias}.id`);

    config.conditions.forEach(({ field, paramName, value }) => {
      if (value !== undefined && !field.includes('userId')) {
        existsQuery = existsQuery.andWhere(`${field} = :${paramName}`, {
          [paramName]: value,
        });
      }
    });

    return `EXISTS ${existsQuery.getQuery()}`;
  });
}

// Filter configuration interface
export interface FilterConfig {
  search?: {
    fields: string[];
    value: string | undefined;
  };
  boolean?: {
    field: string;
    value: boolean | undefined;
  }[];
  relationExists?: {
    relationTable: any;
    relationAlias: string;
    mainTableAlias: string;
    conditions: { field: string; paramName: string; value: any }[];
  }[];
}

// Apply multiple filters at once
export function applyFilters<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  config: FilterConfig
): SelectQueryBuilder<T> {
  let builder = qb;

  // Apply search filter
  if (config.search) {
    builder = applySearchFilter(builder, config.search.fields, config.search.value!);
  }

  // Apply boolean filters
  if (config.boolean) {
    config.boolean.forEach(({ field, value }) => {
      builder = applyBooleanFilter(builder, field, value);
    });
  }

  // Apply relation EXISTS filters
  if (config.relationExists) {
    config.relationExists.forEach(relationConfig => {
      builder = applyRelationExistsFilter(builder, relationConfig);
    });
  }

  return builder;
}
