import Chart from "chart.js/auto";
import fetchFunctions from "./fetchFunctions";

// Render genre pie chart of top genres
const renderPieChart = (pieChartInstance, topGenres) => {
  const ctx = document.getElementById("myChart");

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  const totalCount = topGenres.value.reduce((sum, g) => sum + g.count, 0);

  const genrePercentages = topGenres.value.map((g) =>
    ((g.count / totalCount) * 100).toFixed(1)
  );

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: topGenres.value.map((g, i) => `${g.genre} (${genrePercentages[i]}%)`),
      datasets: [{
          label: "Top Genres",
          data: genrePercentages,
          backgroundColor: [
            '#FF8C9D', '#66A5D9', '#FFD700', '#B2D8D8', '#A07BC9',
            '#FF9A3D', '#A8A8A8', '#D08AE2', '#B02B3C', '#1E9D9E',
            '#FFDA28', '#3A6B99', '#28B45C', '#FF6A13', '#D65AA8',
            '#006D73', '#5F60B9', '#9C2424', '#4C6F6E', '#D2543F'
          ],             
          hoverOffset: 20,
          borderWidth: .5,
        }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          align: "center",
          labels: { boxWidth: 20, font: { size: 12 }, color: "#000000" },
          onClick: null
        },
        tooltip: {
          callbacks: {
            label: ({ dataIndex }) => 
            `${topGenres.value[dataIndex].genre}: ${genrePercentages[dataIndex]}%`
            }
        },
      },
      layout: { padding: { bottom: 100, top: 20, left: 15, right: 15} }
    },
  });
  return (pieChartInstance);
};

// Function to render chart using artist ranks over time
const renderLineChart = (chartInstance, timeRangeData) => {
  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById("myLineChart");
  const { short_term, medium_term, long_term } = timeRangeData.value;

  // Collect unique artist names
  const allArtists = new Set([...short_term, ...medium_term, ...long_term].map(a => a.name));

  // Generate artist images
  const artistImages = Object.fromEntries(
    Array.from(allArtists).map(artist => [
      artist,
      [short_term, medium_term, long_term].map(
        term => {
          const url = term.find(a => a.name === artist)?.imageUrl || "";
          const img = new Image();
          img.src = url;
          img.width = img.height = 40;
          return img;
        }
      ),
    ])
  );

  // Prepare datasets
  const datasets = Array.from(allArtists).map((artist, index) => ({
    label: artist,
    data: [short_term, medium_term, long_term].map(
      term => term.find(a => a.name === artist)?.rank || null
    ),
    borderColor: `hsl(${index * 36}, 70%, 50%)`,
    fill: false,
    tension: 0.1,
    pointStyle: artistImages[artist],
    pointRadius: 20,
    pointHoverRadius: 25,
    pointHitRadius: 10,
  }));

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { labels: ["Short Term", "Medium Term", "Long Term"], datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", align: "center", labels: { boxWidth: 10, font: { size: 12 }, color: "#000000" }, onClick: null},
      },
      scales: {
        x: { title: { color: "#000000" }, ticks: { color: "#000000" } },
        y: {
          title: { display: true, text: "Rank (1 = Most Listened)", color: "#000000" },
          min: 0, max: 11, reverse: true, ticks: { stepSize: 1, color: "#000000" },
        },
      },
    },
  });
  return (chartInstance);
};


const renderAreaChart = async (chartInstance, token) => {
  const [shortTermGenres, mediumTermGenres, longTermGenres] = await fetchFunctions.fetchTopGenresByTimeRange(token);

  const ctx = document.getElementById("myAreaChart");

  const allGenres = new Set([
    ...shortTermGenres.map(g => g.genre),
    ...mediumTermGenres.map(g => g.genre),
    ...longTermGenres.map(g => g.genre),
  ]);

  console.log(allGenres)

  const genreList = Array.from(allGenres);

  const genreData = genreList.map((genre) => {
    return {
      label: genre,
      data: [
        shortTermGenres.find(g => g.genre === genre)?.count || 0,
        mediumTermGenres.find(g => g.genre === genre)?.count || 0,
        longTermGenres.find(g => g.genre === genre)?.count || 0,
      ],
      borderColor: getRandomColor(),
      backgroundColor: getRandomColor(0.2),
      borderWidth: 2,
      fill: true,
      tension: 0.4,
    };
  });

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["Short Term", "Medium Term", "Long Term"],
      datasets: genreData,
    },
    options: {
      plugins: { legend: { onClick: null, labels: { color: "#000000"} } },
      responsive: true,
      scales: {
        x: { title: { display: true, text: "Time Range", color: "#000000" }, ticks: { color: "#000000" } },
        y: { title: { display: true, text: "Genre Count", color: "#000000" }, ticks: { color: "#000000" } },
      },
    },
  });
  return(chartInstance)
};

// Function to generate random colors
const getRandomColor = (alpha = 1) => {
  const r = Math.floor(Math.random() * 128) + 127;
  const g = Math.floor(Math.random() * 128) + 127;
  const b = Math.floor(Math.random() * 128) + 127;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


// Bar chart to render a user's top albums
// get top 200 songs,
// map each song to its respective album keeping count of each albums "frequency" based on how many 
// user top songs fall into that album. - there could be bias for albums with more songs since albums
// with less songs can never beat the albums with more songs if a user registers all of an albums songs.
const renderBarChart = async (chartInstance, token) => {

  const fetchTop200Song = async (token) => {
    if (!token.value) {
      console.log("No token found");
      return;
    }
  
    let allSongs = [];
    const limit = 50;
    const totalToFetch = 200;
  
    try {
      for (let offset = 0; offset < totalToFetch; offset += limit) {
        const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=${limit}&offset=${offset}`, {
          headers: { Authorization: `Bearer ${token.value}` },
        });
  
        if (!res.ok) {
          const errorMessage = await res.text();
          console.error("Failed to fetch top songs:", errorMessage);
          throw new Error(errorMessage);
        }
  
        const data = await res.json();
        allSongs = allSongs.concat(data.items);
  
        if (data.items.length < limit) break;
      }
    } catch (error) {
      console.error(error);
    }
    return (allSongs)
  };

  allSongs = fetchTop200Song(token)

  const albumCounts = {};
  allSongs.forEach(song => {
    const albumName = song.album.name;
    if (albumCounts[albumName]) {
      albumCounts[albumName]++;
    } else {
      albumCounts[albumName] = 1;
    }
  });

  const sortedAlbums = Object.entries(albumCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const albumNames = sortedAlbums.map(([name]) => name);
  const albumCountsData = sortedAlbums.map(([, count]) => count);

}


export default { renderPieChart, renderLineChart, renderAreaChart }