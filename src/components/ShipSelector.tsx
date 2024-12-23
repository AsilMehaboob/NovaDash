import { useState, useEffect } from "react";
import Image from "next/image";

import Arrow_Left from "@/assets/icons/arrow_left.svg";
import Arrow_Right from "@/assets/icons/arrow_right.svg";

interface Ship {
  src: string;
  alt: string;
  name: string;
}

interface ShipSelectorProps {
  onShipSelect: (ship: Ship) => void;
  ships: Ship[];
}

export default function ShipSelector({
  onShipSelect,
  ships,
}: ShipSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? ships.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === ships.length - 1 ? 0 : prevIndex + 1
    );
  };

  useEffect(() => {
    onShipSelect(ships[currentIndex]);
  }, [currentIndex, onShipSelect, ships]);

  return (
    <div className="relative w-full">
      <div className="relative h-[110px] overflow-hidden rounded-lg">
        {ships.map((ship, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={ship.src}
              alt={ship.alt}
              className="block w-full h-full object-contain"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handlePrev}
        className="absolute top-0 left-[-12px] z-30 flex items-center justify-center h-full px-100 cursor-pointer group focus:outline-none"
      >
        <span className="inline-flex items-center justify-center w-10 h-10">
          <Image className="size-7 opacity-80" src={Arrow_Left} alt="<" />
          <span className="sr-only">Previous</span>
        </span>
      </button>
      <button
        onClick={handleNext}
        className="absolute top-0 right-[-12px] z-30 flex items-center justify-center h-full px-100 cursor-pointer group focus:outline-none"
      >
        <span className="inline-flex items-center justify-center w-10 h-10">
          <Image className="size-7 opacity-80" src={Arrow_Right} alt=">" />
          <span className="sr-only">Next</span>
        </span>
      </button>
    </div>
  );
}
