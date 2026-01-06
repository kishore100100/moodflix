import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Box,
  Alert,
  Tabs,
  Tab,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Fab from "@mui/material/Fab";

/*
  APPLE-STYLE FINAL POLISH (ALL SUGGESTIONS IMPLEMENTED)
  =====================================================
  ✓ Frosted glass AppBar
  ✓ Large-title scroll behavior (Apple style)
  ✓ Reduced-motion accessibility toggle
  ✓ System reduced-motion detection
  ✓ Haptic-like micro-interactions (tap scale)
  ✓ Apple colors, typography, spacing
*/

const TMDB_API_KEY = "5bc2a0008038ad5bbf0bcb81cab2a06f";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const MOOD_CONFIG = {
  happy: { genres: "35", sort: "popularity.desc" },
  sad: { genres: "18", sort: "vote_average.desc" },
  excited: { genres: "28|12", sort: "popularity.desc" },
  relaxed: { genres: "10749|18", sort: "vote_average.desc" },
};

function parseMoodLocally(text) {
  const t = text.toLowerCase();
  const scores = { happy: 0, sad: 0, excited: 0, relaxed: 0 };
  if (/happy|joy|great|good|awesome|fun|smile/.test(t)) scores.happy += 3;
  if (/sad|down|lonely|depressed|cry|heartbroken|loss/.test(t)) scores.sad += 3;
  if (/action|thrill|hyped|energetic|adrenaline|intense/.test(t)) scores.excited += 3;
  if (/calm|relaxed|chill|peaceful|slow|quiet|tired/.test(t)) scores.relaxed += 3;
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

export default function App() {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored ? stored === "dark" : Boolean(prefersDark);
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    const stored = localStorage.getItem("reducedMotion");
    return stored ? stored === "true" : Boolean(prefersReducedMotion);
  });

  const [tab, setTab] = useState(0);
  const [mood, setMood] = useState(null);
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem("favorites") || "[]"));
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moodText, setMoodText] = useState("");
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showQuickBack, setShowQuickBack] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const sentinelRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("reducedMotion", String(reducedMotion));
  }, [reducedMotion]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: "#0A84FF" },
          secondary: { main: "#5E5CE6" },
          background: {
            default: darkMode ? "#000000" : "#F5F5F7",
            paper: darkMode ? "rgba(28,28,30,0.85)" : "#FFFFFF",
          },
          text: {
            primary: darkMode ? "#FFFFFF" : "#1D1D1F",
            secondary: darkMode ? "#A1A1A6" : "#6E6E73",
          },
        },
        shape: { borderRadius: 20 },
        typography: {
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
          h4: { fontWeight: 700 },
          h6: { fontWeight: 600 },
          button: { textTransform: "none", fontWeight: 600 },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                transition: reducedMotion ? "none" : "background-color .35s ease, color .35s ease",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                backdropFilter: "blur(16px)",
                transition: reducedMotion ? "none" : "transform .2s ease, box-shadow .2s ease",
                '&:active': reducedMotion ? {} : { transform: "scale(0.98)" },
              },
            },
          },
        },
      }),
    [darkMode, reducedMotion]
  );

  useEffect(() => {
    if (!mood || tab !== 0 || loading || !hasMore) return;
    const { genres, sort } = MOOD_CONFIG[mood];

    const fetchMovies = async () => {
      setLoading(true);
      try {
        const effectivePage = page === 1 ? Math.floor(Math.random() * 5) + 1 : page;
        const res = await fetch(
          `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genres}&sort_by=${sort}&page=${effectivePage}`
        );
        const data = await res.json();
        if (!data.results || data.results.length === 0) {
          setHasMore(false);
          return;
        }
        setMovies((prev) => (page === 1 ? data.results : [...prev, ...data.results]));
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [mood, page, tab]);

  useEffect(() => {
    if (!sentinelRef.current || loading || page === 1 || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setPage((p) => p + 1));
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading, page, hasMore]);

  useEffect(() => {
    const onScroll = () => {
      setShowQuickBack(window.scrollY > 400 && Boolean(mood));
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [mood]);

  useEffect(() => {
    if (!selectedMovie) return;
    fetch(`https://api.themoviedb.org/3/movie/${selectedMovie.id}/videos?api_key=${TMDB_API_KEY}`)
      .then((r) => r.json())
      .then((d) => setTrailerKey(d.results?.find((v) => v.site === "YouTube")?.key || null));
    fetch(`https://api.themoviedb.org/3/movie/${selectedMovie.id}/similar?api_key=${TMDB_API_KEY}`)
      .then((r) => r.json())
      .then((d) => setSimilar(d.results?.slice(0, 6) || []));
  }, [selectedMovie]);

  const toggleFavorite = (movie) => {
    setFavorites((prev) =>
      prev.find((m) => m.id === movie.id)
        ? prev.filter((m) => m.id !== movie.id)
        : [...prev, movie]
    );
  };

  const handleAnalyze = () => {
    if (!moodText.trim()) {
      setError("Please describe your mood first.");
      return;
    }
    setError(null);
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setMood(parseMoodLocally(moodText));
  };

  const handleSurprise = () => {
    const moods = Object.keys(MOOD_CONFIG);
    const random = moods[Math.floor(Math.random() * moods.length)];
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setMood(random);
  };

  const moodChips = useMemo(() => Object.keys(MOOD_CONFIG), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backdropFilter: "blur(20px)",
            backgroundColor: scrolled ? "rgba(0,0,0,0.65)" : "transparent",
            transition: reducedMotion ? "none" : "background-color .3s ease",
          }}
        >
          <Toolbar>
            {mood && (
              <IconButton color="inherit" onClick={() => setMood(null)}>
                <ArrowBackIcon />
              </IconButton>
            )}
            <Typography
              variant={scrolled ? "h6" : "h4"}
              sx={{ flexGrow: 1, transition: reducedMotion ? "none" : "font-size .25s ease" }}
            >
              MoodFlix
            </Typography>
            <IconButton color="inherit" onClick={() => setDarkMode((d) => !d)}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
            <Tab label="Discover" />
            <Tab label={`Liked (${favorites.length})`} />
          </Tabs>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          {tab === 0 && !mood && (
            <Fade in timeout={reducedMotion ? 0 : 500}>
              <Card sx={{ p: { xs: 3, md: 5 } }}>
                <Typography variant="h4" gutterBottom>
                  What’s your mood today?
                </Typography>
                <TextField
                  fullWidth
                  label="Describe how you feel"
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                />
                {error && <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>}
                <Box mt={3} display="flex" gap={1} flexWrap="wrap">
                  {moodChips.map((m) => (
                    <Chip key={m} label={m} onClick={() => setMood(m)} />
                  ))}
                </Box>
                <Box mt={4} display="flex" gap={2} alignItems="center">
                  <Button variant="contained" onClick={handleAnalyze}>Analyze mood</Button>
                  <Button variant="outlined" onClick={handleSurprise}>Surprise me</Button>
                  <FormControlLabel
                    control={<Switch checked={reducedMotion} onChange={() => setReducedMotion((r) => !r)} />}
                    label="Reduce motion"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </Card>
            </Fade>
          )}

          {tab === 0 && mood && (
            <Grid container spacing={3}>
              {movies.map((movie) => (
                <Grid item xs={6} md={3} key={movie.id}>
                  <Card onClick={() => setSelectedMovie(movie)} sx={{ cursor: "pointer" }}>
                    <CardMedia component="img" height="280" image={IMG_BASE + movie.poster_path} />
                    <CardContent>
                      <Typography variant="subtitle2" noWrap>{movie.title}</Typography>
                      <Typography variant="caption">⭐ {movie.vote_average.toFixed(1)}</Typography>
                    </CardContent>
                    <CardActions>
                      <IconButton onClick={(e) => { e.stopPropagation(); toggleFavorite(movie); }}>
                        {favorites.find((f) => f.id === movie.id) ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {loading && <CircularProgress />}
              <div ref={sentinelRef} />
            </Grid>
          )}

          {tab === 0 && mood && showQuickBack && (
            <Fab
              color="primary"
              onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" })}
              sx={{ position: "fixed", bottom: 24, right: 24 }}
            >
              <KeyboardArrowUpIcon />
            </Fab>
          )}
        </Container>

        <Dialog open={Boolean(selectedMovie)} onClose={() => { setSelectedMovie(null); setTrailerKey(null); setSimilar([]); }} fullWidth maxWidth="md">
          {selectedMovie && (
            <>
              <DialogTitle>{selectedMovie.title}</DialogTitle>
              <DialogContent>
                {trailerKey && (
                  <Box mb={2}>
                    <iframe width="100%" height="315" src={`https://www.youtube-nocookie.com/embed/${trailerKey}`} allowFullScreen />
                  </Box>
                )}
                <Typography variant="body2" gutterBottom>⭐ {selectedMovie.vote_average.toFixed(1)} · {selectedMovie.release_date?.slice(0,4)}</Typography>
                <Typography variant="body2" paragraph>{selectedMovie.overview}</Typography>
                {similar.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle1">Similar movies</Typography>
                    <Grid container spacing={2}>
                      {similar.map((m) => (
                        <Grid item xs={4} md={2} key={m.id}>
                          <Card onClick={() => setSelectedMovie(m)} sx={{ cursor: "pointer" }}>
                            <CardMedia component="img" height="120" image={IMG_BASE + m.poster_path} />
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
