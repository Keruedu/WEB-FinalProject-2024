class PaginationService {
  static async paginate(model, options) {
    const {
      page = 1,
      perPage = 3,
      searchQuery = '',
      filterField = 'username',
      selectFields = '',
      sortField = 'username',
      sortOrder = 'asc'  // 'asc' hoặc 'desc'
    } = options;

    try {
      let query = {};
      if (searchQuery && filterField) {
        query[filterField] = { $regex: searchQuery, $options: 'i' };
      }

      const sortBy = {};
      sortBy[sortField] = sortOrder === 'asc' ? 1 : -1;

      const totalItems = await model.countDocuments(query);
      const lastPage = Math.ceil(totalItems / perPage);
      
      const items = await model.find(query)
        .select(selectFields)
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