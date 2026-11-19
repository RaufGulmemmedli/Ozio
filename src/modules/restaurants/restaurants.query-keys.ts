/** Query keys for the restaurants module. Same shape as the other modules' key factories. */
export const restaurantKeys = {
  all: ['restaurants'] as const,
  list: () => ['restaurants', 'list'] as const,
  featured: (limit: number) => ['restaurants', 'featured', limit] as const,
  detail: (id: number) => ['restaurants', 'detail', id] as const,
};
