if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((reg) => {
      console.log('SW Registration successful. Scope is ' + reg.scope);
    }).catch((error) => {
      console.log('SW Registration failed with ' + error);
    });
}
