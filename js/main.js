let restaurants;
let neighborhoods;
let cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods();
  fetchCuisines();
  initializeMapToggle();
  document.querySelectorAll('#neighborhoods-select,#cuisines-select').forEach(
    (el) => {
      el.addEventListener('change', updateRestaurants);
    }
  );
});

/**
 * Add event listener to toggle-map link
 */
initializeMapToggle = () => {
  document.querySelector('#toggle-map').addEventListener('click', (event) => {
    event.preventDefault();
    const map = document.querySelector('#map-container');
    if (event.target.dataset.show === 'false') {
      event.target.innerHTML = 'Hide results map';
      event.target.dataset.show = 'true';
    } else {
      event.target.innerHTML = 'Show results on map';
      event.target.dataset.show = 'false';
    }
    map.classList.toggle('hidden');
  });
};

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach((neighborhood) => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach((cuisine) => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood,
    (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach((m) => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant) => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  li.className = 'restaurant-container';

  const imgdiv = document.createElement('div');
  imgdiv.className = 'restaurant-img';

  const img = document.createElement('img');
  img.setAttribute('src', DBHelper.imageUrlForRestaurant(restaurant));
  img.setAttribute('alt', 'Restaurant ' + restaurant.name);

  imgdiv.append(img);
  li.append(imgdiv);

  const summarydiv = document.createElement('div');
  summarydiv.className = 'restaurant-summary';

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  summarydiv.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.className = 'neighborhood pill';
  neighborhood.innerHTML = restaurant.neighborhood;
  summarydiv.append(neighborhood);

  const address = document.createElement('p');
  address.className = 'address';
  address.innerHTML = restaurant.address;
  summarydiv.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.className = 'button';
  more.setAttribute('aria-label', 'View details of ' + restaurant.name);
  summarydiv.append(more);

  li.append(summarydiv);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach((restaurant) => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
