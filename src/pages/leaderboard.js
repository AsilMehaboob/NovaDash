import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const { data, error } = await supabase
                .from('leaderboard')
                .select('rank, displayname, high_score')
                .order('rank', { ascending: true });

            if (error) {
                console.error('Error fetching leaderboard:', error);
            } else {
                setLeaderboard(data);
            }
        };

        fetchLeaderboard();
    }, []);

    return (
        <div>
            <h1>Leaderboard</h1>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>High Score</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboard.map((entry, index) => (
                        <tr key={index}>
                            <td>{entry.rank}</td>
                            <td>{entry.displayname}</td>
                            <td>{entry.high_score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
