/**
 * Common database helper functions.
 */
const restaurantsCache = new ObjectCache('restaurants');
const reviewsCache = new ObjectCache('reviews');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.message === 'cache_refresh') {
      // try to update cache
      const cacheinfo = event.data.cacheinfo;
      if (cacheinfo.target === 'restaurant') {
        DBHelper.fetchRestaurantById(cacheinfo.id, () => {});
      } else {
        DBHelper.fetchReviews(cacheinfo.id, () => {});
      }
    }
  });
};

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return 'http://localhost:1337';
  }

  /**
   * Get all restaurants from cache without fetch and cache update
   * Wait until cache is populated
   */
  static getRestaurants(callback, timeout = 200) {
    restaurantsCache.getAll().then((objects) => {
      if (objects.length < 10) {
        setTimeout(this.getRestaurants(callback, timeout * 2), timeout);
      } else {
        callback(null, objects);
      }
    })
    .catch(() => {
      this.fetchRestaurants(callback);
    });
  }

  /**
   * Fetch all restaurants and update cache
   */
  static fetchRestaurants(callback) {
    restaurantsCache.getAll().then((objects) => {
      if (objects.length >= 10) {
        callback(null, objects);
        callback = () => {}; // don't call callback again from fetch
      }
      fetch(this.DATABASE_URL + '/restaurants').then((response) => {
        response.json().then((json) => {
          callback(null, json);
          restaurantsCache.putAll(json);
        })
        .catch((error) => callback(error, null));
      })
      .catch((error) => callback(error, null));
    });
  }

  /**
   * Fetch all reviews and update cache
   */
  static fetchReviews(restaurantId, callback) {
    reviewsCache.getAll().then((objects) => {
      if (objects.length >= 1) {
        const reviews = objects.filter(
          (el) => el['restaurant_id'] == restaurantId
        );
        if (reviews.length > 0) {
          callback(null, reviews);
          callback = () => {}; // don't repeat callback on fetch
        }
      }
      fetch(this.DATABASE_URL + '/reviews/?restaurant_id=' + restaurantId)
      .then((response) => {
        response.json().then((json) => {
          callback(null, json);
          reviewsCache.putAll(json);
        })
        .catch((error) => callback(error, null));
      })
      .catch((error) => callback(error, null));
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    let gotFromCache = false;
    restaurantsCache.get(parseInt(id)).then((object) => {
      if (typeof object === 'object') {
        gotFromCache = true;
        callback(null, object);
      }
      if (gotFromCache) {
        callback = () => {};
      }
      fetch(this.DATABASE_URL + '/restaurants/' + id).then((response) => {
        if (response.status === 200) {
          response.json().then((json) => {
            callback(null, json);
            restaurantsCache.put(json);
          })
          .catch((error) => callback(error, null));
        } else if (response.status === 404) {
          callback('Restaurant does not exist', null);
        } else {
          callback(response.statusText, null);
        }
      })
      .catch((error) => callback(error, null));
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter((r) => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(
          (r) => r.neighborhood == neighborhood
        );
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood
   * with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine,
    neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter((r) => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter((r) => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.getRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP }
    );
    return marker;
  }

  /**
   * Toggle favorite
   */
  static toggleRestaurantFavorite(id, favorite) {
    return fetch(DBHelper.DATABASE_URL +
      `/restaurants/${id}/?is_favorite=${favorite}`,
      { method: 'PUT' }
    );
  }

  /**
   * Add new restaurant review
   */
  static addRestaurantReview(review) {
    return fetch(DBHelper.DATABASE_URL + '/reviews/', {
      method: 'POST',
      body: JSON.stringify(review)
    });
  }
}
