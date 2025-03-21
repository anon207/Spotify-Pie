<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import fetchFunctions from "./components/fetchFunctions";
import chartFunctions from "./components/chartFunctions";

// Router and token management
const router = useRouter();
const token = ref(localStorage.getItem("spotify_token") || null);
const topSongs = ref([]);
const topArtists = ref([]);
const topGenres = ref([]);
const timeRangeData = ref({ short_term: [], medium_term: [], long_term: [] });

// globals
let globalAlbumNames = [];
let globalAlbumArtists = [];
let pieChartInstance; 
let chartInstance;

const selectedChart = ref("line");

// Theme management
const theme = ref(localStorage.getItem("theme") || "light");

function updateChartFontColor(chart, theme) {
  if (!chart) {
    console.error("Chart instance is null or undefined.");
    return;
  }

  const fontColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  if (chart.options?.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = fontColor;
  }
  if (chart.options?.plugins?.tooltip) {
    chart.options.plugins.tooltip.bodyColor = fontColor;
  }
  if (chart.options?.scales?.x?.ticks) {
    chart.options.scales.x.ticks.color = fontColor;
  }
  if (chart.options?.scales?.y?.ticks) {
    chart.options.scales.y.ticks.color = fontColor;
  }
  if (chart.options?.scales?.x?.title) {
    chart.options.scales.x.title.color = fontColor;
  }
  if (chart.options?.scales?.y?.title) {
    chart.options.scales.y.title.color = fontColor;
  }

  chart.update('none');
}

function updateChartFontColorInBarChart(chart, theme, albumNames, albumArtists) {
  if (!chart) {
    console.error("Chart instance is null or undefined.");
    return;
  }

  const fontColor = theme === "dark" ? "#FFFFFF" : "#000000";

  if (chart.options?.plugins?.legend?.labels) {
    chart.options.plugins.legend.labels.color = fontColor;

    if (selectedChart.value === "bar") {
      chart.options.plugins.legend.labels.generateLabels = function (chart) {
        return albumNames.map((album, index) => ({
          text: `${album} - ${albumArtists[index]}`,
          fillStyle: chart.data.datasets[0].backgroundColor[index],
          fontColor: fontColor,
          hidden: false,
          index: index
        }));
      };
    }
  }

  chart.update("none");
}

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
  
  document.body.className = theme.value;
  
  if (chartInstance) {
    updateChartFontColor(chartInstance, theme.value);
    if(selectedChart.value === "bar") {
      updateChartFontColorInBarChart(chartInstance, theme.value, globalAlbumNames, globalAlbumArtists)
    }
  }
  if (pieChartInstance) {
    updateChartFontColor(pieChartInstance, theme.value);
  }
};

// Chart functions
const showLineChart = () => {
  selectedChart.value = "line";
  chartInstance = chartFunctions.renderLineChart(chartInstance, timeRangeData);
  updateChartFontColor(chartInstance, theme.value);
};

const showAreaChart = async () => {
  selectedChart.value = "area";
  chartInstance = await chartFunctions.renderAreaChart(chartInstance, token);
  updateChartFontColor(chartInstance, theme.value);
};

const showBarChart = async () => {
  selectedChart.value = "bar";
  await nextTick();
  const { chartInstance: newChartInstance, albumNames, albumArtists } = await chartFunctions.renderBarChart(chartInstance, token);
  globalAlbumNames = albumNames;
  globalAlbumArtists = albumArtists;
  chartInstance = newChartInstance;
  updateChartFontColor(chartInstance, theme.value);
  updateChartFontColorInBarChart(chartInstance, theme.value, albumNames, albumArtists)
}

// Extract token from URL
const getTokenFromUrl = () => {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const expiresIn = params.get("expires_in");

  if (accessToken && expiresIn) {
    const expiryTime = Date.now() + Number(expiresIn) * 1000;
    localStorage.setItem("spotify_token", accessToken);
    localStorage.setItem("spotify_token_expiry", expiryTime.toString());
    token.value = accessToken;
    window.location.hash = "";
  } else {
    console.log("No token found in URL hash.");
  }
};

watch(topGenres, () => {
  if (topGenres.value.length > 0) {
    pieChartInstance = chartFunctions.renderPieChart(pieChartInstance, topGenres);
    updateChartFontColor(pieChartInstance, theme.value);
  }
});

// Logout function
const logout = () => {
  localStorage.removeItem("spotify_token");
  localStorage.removeItem("spotifyUserId");
  localStorage.removeItem("spotify_token_expiry");
  token.value = null;
  router.push("/");
};

// On page load, get token & fetch data
onMounted(async () => {
  const savedTheme = localStorage.getItem("theme") || "light";
  theme.value = savedTheme;
  document.body.className = savedTheme; 

  getTokenFromUrl();

  if (token.value) {
    await fetchFunctions.fetchTopSongs(token, topSongs);

    await fetchFunctions.fetchTopArtists(token, topArtists, topGenres);

    await fetchFunctions.fetchTopArtistsByTimeRange(token, timeRangeData);

    chartInstance = chartFunctions.renderLineChart(chartInstance, timeRangeData);
    updateChartFontColor(chartInstance, theme.value);

  } else {
    console.log("No valid token found. Redirecting to login...");
    router.push("/");
  }
});
</script>

