<script setup>
import { ref, onMounted } from 'vue'
const clientId = "9c9bd607f7294d8f976f67a6006e98e0"; // I know that doing this is a big oopsie but, I dont plan to use this app outside of this class.
const redirectUri = "http://localhost:5173/home";
const theme = ref(localStorage.getItem("theme") || "light");

// PRE:
// POST: scope is set, url is set
const loginWithSpotify = () => {
  const scope = "user-read-private user-read-email user-top-read user-library-read playlist-read-private playlist-read-collaborative";
  const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&show_dialog=true`;

  window.location.href = url;
};

// PRE:
// POST: set theme on mount, default is light.
onMounted( ()=>{
  const savedTheme = localStorage.getItem("theme") || "light";
  theme.value = savedTheme;
  document.body.className = theme.value;
})
</script>

<template>
  <div class="border3">
    <div class="button-container2">
      <img src="/SSS.png" width="200" height="200" alt="SSS" class="rounded-img"/>
      <button @click="loginWithSpotify" class="button-container2">Login with Spotify</button>
    </div>
  </div>
</template>

<style>
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

.rounded-img {
  border-radius: 50%;
  border: 2px solid white;
  margin-top: 10px;
  margin-right: 10px;
  margin-left: 10px;
  margin-bottom: 100px;
}

.login-style {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.border2 {
  border: 2px solid #1DB954;
  border-radius: 10px;
  background-color: #f8f9fa;
}

.border3 {
  border: 2px solid #1DB954;
  border-radius: 10px;
  height: 99vh;
  width: 99vw;
}

body, html {
  margin: 0;
  padding: 5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.button-container2 {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

body.light .button-container2 button {
  background-color: #1DB954;
  color: white;
  border: 2px solid #1AA34A;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body.light .button-container2 button:hover {
  background-color: #1AA34A;
  border-color: #17873C;
}

body.dark .button-container2 button {
  background-color: #1DB954;
  color: white;
  border: 2px solid #1AA34A;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

body.dark .button-container2 button:hover {
  background-color: #1AA34A;
  border-color: #17873C;
}
</style>