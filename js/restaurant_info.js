let restaurant;
var map;

document.onreadystatechange = () => {
  if (document.readyState === 'interactive') {
    fetchRestaurantFromURL((error) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        fillBreadcrumb();
      }
    });
  }
};

const initializeMap = () => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });
  self.map.addListener('tilesloaded', setMapTitle);
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
};

/**
 * Add Google map initialization to lazy loader, called from HTML.
 */
window.initMap = () => {
  const mapTarget = document.querySelector('#map');
  const lazy = new lazyLoader(() => {
    // prevent preloading maps before loading content unless page is scrolled
    if (document.readyState === 'complete' ||
    document.documentElement.scrollTop || document.body.scrollTop) {
      initializeMap();
      return true;
    } else {
      return false;
    }
  });
  if (lazy.isEnabled()) {
    lazy.observeEntry(mapTarget);
  } else {
    initializeMap();
  }
};

/**
 * Set title of map iframe
 */
const setMapTitle = () => {
  const mapFrame = document.getElementById('map').querySelector('iframe');
  mapFrame.setAttribute('title', 'Google maps with restaurant location');
};

/**
 * Set inner html and screen reader label of an element
 */
const setupElementWithLabel = (element, label, text) => {
  const labelE = document.createElement('span');
  labelE.className = 'sr-only';
  labelE.innerHTML = label;
  element.append(labelE);
  const textE = document.createTextNode(text);
  element.append(textE);
  return element;
};

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create picture tag for responsive and optimized images
 */
const createPictureTag = (restaurant) => {
  const imgBase = DBHelper.imageUrlForRestaurant(restaurant);
  const pictureTag = document.createElement('picture');
  const responsiveSet = [
    {
      media: '(max-width: 400px)',
      srcset: ['@400.jpg 1x', '.jpg 2x']
    },
    {
      media: '(max-width: 549px)',
      srcset: ['@550.jpg 1x', '.jpg 2x']
    },
    {
      media: '(min-width: 550px)',
      srcset: ['@400.jpg 1x', '.jpg 2x']
    }
  ];
  responsiveSet.forEach((set) => {
    const sourceTag = document.createElement('source');
    sourceTag.setAttribute('media', set.media);
    const srcset = [];
    set.srcset.forEach((img) => {
      srcset.push(`${imgBase}${img}`);
    });
    sourceTag.setAttribute('srcset', srcset.join(', '));
    pictureTag.append(sourceTag);
  });
  const imgTag = document.createElement('img');
  imgTag.setAttribute('src', `${imgBase}@550.jpg`);
  imgTag.setAttribute('alt', 'Restaurant ' + restaurant.name);
  pictureTag.append(imgTag);
  return pictureTag;
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  setupElementWithLabel(address, 'Address:', restaurant.address);

  const image = document.getElementById('restaurant-img');
  image.append(createPictureTag(restaurant));

  const cuisine = document.getElementById('restaurant-cuisine');
  setupElementWithLabel(cuisine, 'Cuisine:', restaurant.cuisine_type);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach((review) => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = document.createElement('li');

  const head = document.createElement('div');
  head.className = 'review-header';

  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.className = 'review-name';
  head.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  date.class = 'review-date';
  head.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'review-rating';
  head.appendChild(rating);

  li.appendChild(head);

  const body = document.createElement('div');
  body.className = 'review-body';

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  body.appendChild(comments);

  li.appendChild(body);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
