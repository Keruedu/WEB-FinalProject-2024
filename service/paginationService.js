class PaginationService {
  static async paginate(model, options) {
    const {
      page = 1,
      perPage = 3,
      searchQuery = '',
      filterField = 'username',
      selectFields = '',
      sortField = 'username',
      sortOrder = 'asc',
      query = {},
      populate = null
    } = options;

    try {
      let baseQuery = model.find(query);

      if (searchQuery && filterField) {
        const searchCondition = {};
        searchCondition[filterField] = { $regex: searchQuery, $options: 'i' };
        baseQuery = baseQuery.find(searchCondition);
      }

      if (selectFields) {
        baseQuery = baseQuery.select(selectFields);
      }

      if (populate) {
        if (Array.isArray(populate)) {
          populate.forEach(p => {
            baseQuery = baseQuery.populate(p);
          });
        } else {
          baseQuery = baseQuery.populate(populate);
        }
      }

      const totalItems = await model.countDocuments(query);
      const lastPage = Math.ceil(totalItems / perPage);
      
      const sortBy = {};
      sortBy[sortField] = sortOrder === 'asc' ? 1 : -1;

      const items = await baseQuery
        .sort(sortBy)
        .skip((page - 1) * perPage)
        .limit(perPage);

      return {
        items,
        pagination: {
          currentPage: page,
          hasNextPage: page < lastPage,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: lastPage,
          totalItems,
          perPage
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PaginationService;