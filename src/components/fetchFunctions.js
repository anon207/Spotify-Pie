
// Extracts genres from artists
const extractTopGenres = (artists, topGenres) => {
    const genreCount = {};
  
    artists.forEach((artist) => {
      artist.genres?.forEach((genre) => {
        genreCount[genre] = (genreCount[genre] || 0) + 1;
      });
    });
  
    topGenres.value = Object.entries(genreCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([genre, count]) => ({ genre, count }));
};

// Fetch top 200 artists and extract genres
const fetchTopArtists = async (token, topArtists, topGenres) => {
    if (!token.value) {
      console.log("No token found, redirecting to login...");
      router.push("/");
      return;
    }
  
    let allArtists = [];
    const limit = 50;
    const totalToFetch = 200;
  
    try {
      for (let offset = 0; offset < totalToFetch; offset += limit) {
        const res = await fetch(`https://api.spotify.com/v1/me/top/artists?limit=${limit}&offset=${offset}`, {
          headers: { Authorization: `Bearer ${token.value}` },
        });
  
        if (!res.ok) {
          const errorMessage = await res.text();
          console.error("Failed to fetch top artists:", errorMessage);
          throw new Error(errorMessage);
        }
  
        const data = await res.json();
        allArtists = allArtists.concat(data.items);
  
        if (data.items.length < limit) break;
      }
  
      topArtists.value = allArtists;
      extractTopGenres(allArtists, topGenres);
    } catch (error) {
      console.error(error);
    }
};

// Fetch top 10 songs
const fetchTopSongs = async (token, topSongs) => {
    if (!token.value) {
      console.log("No token found, redirecting to login...");
      router.push("/");
      return;
    }
  
    try {
      const res = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=10", {
        headers: { Authorization: `Bearer ${token.value}` },
      });
  
      if (!res.ok) throw new Error("Failed to fetch top songs");
  
      const data = await res.json();
      topSongs.value = data.items;
    } catch (error) {
      console.error(error);
    }
};

// Fetch top artists across different time ranges
const fetchTopArtistsByTimeRange = async (token, timeRangeData) => {
  if (!token.value) {
    router.push("/");
    return;
  }

  const timeRanges = ["short_term", "medium_term", "long_term"];
  try {
    for (const range of timeRanges) {
      const res = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${range}&limit=10`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });

      if (!res.ok) throw new Error(`Failed to fetch top artists (${range})`);

      const data = await res.json();
      timeRangeData.value[range] = data.items.map((artist, index) => ({
        name: artist.name,
        rank: index + 1,
        imageUrl: artist.images[0]?.url,
      }));
    }
  } catch (error) {
    console.error(error);
  }
};

// Fetch top genres across different time ranges
const fetchTopGenresByTimeRange = async (token) => {
  if (!token.value) {
    router.push("/");
    return;
  }

  let allShortTermArtists = [];
  let allMediumTermArtists = [];
  let allLongTermArtists = [];
  
  const limit = 50;
  const totalToFetch = 200;
  const timeRanges = ["short_term", "medium_term", "long_term"];

  try {
    for (const range of timeRanges) {
      let artists = [];
      
      for (let offset = 0; offset < totalToFetch; offset += limit) {
        const res = await fetch(
          `https://api.spotify.com/v1/me/top/artists?time_range=${range}&limit=${limit}&offset=${offset}`,
          {
            headers: { Authorization: `Bearer ${token.value}` },
          }
        );

        if (!res.ok) throw new Error(`Failed to fetch top artists for ${range}`);

        const data = await res.json();
        artists = artists.concat(data.items);

        if (data.items.length < limit) break;
      }

      // Assign artists to correct array
      if (range === "short_term") {
        allShortTermArtists = artists;
      } else if (range === "medium_term") {
        allMediumTermArtists = artists;
      } else {
        allLongTermArtists = artists;
      }
    }

    // Extract and count genres for each time range
    const processGenres = (artists) => {
      const genreCount = {};
      artists.forEach((artist) => {
        artist.genres?.forEach((genre) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      });

      return Object.entries(genreCount)
        .sort((a, b) => b[1] - a[1]) // Sort by count
        .slice(0, 5) // Take top 5 genres
        .map(([genre, count]) => ({ genre, count }));
    };

    const shortTermGenres = processGenres(allShortTermArtists);
    const mediumTermGenres = processGenres(allMediumTermArtists);
    const longTermGenres = processGenres(allLongTermArtists);

    return [shortTermGenres, mediumTermGenres, longTermGenres];

  } catch (error) {
    console.error(error);
    return [[], [], []]; // Return empty arrays in case of an error
  }
};


export default { fetchTopArtists, fetchTopSongs, fetchTopArtistsByTimeRange, fetchTopGenresByTimeRange };