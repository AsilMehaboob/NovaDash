import React, { useState } from "react";
import Image from "next/image";

import TITLE from "@/assets/images/title.png";

import Navbar from "./SpecialNavbar";
import ShipSelector from "./ShipSelector";

const StartPage = ({ onStart }: { onStart: () => void }) => {
  const [selectedShip, setSelectedShip] = useState<{ src: string; alt: string }>({
    src: "",
    alt: "",
  });

  const handleShipSelect = (ship: { src: string; alt: string }) => {
    setSelectedShip(ship);
  };

  return (
    <div className="flex relative bg-darkIndigo_bg max-w-sm mx-auto max-h-screen pb-[10px] overflow-x-hidden flex-col gap-[18px] items-center h-screen font-pixeboy justify-between">
      <Navbar />

      <Image
        src={TITLE}
        alt="DOODLE BLAST"
        className="max-w-[256px] mt-[148px]"
      />

      <div className="flex flex-col gap-[15px] mt-[-16px] scale-90">
        <div className="flex flex-col justify-center items-center gap-0">
          <p className="text-[30px] text-white ">select ship</p>
          <p className="text-skyblue_btn text-[18px] mt-[-7px]">
            {selectedShip.alt || "No Ship Selected"}
          </p>
        </div>

        <div className="">
          <ShipSelector onShipSelect={handleShipSelect} />
        </div>
      </div>

      <div className="flex flex-col gap-[27px] mt-[-24px]">
        <div className="flex justify-center gap-[6px] items-center flex-col text-[18px]">
          <div className="text-center flex flex-col text-cherryPink_text">
            <p>YOUR RANK : 20XX</p>
            <p className="mt-[-8px]">YOUR HIGH SCORE : 4XX</p>
          </div>

          <div className="text-center flex flex-col text-[16px]">
            <a href="#" className="text-skyblue_btn underline underline-offset-2 ">
              VISIT LEADERBOARD
            </a>
            <a href="#" className="text-coralRed_btn cursor-pointer underline underline-offset-2 mt-[-5px]">
              GO BACK
            </a>
          </div>
        </div>

        <div className="borderGradient mb-[20px]">
          <button onClick={onStart} className="specialBg">
            <p className="pt-[3.5px]">Start Game</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
