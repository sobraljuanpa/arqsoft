import http from 'k6/http';

export default function () {
  const url = 'http://localhost:3002/login';
  const payload = JSON.stringify({
    email: 'admin',
    password: 'admin',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post(url, payload, params);
}