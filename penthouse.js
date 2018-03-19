const penthouse = require('penthouse');
const fs = require('fs');

penthouse({
  url: 'http://localhost:8000',
  css: './css/styles.css'
})
.then((criticalCss) => {
  fs.writeFileSync('./css/critical-main.css', criticalCss);
});

penthouse({
  url: 'http://localhost:8000/restaurant.html?id=1',
  css: './css/styles.css'
})
.then((criticalCss) => {
  fs.writeFileSync('./css/critical-detail.css', criticalCss);
});