<template>
  <div :class="theme">
    <div class="top-container">
      <!-- Top 10 Songs -->
      <div class="top-list border">
        <h2>Your Top 10 Songs</h2>
        <ul v-if="topSongs.length">
          <li v-for="song in topSongs" :key="song.id">
            <img :src="song.album.images[0].url" width="50" height="50" alt="Album Cover" />
            <span>{{ song.name }} - {{ song.artists[0].name }}</span>
          </li>
        </ul>
        <p v-else>Loading top songs...</p>
      </div>

      <!-- Top 10 Artists -->
      <div class="top-list border">
        <h2>Your Top 10 Artists</h2>
        <ul v-if="topArtists.length">
          <li v-for="artist in topArtists.slice(0, 10)" :key="artist.id">
            <img :src="artist.images[0]?.url" width="50" height="50" alt="Artist Image" />
            <span>{{ artist.name }}</span>
          </li>
        </ul>
        <p v-else>Loading top artists...</p>
      </div>

      <!-- Pie Chart -->
      <div class="pieChart-container border">
        <h2>Your Top 20 Genres</h2>
        <canvas id="myChart"></canvas>
      </div>
    </div>

    <!-- Conditionally render the selected chart -->
    <div v-if="selectedChart === 'line'" class="lineChart-container border">
      <h2>Your Top 10 Artist Rankings Over Time</h2>
      <canvas id="myLineChart"></canvas>
    </div>

    <div v-if="selectedChart === 'area'" class="lineChart-container border">
      <h2>Your Top Genres Over Time</h2>
      <canvas id="myAreaChart"></canvas>
    </div>

    <div v-if="selectedChart === 'bar'" class="lineChart-container border">
      <h2>Your Top 5 Albums</h2>
      <canvas id="myBarChart"></canvas>
    </div>

    <!-- Buttons to switch graph -->
    <div class="button-container">
      <button @click="showLineChart">Top artists over time (linechart)</button>
      <button @click="showAreaChart">Top genres over time (areachart)</button>
      <button @click="showBarChart">Top 5 Albums (barchart)</button>
    </div>

    <!-- Toggle theme button -->
    <div class="button-container">
      <button @click="toggleTheme">Switch to {{ theme === 'light' ? 'Dark' : 'Light' }} Mode</button>
    </div>

    <div class="button-container">
      <button v-if="!token" @click="router.push('/')">Go to Login (token expired)</button>
      <button @click="logout">Sign Out</button>
    </div>
  </div>
</template>

<style>
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/*Defualt styles*/
.border {
  border: 2px solid #1DB954;
  border-radius: 10px;
  background-color: #f8f9fa;
}

.pieChart-container,
.lineChart-container,
.top-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: #f8f9fa;
  height: 90%;
  padding: 15px;
  color: #000;
}

.pieChart-container h2,
.lineChart-container h2,
.top-list h2 {
  background-color: #f8f9fa;
  text-align: center;
  padding: 15px;
  margin: 0;
  width: 100%;
  color: #000;
}

.pieChart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background-color: #f8f9fa;
  text-align: center;
}

.pieChart-container canvas {
  background: #f8f9fa;
  width: 100% !important;
  height: 600px !important;
}

.top-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

li img {
  border-radius: 50%;
  margin-right: 10px;
}

.button-container button {
  padding-top: 10px;
  padding-bottom: 10px;
  padding-right: 5px;
  padding-left: 5px;
  margin: 5px;
}

.button-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.artist-image {
  border-radius: 50%;
  object-fit: cover;
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Light Mode Styles */
body.light .pieChart-container,
body.light .lineChart-container,
body.light .top-list {
  background-color: #f8f9fa;
  color: #000;
}

body.light .border {
  background-color: #f8f9fa;
  border: 2px solid #1DB954;
}

body.light h2 {
  color: #000;
}

body.light {
  background-color: #ffffff;
  color: #000;
}

body.light .button-container button {
  background-color: #1DB954;
  color: white;
  border: 2px solid #1AA34A;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body.light .button-container button:hover {
  background-color: #1AA34A;
  border-color: #17873C;
}

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

/* Dark Mode Styles */
body.dark .pieChart-container,
body.dark .lineChart-container,
body.dark .top-list {
  background-color: #333333;
  color: #fff;
}

body.dark .border {
  background-color: #444444;
  border: 2px solid #1DB954;
}

body.dark h2 {
  background-color: #444444;
  color: #fff;
}

body.dark .pieChart-container canvas {
  background: #444444;
}

body.dark {
  background-color: #222222;
  color: #fff;
}

body.dark .button-container button {
  background-color: #1DB954;
  color: white;
  border: 2px solid #1AA34A;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body.dark .button-container button:hover {
  background-color: #1AA34A;
  border-color: #17873C;
}

</style>
