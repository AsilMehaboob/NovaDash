import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/utils/supabaseClient"; // Ensure you're importing supabase correctly

import TITLE from "@/assets/images/title.png";
import Stars from "@/assets/images/stars.png";

import Navbar from "./SpecialNavbar";
import ShipSelector from "./ShipSelector";
import Game from "./Game";

import { ShipDetails } from "@/constants";

const StartPage = () => {
  const [selectedShip, setSelectedShip] = useState(ShipDetails[0]);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [userHighScore, setUserHighScore] = useState<number | null>(null);

  useEffect(() => {
    // Fetch user data from leaderboard
    const fetchUserData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(); // Correct way to get current logged-in user
      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }

      if (user) {
        const { data, error } = await supabase
          .from("leaderboard")
          .select("rank, high_score")
          .eq("displayname", user.user_metadata.full_name || user.email)
          .limit(1); // Limit to 1 if you want to handle just the first record

        if (error) {
          console.error("Error fetching user leaderboard data:", error.message);
        } else {
          // Handle multiple rows if needed, or just take the first one
          const firstEntry = data?.[0];
          setUserRank(firstEntry?.rank || null);
          setUserHighScore(firstEntry?.high_score || null);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleShipSelect = (ship: {
    src: string;
    alt: string;
    name: string;
  }) => {
    setSelectedShip(ship);
  };

  const startGame = () => {
    setIsGameStarted(true);
  };

  if (isGameStarted) {
    return <Game selectedShip={selectedShip} />;
  }

  return (
    <div className="flex relative bg-black max-w-md mx-auto max-h-screen pb-[16px] overflow-x-hidden flex-col items-center h-screen font-pixeboy">
      <Image
        src={Stars}
        alt="stars"
        className="absolute bg-cover h-full w-fit z-0"
      />
      <Navbar />

      <div className="flex relative items-center flex-col justify-between f-full">
        <Image
          src={TITLE}
          alt="DOODLE BLAST"
          className="max-w-[256px] mt-[148px]"
        />

        <div className="flex flex-col gap-[15px] scale-90">
          <div className="flex flex-col justify-center items-center gap-0">
            <p className="text-[30px] text-white mt-[6px]">Select Ship</p>
            <p className="text-skyblue_btn text-[18px] mt-[-7px]">
              {selectedShip.name || "No Ship Selected"}
            </p>
          </div>

          <div>
            <ShipSelector onShipSelect={handleShipSelect} ships={ShipDetails} />
          </div>
        </div>

        <div className="flex flex-col gap-[27px] mt-[-8px]">
          <div className="flex justify-center gap-[6px] items-center flex-col text-[18px]">
            <div className="text-center flex flex-col text-cherryPink_text">
              {/* Display the rank and high score */}
              <p>YOUR RANK: {userRank !== null ? userRank : "Loading..."}</p>
              <p className="mt-[-8px]">
                YOUR HIGH SCORE:{" "}
                {userHighScore !== null ? userHighScore : "Loading..."}
              </p>
            </div>

            <div className="text-center flex flex-col text-[16px]">
              <a
                href="/leaderboard"
                className="text-skyblue_btn underline underline-offset-2 "
              >
                VISIT LEADERBOARD
              </a>
              <a
                href="#"
                className="text-coralRed_btn cursor-pointer underline underline-offset-2 mt-[-5px]"
              >
                GO BACK
              </a>
            </div>
          </div>

          <div className="borderGradient scale-95 mt-[-16px]">
            <button onClick={startGame} className="specialBg">
              <p className="pt-[3.5px]">Start Game</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartPage;
