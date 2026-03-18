const http = require('http');
fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientSlug: 'nexus-chat',
    sessionId: 'test44',
    messages: [ { role: 'user', content: 'Hi' } ]
  })
}).then(async res => {
  console.log('STATUS:', res.status);
  console.log('HEADERS:', Object.fromEntries(res.headers.entries()));
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    process.stdout.write(decoder.decode(chunk));
  }
});
