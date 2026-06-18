import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // We group by player name to only get their top score
    const topScores = await prisma.score.groupBy({
      by: ['playerName'],
      _max: {
        score: true
      },
    });

    // Sort the results and take the top 10
    const sortedScores = topScores
      .map((s: any) => ({
        name: s.playerName,
        score: s._max.score || 0
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const formattedScores = sortedScores.map((s: { name: string, score: number }, index: number) => ({
      rank: index + 1,
      name: s.name,
      score: s.score,
      avatar: null, // No avatar since no Google Auth
    }));

    return NextResponse.json(formattedScores);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
