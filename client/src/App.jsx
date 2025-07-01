import { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    {/* fetch('http://localhost:5000/api/message') */}
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/message`)
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>React + Express</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
