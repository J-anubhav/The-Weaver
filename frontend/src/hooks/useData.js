import { useState, useEffect } from 'react';

export function useData(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (url) {
      fetch(url)
        .then(res => res.json())
        .then(jsonData => {
          if (isMounted) {
            setData(jsonData.nodes); // Hum sirf 'nodes' array mein interested hain
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [url]);

  return data;
}