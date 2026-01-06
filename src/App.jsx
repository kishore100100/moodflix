import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  TextField,
} from "@mui/material";

const TMDB_API_KEY = "YOUR_KEY_WILL_BE_IN_VERCEL_ENV";

export default function App() {
  const [mood, setMood] = useState("");
  const [movies, setMovies] = useState([]);

  const fetchMovies = async () => {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_API_KEY}&with_genres=35`
    );
    const data = await res.json();
    setMovies(data.results || []);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">MoodFlix</Typography>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <TextField
          fullWidth
          label="How do you feel?"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
        />

        <Button sx={{ mt: 2 }} variant="contained" onClick={fetchMovies}>
          Analyze
        </Button>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {movies.map((m) => (
            <Grid item xs={6} md={3} key={m.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="240"
                  image={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                />
                <CardContent>
                  <Typography>{m.title}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
