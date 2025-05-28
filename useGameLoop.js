import { useEffect, useRef } from 'react';

const useGameLoop = (callback, delay) => {
  const savedCallback = useRef();

  // Sauvegarde la dernière version de callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Déclenche la boucle
  useEffect(() => {
    if (delay !== null) {
      const interval = setInterval(() => {
        savedCallback.current();
      }, delay);
      return () => clearInterval(interval); // Nettoyage
    }
  }, [delay]);
};

export default useGameLoop;
