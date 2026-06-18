import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerName = searchParams.get("playerName");

    if (!playerName) {
      return NextResponse.json({ error: "Missing playerName" }, { status: 400 });
    }

    const topScore = await prisma.score.findFirst({
      where: { playerName },
      orderBy: { score: 'desc' },
    });

    const highscore = topScore ? topScore.score : "N/A";

    // Calculate rank: count unique player names with a higher max score
    let rank: number | string = "N/A";
    if (topScore) {
      const betterScores = await prisma.score.groupBy({
        by: ['playerName'],
        _max: {
          score: true
        },
        having: {
          score: {
            _max: {
              gt: topScore.score
            }
          }
        }
      });
      rank = betterScores.length + 1;
    }

    return NextResponse.json({ highscore, rank });
  } catch (error) {
    console.error("Error fetching score:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { score, playerName } = await req.json();

    if (typeof score !== 'number' || !playerName) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const newScore = await prisma.score.create({
      data: {
        score,
        playerName,
      },
    });

    return NextResponse.json(newScore, { status: 201 });
  } catch (error) {
    console.error("Error saving score:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
