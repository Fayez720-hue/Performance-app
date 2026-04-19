addEventListener('fetch', (event) => {
  event.respondWith(new Response('ISOLATION SUCCESS: The runner is alive.', {
    headers: { 'content-type': 'text/plain' },
  }));
});
