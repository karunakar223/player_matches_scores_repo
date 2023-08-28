const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
let db = null;

const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server is Running at port: 3000");
    });
  } catch (error) {
    console.log(`Database Error is: ${error.message}`);
    process.exit(1);
  }
};

initializeDbServer();

const playerResObj = (resObj) => {
  return {
    playerId: resObj.player_id,
    playerName: resObj.player_name,
  };
};

app.get("/players/", async (req, res) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const players = await db.all(getPlayersQuery);
  res.send(players.map((eachPlayer) => playerResObj(eachPlayer)));
});

app.get("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  res.send(playerResObj(player));
});

app.put("/players/:playerId/", async (req, res) => {
  const { playerId } = req.params;
  const { playerName } = req.body;
  const updatePlayerQuery = `UPDATE 
                                    player_details
                                 SET 
                                    player_name = '${playerName}'
                                 WHERE 
                                    player_id = ${playerId};`;
  const player = await db.run(updatePlayerQuery);
  res.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (req, res) => {
  const { matchId } = req.params;
  const getMatchQuery = `SELECT 
  match_id AS matchId, 
  match,
  year
  FROM match_details WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  res.send(match);
});

app.get("/players/:playerId/matches/", async (req, res) => {
  const { playerId } = req.params;
  const getPlayerMatchesQuery = `SELECT 
        match_id AS matchId,
        match,
        year
   FROM player_match_score NATURAL JOIN match_details
   WHERE player_match_score.player_id = ${playerId};`;
  const matches = await db.all(getPlayerMatchesQuery);
  res.send(matches);
});

app.get("/matches/:matchId/players/", async (req, res) => {
  const { matchId } = req.params;
  const playedMatchesQuery = `
  SELECT 
    player_match_score.player_id AS playerId,
    player_name AS playerName
 FROM player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
 WHERE match_id = ${matchId};`;
  const matchesPlayed = await db.all(playedMatchesQuery);
  res.send(matchesPlayed);
});

app.get("/players/:playerId/playerScores", async (req, res) => {
  const { playerId } = req.params;
  const playerDetailsQuery = `SELECT 
        player_details.player_id as playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM player_details INNER JOIN player_match_score 
    ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;

  const details = await db.get(playerDetailsQuery);
  res.send(details);
});

module.exports = app;
