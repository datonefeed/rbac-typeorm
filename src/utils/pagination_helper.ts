import { In, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import {
  buildPaginator,
  PagingResult,
} from 'typeorm-cursor-pagination';

// Cursor pagination configuration
export interface CursorPaginationConfig {
  limit?: number;
  afterCursor?: string;
  beforeCursor?: string;
  order?: 'ASC' | 'DESC';
}

// Cursor pagination result
export interface CursorPaginationResult<T> {
  data: T[];
  cursor: {
    afterCursor: string | null;
    beforeCursor: string | null;
  };
}


// Relation hydration configuration
export interface RelationHydrationConfig {
  relations: any; // TypeORM relations object
  select?: any; // TypeORM select object
}

// Execute cursor pagination with optional relation hydration and data transformation
export async function executeCursorPagination<TEntity extends ObjectLiteral, TResult = TEntity>(
  queryBuilder: SelectQueryBuilder<TEntity>,
  repository: Repository<TEntity>,
  config: CursorPaginationConfig,
  hydrationConfig?: RelationHydrationConfig,
  transformFn?: (entity: TEntity) => TResult
): Promise<CursorPaginationResult<TResult>> {
  const {
    limit = 20,
    afterCursor,
    beforeCursor,
    order = 'DESC',
  } = config;

  // Build paginator
  const paginator = buildPaginator({
    entity: repository.target as any,
    alias: queryBuilder.alias,
    paginationKeys: ['id'],
    query: {
      limit,
      order,
      afterCursor,
      beforeCursor,
    },
  });

  // Execute pagination - lấy entities với IDs
  const paginationResult = await paginator.paginate(queryBuilder as any) as any;

  // Empty result
  if (paginationResult.data.length === 0) {
    return {
      data: [],
      cursor: {
        afterCursor: null,
        beforeCursor: null,
      },
    };
  }

  // Extract IDs (giữ đúng thứ tự của pagination)
  const ids = paginationResult.data.map((entity: any) => entity.id);

  // Hydrate relations nếu có config
  let entitiesWithRelations: TEntity[];
  
  if (hydrationConfig) {
    entitiesWithRelations = await repository.find({
      where: { id: In(ids) } as any,
      relationLoadStrategy: 'query',
      relations: hydrationConfig.relations,
      select: hydrationConfig.select,
    });
  } else {
    entitiesWithRelations = paginationResult.data as TEntity[];
  }

  // Transform data nếu có transformFn
  let transformedData: TResult[];
  if (transformFn) {
    transformedData = entitiesWithRelations.map(transformFn);
  } else {
    transformedData = entitiesWithRelations as any;
  }

  // Reorder theo IDs (vì find(In(...)) không đảm bảo thứ tự)
  const dataMap = new Map(transformedData.map((item: any) => [item.id, item]));
  const dataOrdered = ids.map((id: any) => dataMap.get(id)).filter(Boolean) as TResult[];

  return {
    data: dataOrdered,
    cursor: {
      afterCursor: paginationResult.cursor.afterCursor,
      beforeCursor: paginationResult.cursor.beforeCursor,
    },
  };
}


 
// Chỉ select ID và field dùng cho sorting (thường là createdAt)

export function createPaginationQuery<T extends ObjectLiteral>(
  repository: Repository<T>,
  alias: string,
  selectFields: string[] = ['id', 'createdAt']
): SelectQueryBuilder<T> {
  const selectWithAlias = selectFields.map(field => `${alias}.${field}`);
  return repository.createQueryBuilder(alias).select(selectWithAlias);
}
