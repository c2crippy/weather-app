
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const message = document.getElementById("message");
const weatherSection = document.getElementById("weather");

const weatherTypes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Heavy drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Heavy freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Heavy freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Rain showers", "🌦️"],
  81: ["Heavy showers", "🌧️"],
  82: ["Violent showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "🌨️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Severe thunderstorm", "⛈️"]
};

function getWeather(code) {
  return weatherTypes[code] || ["Unknown conditions", "🌡️"];
}

function formatDay(date) {
  return new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "short" }
  );
}

async function getWeatherForCity(city) {
  message.textContent = "Searching for city...";
  weatherSection.hidden = true;

  try {
    // Find the city's coordinates.
    const geoUrl = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );

    geoUrl.search = new URLSearchParams({
      name: city,
      count: "10",
      language: "en",
      format: "json"
    });

    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) throw new Error("City search failed.");

    const geoData = await geoResponse.json();
    if (!geoData.results?.length) {
      throw new Error("City not found. Try another name.");
    }

    const place = geoData.results[0];

    message.textContent = "Getting weather...";

    // Fetch current weather and five-day forecast.
    const weatherUrl = new URL(
      "https://api.open-meteo.com/v1/forecast"
    );

    weatherUrl.search = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m"
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min"
      ].join(","),
      timezone: "auto",
      forecast_days: "5"
    });

    const response = await fetch(weatherUrl);
    if (!response.ok) throw new Error("Weather request failed.");

    const data = await response.json();
    displayWeather(place, data);

    message.textContent = "";
    weatherSection.hidden = false;
  } catch (error) {
    message.textContent =
      error.message === "Failed to fetch"
        ? "Network error. Check your internet connection."
        : error.message;
  }
}

function displayWeather(place, data) {
  const current = data.current;
  const [description, icon] = getWeather(current.weather_code);

  document.getElementById("location").textContent =
    [place.name, place.admin1, place.country]
      .filter(Boolean)
      .join(", ");

  document.getElementById("date").textContent =
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

  document.getElementById("icon").textContent = icon;
  document.getElementById("temperature").textContent =
    `${Math.round(current.temperature_2m)}°C`;

  document.getElementById("description").textContent = description;

  document.getElementById("feels-like").textContent =
    Math.round(current.apparent_temperature);

  document.getElementById("humidity").textContent =
    `${current.relative_humidity_2m}%`;

  document.getElementById("wind").textContent =
    `${current.wind_speed_10m} km/h`;

  const forecast = document.getElementById("forecast");
  forecast.replaceChildren();

  data.daily.time.forEach((date, index) => {
    const [dayDescription, dayIcon] = getWeather(
      data.daily.weather_code[index]
    );

    const card = document.createElement("article");
    card.className = "day";

    const day = document.createElement("p");
    day.textContent = index === 0 ? "Today" : formatDay(date);

    const weatherIcon = document.createElement("div");
    weatherIcon.className = "forecast-icon";
    weatherIcon.textContent = dayIcon;
    weatherIcon.title = dayDescription;

    const high = document.createElement("strong");
    high.textContent =
      `${Math.round(data.daily.temperature_2m_max[index])}°`;

    const low = document.createElement("p");
    low.textContent =
      `${Math.round(data.daily.temperature_2m_min[index])}°`;

    card.append(day, weatherIcon, high, low);
    forecast.appendChild(card);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const city = input.value.trim();
  if (city) getWeatherForCity(city);
});

// Load Lagos when the app starts.
getWeatherForCity("Lagos");
