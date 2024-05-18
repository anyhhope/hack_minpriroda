import { useState, useEffect } from 'react';

const DeerAnimation = ({startPosition} : {startPosition : number}) => {
  const [position, setPosition] = useState(startPosition);
  const [rotation, setRotation] = useState(Math.random() * 360);
  const [direction, setDirection] = useState(1);
  const speed = Math.random() * 40 + 20;

  useEffect(() => {
    const leafInterval = setInterval(() => {
      setRotation(prevRotation => prevRotation + 1);
      setPosition(prevPosition => {
        const newX = prevPosition + 1 * direction;
        return newX > 400 ? 0 : newX;
      });
      setDirection(prevDirection => (Math.random() > 0.9 ? -prevDirection : prevDirection)); 
    }, speed); 

    return () => clearInterval(leafInterval);
  }, []);

  return (
    <div className="leaf-container" style={{ left: position }}>
      <div className="leaf" style={{ transform: `rotate(${rotation}deg)` }}>🦌</div>
    </div>
  );
};

export default DeerAnimation;
